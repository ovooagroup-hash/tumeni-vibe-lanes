import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

type MusicSearchTrack = {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: string;
  cover: string;
  url: string;
  youtubeId?: string;
  source?: string;
};

const CATEGORY_TERMS: Record<string, string> = {
  Trending: "top hits 2025",
  "Hip-Hop & R&B": "hip hop rnb",
  "Amapiano & Afrobeats": "amapiano afrobeats",
  "Lo-Fi & Chill": "lofi chill beats",
};

function cleanMusicQuery(raw: string): string {
  return raw
    .replace(/\((official|lyric|audio|music)?\s*(video|audio|lyrics|visualizer|hd|4k)[^)]*\)/gi, "")
    .replace(
      /\[(official|lyric|audio|music)?\s*(video|audio|lyrics|visualizer|hd|4k)[^\]]*\]/gi,
      "",
    )
    .replace(/\b(official music video|official video|official audio|lyric video|lyrics)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSec(sec: number | undefined): string {
  if (!sec || !Number.isFinite(sec) || sec <= 0) return "0:30";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function normalizeKey(title: string, artist: string): string {
  const clean = (v: string) =>
    v
      .toLowerCase()
      .replace(/\(feat\.[^)]*\)|ft\..*/gi, "")
      .replace(/[^a-z0-9]/g, "");
  return `${clean(title)}::${clean(artist)}`;
}

async function fetchDeezer(term: string, category: string): Promise<MusicSearchTrack[]> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=15`,
      { signal: AbortSignal.timeout(4500) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: Array<{
        id?: number;
        title?: string;
        preview?: string;
        artist?: { name?: string };
        album?: { cover_medium?: string; cover?: string };
      }>;
    };
    return (data.data ?? [])
      .filter((item) => item.preview && item.title && item.artist?.name)
      .map((item) => ({
        id: `deezer-${item.id ?? crypto.randomUUID()}`,
        title: item.title!,
        artist: item.artist!.name!,
        category,
        duration: "0:30",
        cover: item.album?.cover_medium ?? item.album?.cover ?? "",
        url: item.preview!,
        source: "Deezer",
      }));
  } catch {
    return [];
  }
}

async function fetchItunes(term: string, category: string): Promise<MusicSearchTrack[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=15`,
      { signal: AbortSignal.timeout(4500) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<{
        trackId?: number;
        trackName?: string;
        artistName?: string;
        previewUrl?: string;
        artworkUrl100?: string;
        artworkUrl60?: string;
      }>;
    };
    return (data.results ?? [])
      .filter((item) => item.previewUrl && item.trackName && item.artistName)
      .map((item) => ({
        id: `itunes-${item.trackId ?? crypto.randomUUID()}`,
        title: item.trackName!,
        artist: item.artistName!,
        category,
        duration: "0:30",
        cover: item.artworkUrl100 ?? item.artworkUrl60 ?? "",
        url: item.previewUrl!,
        source: "Apple Music",
      }));
  } catch {
    return [];
  }
}

async function fetchAudius(term: string, category: string): Promise<MusicSearchTrack[]> {
  try {
    const res = await fetch(
      `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(term)}&limit=8`,
      { signal: AbortSignal.timeout(4500) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: Array<{
        id?: string;
        title?: string;
        duration?: number;
        user?: { name?: string };
        artwork?: { "150x150"?: string; "480x480"?: string };
      }>;
    };
    return (data.data ?? [])
      .filter((item) => item.id && item.title && item.user?.name)
      .map((item) => ({
        id: `audius-${item.id}`,
        title: item.title!,
        artist: item.user!.name!,
        category,
        duration: formatSec(item.duration),
        cover: item.artwork?.["150x150"] ?? item.artwork?.["480x480"] ?? "",
        url: `https://api.audius.co/v1/tracks/${encodeURIComponent(item.id!)}/stream`,
        source: "Audius",
      }));
  } catch {
    return [];
  }
}

function collectYtMusicRenderers(
  node: unknown,
  out: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const item of node) collectYtMusicRenderers(item, out);
    return out;
  }
  const obj = node as Record<string, unknown>;
  if (
    obj["musicResponsiveListItemRenderer"] &&
    typeof obj["musicResponsiveListItemRenderer"] === "object"
  ) {
    out.push(obj["musicResponsiveListItemRenderer"] as Record<string, unknown>);
  }
  for (const val of Object.values(obj)) {
    collectYtMusicRenderers(val, out);
  }
  return out;
}

function readYtRuns(col: unknown): string {
  const r = col as {
    musicResponsiveListItemFlexColumnRenderer?: { text?: { runs?: Array<{ text?: string }> } };
  };
  return (r?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [])
    .map((x) => x.text ?? "")
    .join("");
}

async function fetchYouTubeMusic(term: string, category: string): Promise<MusicSearchTrack[]> {
  try {
    const res = await fetch("https://music.youtube.com/youtubei/v1/search?prettyPrint=false", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: { clientName: "WEB_REMIX", clientVersion: "1.20241120.01.00" },
        },
        query: term,
      }),
      signal: AbortSignal.timeout(4500),
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const renderers = collectYtMusicRenderers(data);
    const out: MusicSearchTrack[] = [];

    for (const r of renderers) {
      const playlistItemData = r["playlistItemData"] as { videoId?: string } | undefined;
      const overlay = r["overlay"] as
        | {
            musicItemThumbnailOverlayRenderer?: {
              content?: {
                musicPlayButtonRenderer?: {
                  playNavigationEndpoint?: { watchEndpoint?: { videoId?: string } };
                };
              };
            };
          }
        | undefined;
      const videoId =
        playlistItemData?.videoId ??
        overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
          ?.playNavigationEndpoint?.watchEndpoint?.videoId;
      if (!videoId) continue;

      const cols = Array.isArray(r["flexColumns"]) ? r["flexColumns"] : [];
      const title = readYtRuns(cols[0]).trim();
      const metaRaw = readYtRuns(cols[1]).trim();
      if (!title) continue;

      const metaParts = metaRaw
        .split("•")
        .map((p) => p.trim())
        .filter(Boolean);
      const filteredParts = metaParts.filter(
        (p) => !/^(song|video|single|album|ep)$/i.test(p) && !/views$/i.test(p),
      );
      const durationMatch = metaParts.find((p) => /^\d+:\d{2}$/.test(p));
      const artist =
        filteredParts.find((p) => !/^\d+:\d{2}$/.test(p)) ?? metaParts[0] ?? "YouTube Music";

      const thumbObj = r["thumbnail"] as {
        musicThumbnailRenderer?: { thumbnail?: { thumbnails?: Array<{ url?: string }> } };
      };
      const thumbs = thumbObj?.musicThumbnailRenderer?.thumbnail?.thumbnails ?? [];
      const cover =
        thumbs[thumbs.length - 1]?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      out.push({
        id: `ytm-${videoId}`,
        title,
        artist,
        category,
        duration: durationMatch ?? "3:00",
        cover,
        url: "",
        youtubeId: videoId,
        source: "YouTube Music",
      });
      if (out.length >= 10) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function handleMusicSearch(url: URL): Promise<Response> {
  const rawQuery = (url.searchParams.get("q") ?? "").trim();
  const category = (url.searchParams.get("category") ?? "Trending").trim() || "Trending";
  const term = cleanMusicQuery(rawQuery) || rawQuery || CATEGORY_TERMS[category] || "top hits";
  const ytTerm = rawQuery || CATEGORY_TERMS[category] || "top hits";

  const [deezerRes, itunesRes, audiusRes, ytmRes] = await Promise.allSettled([
    fetchDeezer(term, category),
    fetchItunes(term, category),
    fetchAudius(term, category),
    fetchYouTubeMusic(ytTerm, category),
  ]);

  const deezer = deezerRes.status === "fulfilled" ? deezerRes.value : [];
  const itunes = itunesRes.status === "fulfilled" ? itunesRes.value : [];
  const audius = audiusRes.status === "fulfilled" ? audiusRes.value : [];
  const ytm = ytmRes.status === "fulfilled" ? ytmRes.value : [];

  const seen = new Set<string>();
  const combined: MusicSearchTrack[] = [];

  const pushUnique = (track: MusicSearchTrack) => {
    const key = normalizeKey(track.title, track.artist);
    if (seen.has(key)) return;
    seen.add(key);
    combined.push(track);
  };

  // Interleave Deezer & iTunes first for instant direct audio streams
  const maxDirect = Math.max(deezer.length, itunes.length);
  for (let i = 0; i < maxDirect; i++) {
    if (deezer[i]) pushUnique(deezer[i]!);
    if (itunes[i]) pushUnique(itunes[i]!);
  }

  // Enrich unmatched YouTube Music hits with Deezer stream lookup when possible, otherwise keep playable via youtubeId
  const unmatchedYtm = ytm.filter((t) => !seen.has(normalizeKey(t.title, t.artist))).slice(0, 5);
  if (unmatchedYtm.length > 0) {
    const resolved = await Promise.allSettled(
      unmatchedYtm.map(async (yt) => {
        const cleanLookup = cleanMusicQuery(`${yt.title} ${yt.artist}`);
        const dz = await fetchDeezer(cleanLookup, category);
        if (dz[0]?.url) {
          return { ...yt, url: dz[0].url, cover: yt.cover || dz[0].cover, source: "YouTube Music" };
        }
        return yt;
      }),
    );
    for (const r of resolved) {
      if (r.status === "fulfilled") pushUnique(r.value);
    }
  }

  for (const track of audius) pushUnique(track);

  return new Response(JSON.stringify({ tracks: combined.slice(0, 28) }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/music/search") {
        return await handleMusicSearch(url);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
