import "./lib/error-capture";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import type { SetupProfile } from "./components/tumeni/onboarding";

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

const TONE_GUIDES: Record<string, string> = {
  hype: "High energy, bold, modern street culture slang, exciting and viral without cringe.",
  chill: "Relaxed, late-night luxury aesthetic, smooth, minimal, warm and effortless.",
  deep: "Thoughtful, poetic, artistic reflection, grounded and introspective.",
  witty: "Clever, sharp humor, relatable punchline, confident and punchy.",
};

async function handleAiCaptions(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "AI caption polish is waiting for GEMINI_API_KEY in Settings > Secrets.",
      }),
      {
        status: 503,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }

  let body: { roughIdea?: unknown; tone?: unknown; mediaType?: unknown; category?: unknown };
  try {
    body = (await request.json()) as {
      roughIdea?: unknown;
      tone?: unknown;
      mediaType?: unknown;
      category?: unknown;
    };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const roughIdea = typeof body.roughIdea === "string" ? body.roughIdea.trim().slice(0, 280) : "";
  if (!roughIdea) {
    return new Response(JSON.stringify({ error: "Type a rough idea first so AI can polish it." }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const toneKey = typeof body.tone === "string" && TONE_GUIDES[body.tone] ? body.tone : "hype";
  const mediaType = typeof body.mediaType === "string" ? body.mediaType.slice(0, 32) : "video";
  const category = typeof body.category === "string" ? body.category.slice(0, 32) : "general";

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Rough idea for a ${mediaType} post in the "${category}" lane:\n"${roughIdea}"\n\nRequested tone: ${TONE_GUIDES[toneKey]}`,
      config: {
        systemInstruction:
          "You are the creative caption engine for tumeni., a dark-luxury social platform for comedy, amapiano, daily vlogs, sports, and music creators. Generate exactly 3 distinct, captivating captions. Each caption must stay under 140 characters and end with 2 or 3 relevant hashtags including #tumeni.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            captions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 polished social media captions with 2-3 hashtags each.",
            },
          },
          required: ["captions"],
        },
      },
    });

    const rawText = (response.text ?? "{}").trim();
    const parsed = JSON.parse(rawText) as { captions?: unknown };
    const captions = Array.isArray(parsed.captions)
      ? parsed.captions
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim())
          .slice(0, 3)
      : [];

    if (captions.length === 0) {
      return new Response(
        JSON.stringify({ error: "AI did not return any caption suggestions. Try again." }),
        {
          status: 502,
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    return new Response(JSON.stringify({ ok: true, captions }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.error("AI caption generation failed:", err);
    const rawMsg = err instanceof Error ? err.message : "";
    const friendly =
      rawMsg.includes("API_KEY_INVALID") || rawMsg.includes("API key not valid")
        ? "AI caption polish needs a valid GEMINI_API_KEY in Settings > Secrets."
        : rawMsg || "Failed to generate captions right now.";
    return new Response(
      JSON.stringify({
        error: friendly,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }
}

type StoredAuthUser = {
  uid: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  profile: SetupProfile | null;
  createdAt: number;
  updatedAt: number;
};

const SESSION_COOKIE_NAME = "tumeni_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const AUTH_DATA_DIR = path.resolve(process.cwd(), ".tumeni-data");
const AUTH_USERS_FILE = path.resolve(AUTH_DATA_DIR, "users.json");
if (!AUTH_USERS_FILE.startsWith(AUTH_DATA_DIR + path.sep)) {
  throw new Error("Invalid auth store path");
}

const globalForAuth = globalThis as typeof globalThis & {
  __tumeniSessionSecret?: string;
  __tumeniWriteQueue?: Promise<void>;
};

function getSessionSecret(): string {
  const fromEnv = process.env["SESSION_SECRET"]?.trim();
  if (fromEnv) return fromEnv;
  if (!globalForAuth.__tumeniSessionSecret) {
    globalForAuth.__tumeniSessionSecret = crypto.randomBytes(32).toString("hex");
  }
  return globalForAuth.__tumeniSessionSecret;
}

function jsonResponse(payload: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let originHost = "";
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const host = request.headers.get("host")?.trim().toLowerCase();
  return originHost === forwardedHost || originHost === host;
}

function isHttpsRequest(request: Request, url: URL): boolean {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  return forwardedProto === "https" || url.protocol === "https:";
}

function buildSessionCookie(
  token: string,
  request: Request,
  url: URL,
  maxAge = SESSION_MAX_AGE_SECONDS,
): string {
  const parts = [`${SESSION_COOKIE_NAME}=${token}`, "Path=/", "HttpOnly", `Max-Age=${maxAge}`];
  if (isHttpsRequest(request, url)) {
    parts.push("SameSite=None", "Secure", "Partitioned");
  } else {
    parts.push("SameSite=Lax");
  }
  return parts.join("; ");
}

function parseCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    if (part.slice(0, idx).trim() === name) {
      return part.slice(idx + 1).trim();
    }
  }
  return null;
}

function signSessionToken(uid: string): string {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payloadB64 = Buffer.from(JSON.stringify({ uid, exp }), "utf8").toString("base64url");
  const sigB64 = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sigB64}`;
}

function verifySessionToken(token: string | null): string | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  if (!payloadB64 || !sigB64) return null;

  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest("base64url");

  const sigBuf = Buffer.from(sigB64, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      uid?: unknown;
      exp?: unknown;
    };
    if (typeof parsed.uid !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return parsed.uid;
  } catch {
    return null;
  }
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = parts[1];
  const hexKey = parts[2];
  if (!salt || !hexKey) return false;
  try {
    const expected = Buffer.from(hexKey, "hex");
    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(password, salt, expected.length, (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

async function readAuthUsers(): Promise<StoredAuthUser[]> {
  try {
    const raw = await fs.readFile(AUTH_USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredAuthUser[]) : [];
  } catch {
    return [];
  }
}

function enqueueAuthWrite(task: () => Promise<void>): Promise<void> {
  const prev = globalForAuth.__tumeniWriteQueue ?? Promise.resolve();
  const next = prev.then(task, task);
  globalForAuth.__tumeniWriteQueue = next.catch(() => {});
  return next;
}

async function writeAuthUsers(users: StoredAuthUser[]): Promise<void> {
  await fs.mkdir(AUTH_DATA_DIR, { recursive: true });
  const tempFile = path.resolve(AUTH_DATA_DIR, `users.${crypto.randomUUID()}.tmp`);
  if (!tempFile.startsWith(AUTH_DATA_DIR + path.sep)) {
    throw new Error("Invalid temporary path");
  }
  await fs.writeFile(tempFile, JSON.stringify(users, null, 2), { encoding: "utf8", mode: 0o600 });
  await fs.rename(tempFile, AUTH_USERS_FILE);
}

function sanitizeSetupProfile(raw: unknown): SetupProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj["name"] === "string" ? obj["name"].trim().slice(0, 50) : "";
  const rawHandle = typeof obj["handle"] === "string" ? obj["handle"].trim().replace(/^@/, "") : "";
  const cleanHandle = rawHandle.replace(/[^a-zA-Z0-9_.]/g, "").slice(0, 24);
  if (!name || cleanHandle.length < 2) return null;

  const rawAvatar = typeof obj["avatar"] === "string" ? obj["avatar"].trim() : "";
  const avatar =
    rawAvatar.length <= 95000 &&
    (rawAvatar.startsWith("data:image/") || rawAvatar.startsWith("https://"))
      ? rawAvatar
      : "";
  const bio = typeof obj["bio"] === "string" ? obj["bio"].trim().slice(0, 160) : "";
  const location =
    typeof obj["location"] === "string"
      ? obj["location"].trim().replace(/\s+/g, " ").slice(0, 80)
      : "";
  const city =
    typeof obj["city"] === "string"
      ? obj["city"].trim().replace(/\s+/g, " ").slice(0, 60)
      : (location.split(",")[0] ?? location).trim().slice(0, 60);

  const strArray = (val: unknown, maxLen: number) =>
    Array.isArray(val)
      ? val
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim().slice(0, 64))
          .slice(0, maxLen)
      : [];

  return {
    name,
    handle: `@${cleanHandle}`,
    avatar,
    bio,
    location,
    city,
    interests: strArray(obj["interests"], 12),
    following: strArray(obj["following"], 500),
    friends: strArray(obj["friends"], 500),
  };
}

function isValidEmail(raw: string): boolean {
  return raw.length > 3 && raw.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

async function handleAuthRoutes(request: Request, url: URL): Promise<Response> {
  if (url.pathname === "/api/auth/session" && request.method === "GET") {
    const uid = verifySessionToken(
      parseCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME),
    );
    if (!uid) return jsonResponse({ user: null, profile: null });
    const users = await readAuthUsers();
    const user = users.find((u) => u.uid === uid);
    if (!user) return jsonResponse({ user: null, profile: null });
    return jsonResponse({ user: { uid: user.uid, email: user.email }, profile: user.profile });
  }

  if (url.pathname === "/api/auth/directory" && request.method === "GET") {
    const users = await readAuthUsers();
    const profiles = users
      .filter((u) => u.profile !== null)
      .map((u) => {
        const p = u.profile!;
        const firstInterest =
          p.interests[0]?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "Creator";
        return {
          uid: u.uid,
          name: p.name,
          handle: p.handle,
          avatar: p.avatar,
          bio: p.bio || "Creator on tumeni.",
          vibeTag: `#${firstInterest}`,
          location: p.location || p.city || "",
          city: p.city || "",
          followers: 0,
        };
      });
    return jsonResponse({ profiles });
  }

  if (!isSameOriginMutation(request)) {
    return jsonResponse({ error: "Cross-origin auth request rejected." }, 403);
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    return jsonResponse({ ok: true }, 200, {
      "set-cookie": buildSessionCookie("", request, url, 0),
    });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  if (url.pathname === "/api/auth/signup" && request.method === "POST") {
    const email = typeof body["email"] === "string" ? body["email"].trim() : "";
    const password = typeof body["password"] === "string" ? body["password"] : "";
    if (!isValidEmail(email)) {
      return jsonResponse({ error: "Enter a valid email address." }, 400);
    }
    if (password.length < 6 || password.length > 128) {
      return jsonResponse({ error: "Password must be 6–128 characters." }, 400);
    }

    const emailNormalized = email.toLowerCase();
    const passwordHash = await hashPassword(password);
    let created: StoredAuthUser | null = null;
    let duplicate = false;

    await enqueueAuthWrite(async () => {
      const users = await readAuthUsers();
      if (users.some((u) => u.emailNormalized === emailNormalized)) {
        duplicate = true;
        return;
      }
      const now = Date.now();
      created = {
        uid: `srv_${crypto.randomUUID()}`,
        email,
        emailNormalized,
        passwordHash,
        profile: null,
        createdAt: now,
        updatedAt: now,
      };
      await writeAuthUsers([created, ...users]);
    });

    if (duplicate || !created) {
      return jsonResponse(
        { error: "An account with this email already exists. Switch to Sign In to continue." },
        409,
      );
    }

    const signedUser = created as StoredAuthUser;
    const token = signSessionToken(signedUser.uid);
    return jsonResponse(
      { user: { uid: signedUser.uid, email: signedUser.email }, profile: null },
      201,
      { "set-cookie": buildSessionCookie(token, request, url) },
    );
  }

  if (url.pathname === "/api/auth/signin" && request.method === "POST") {
    const email = typeof body["email"] === "string" ? body["email"].trim() : "";
    const password = typeof body["password"] === "string" ? body["password"] : "";
    if (!isValidEmail(email) || !password) {
      return jsonResponse({ error: "Enter your email and password." }, 400);
    }

    const emailNormalized = email.toLowerCase();
    const users = await readAuthUsers();
    const existing = users.find((u) => u.emailNormalized === emailNormalized);
    if (!existing || !(await verifyPassword(password, existing.passwordHash))) {
      return jsonResponse(
        { error: "Incorrect email or password. Double-check your details and try again." },
        401,
      );
    }

    const token = signSessionToken(existing.uid);
    return jsonResponse(
      { user: { uid: existing.uid, email: existing.email }, profile: existing.profile },
      200,
      { "set-cookie": buildSessionCookie(token, request, url) },
    );
  }

  if (url.pathname === "/api/auth/profile" && request.method === "PUT") {
    const uid = verifySessionToken(
      parseCookieValue(request.headers.get("cookie"), SESSION_COOKIE_NAME),
    );
    if (!uid) {
      return jsonResponse({ error: "Please sign in again to save your profile." }, 401);
    }

    const profile = sanitizeSetupProfile(body["profile"]);
    if (!profile) {
      return jsonResponse({ error: "Enter a valid display name and @handle." }, 400);
    }

    let found = false;
    await enqueueAuthWrite(async () => {
      const users = await readAuthUsers();
      const idx = users.findIndex((u) => u.uid === uid);
      if (idx < 0) return;
      found = true;
      const next = [...users];
      next[idx] = {
        ...users[idx]!,
        profile,
        updatedAt: Date.now(),
      };
      await writeAuthUsers(next);
    });

    if (!found) {
      return jsonResponse({ error: "Account not found." }, 404);
    }
    return jsonResponse({ ok: true, profile });
  }

  return jsonResponse({ error: "Not found" }, 404);
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/~oauth/") || url.pathname === "/auth/callback") {
        return new Response(null, {
          status: 302,
          headers: {
            location: "/?oauth_notice=1",
            "cache-control": "no-store",
          },
        });
      }
      if (url.pathname.startsWith("/api/auth/")) {
        return await handleAuthRoutes(request, url);
      }
      if (url.pathname === "/api/music/search") {
        return await handleMusicSearch(url);
      }
      if (url.pathname === "/api/ai/captions") {
        return await handleAiCaptions(request);
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
