export type Lane = "circle" | "music" | "laughs" | "mix";
export type Kind = "video" | "photo" | "audio" | "text";
export type Audience = "public" | "friends" | "private";

export const POST_AUDIENCES: { id: Audience; label: string; description: string }[] = [
  { id: "public", label: "Public", description: "Visible to everyone in feed & explore" },
  { id: "friends", label: "Friends Only", description: "Only people in your circle" },
  { id: "private", label: "Only Me", description: "Private to your profile" },
];

export const LANES: { id: Lane; label: string }[] = [
  { id: "circle", label: "My Circle" },
  { id: "music", label: "Music" },
  { id: "laughs", label: "Laughs" },
  { id: "mix", label: "Mix" },
];

export const avatar = (n: number) => `https://i.pravatar.cc/150?img=${n}`;

export type User = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified?: boolean | undefined;
};

const USER_MAP = {
  yung: { id: "yung", name: "YungVibeZ", handle: "@yungvibez", avatar: avatar(11), verified: true },
  haha: { id: "haha", name: "Haha Hub", handle: "@hahahub", avatar: "😆" },
  nala: { id: "nala", name: "Nala Gold", handle: "@nalagold", avatar: avatar(47), verified: true },
  kito: { id: "kito", name: "Kito Beats", handle: "@kitobeats", avatar: avatar(12) },
  zuri: { id: "zuri", name: "Zuri", handle: "@zuri.k", avatar: avatar(45) },
  dre: { id: "dre", name: "Dre M.", handle: "@dre.moves", avatar: avatar(59) },
} satisfies Record<string, User>;

export type UserId = keyof typeof USER_MAP;
export const USERS: Record<UserId, User> = USER_MAP;
export const getUser = (id: string): User | undefined => (USER_MAP as Record<string, User>)[id];

export const PROFILES: User[] = [
  USER_MAP.yung,
  USER_MAP.nala,
  USER_MAP.kito,
  USER_MAP.zuri,
  USER_MAP.dre,
  USER_MAP.haha,
];

export type GridItem = {
  id: string;
  type: "video" | "photo" | "audio";
  src: string;
  likes: number;
};

export const GRID: GridItem[] = [
  {
    id: "grid-1",
    type: "video",
    src: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    likes: 342,
  },
  {
    id: "grid-2",
    type: "video",
    src: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    likes: 218,
  },
  {
    id: "grid-3",
    type: "video",
    src: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    likes: 504,
  },
  {
    id: "grid-4",
    type: "video",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    likes: 189,
  },
];

export type SuggestedPerson = {
  user: User;
  bio: string;
  vibeTag: string;
  mutuals: number;
  followers: number;
  nearYou?: boolean | undefined;
  sharedWith: User[];
};

export const SUGGESTED_PEOPLE: SuggestedPerson[] = [
  {
    user: USER_MAP.nala,
    bio: "Late night sets, Afrohouse edits & downtown visuals.",
    vibeTag: "#Visuals",
    mutuals: 14,
    followers: 14200,
    nearYou: true,
    sharedWith: [USER_MAP.zuri, USER_MAP.kito, USER_MAP.yung],
  },
  {
    user: USER_MAP.kito,
    bio: "808s, Rhodes chords, and unreleased log drum packs.",
    vibeTag: "#Producer",
    mutuals: 9,
    followers: 8900,
    nearYou: true,
    sharedWith: [USER_MAP.yung, USER_MAP.dre, USER_MAP.nala],
  },
  {
    user: USER_MAP.zuri,
    bio: "Film reels, rooftop sessions, and good energy.",
    vibeTag: "#Filmmaker",
    mutuals: 6,
    followers: 5400,
    nearYou: true,
    sharedWith: [USER_MAP.nala, USER_MAP.dre],
  },
  {
    user: USER_MAP.dre,
    bio: "Choreography, freestyle clips, and studio linkups.",
    vibeTag: "#Choreo",
    mutuals: 11,
    followers: 11300,
    nearYou: false,
    sharedWith: [USER_MAP.zuri, USER_MAP.kito, USER_MAP.haha],
  },
  {
    user: USER_MAP.yung,
    bio: "Creative director & sound curator on tumeni.",
    vibeTag: "#Curator",
    mutuals: 5,
    followers: 24800,
    nearYou: true,
    sharedWith: [USER_MAP.kito, USER_MAP.nala],
  },
  {
    user: USER_MAP.haha,
    bio: "Daily chaos, studio outtakes, and campus comedy.",
    vibeTag: "#Comedy",
    mutuals: 17,
    followers: 31500,
    nearYou: false,
    sharedWith: [USER_MAP.dre, USER_MAP.zuri, USER_MAP.kito],
  },
];

export const FRIEND_REQUESTS: SuggestedPerson[] = [
  {
    user: {
      id: "sora-req",
      name: "Sora Waves",
      handle: "@sora.wav",
      avatar: avatar(25),
      verified: true,
    },
    bio: "Analog synths & rooftop sessions every Friday.",
    vibeTag: "#Synths",
    mutuals: 8,
    followers: 9600,
    nearYou: true,
    sharedWith: [USER_MAP.kito, USER_MAP.nala, USER_MAP.yung],
  },
  {
    user: { id: "milo-req", name: "Milo 808", handle: "@milo808", avatar: avatar(33) },
    bio: "Sub bass designer & studio engineer.",
    vibeTag: "#Mixing",
    mutuals: 4,
    followers: 4100,
    nearYou: true,
    sharedWith: [USER_MAP.kito, USER_MAP.dre],
  },
];

export type SoundCategory = "Trending" | "Hip-Hop & R&B" | "Amapiano & Afrobeats" | "Lo-Fi & Chill";

export const SOUND_CATEGORIES: SoundCategory[] = [
  "Trending",
  "Hip-Hop & R&B",
  "Amapiano & Afrobeats",
  "Lo-Fi & Chill",
];

export type SoundTrack = {
  id: string;
  title: string;
  artist: string;
  category: SoundCategory;
  duration: string;
  cover: string;
  url: string;
  youtubeId?: string | undefined;
  source?: string | undefined;
};

export const TRENDING_SOUNDS: SoundTrack[] = [
  {
    id: "snd-1",
    title: "Water",
    artist: "Tyla",
    category: "Trending",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1e/c9/5b/1ec95bbc-a56f-cbef-070c-ddec9f4fdd3c/196871296205.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9a/62/e6/9a62e688-9080-feed-2411-cc793c4545cf/mzaf_4449175929344535361.plus.aac.p.m4a",
  },
  {
    id: "snd-2",
    title: "Not Like Us",
    artist: "Kendrick Lamar",
    category: "Trending",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/31/3a/3f/313a3fbc-bb8f-80c7-b5a2-e226869a38cd/24UMGIM51924.rgb.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2d/e0/e8/2de0e874-cd0b-e9a9-e876-76be13a86662/mzaf_12385336780649591409.plus.aac.p.m4a",
  },
  {
    id: "snd-3",
    title: "City Boys",
    artist: "Burna Boy",
    category: "Hip-Hop & R&B",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/01/ee/63/01ee6370-1805-15e4-de8c-293a889a39c/075679676351.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/63/42/9d/63429d7b-07e9-4c3c-8deb-a96719b9c436/mzaf_7227801979892688743.plus.aac.p.m4a",
  },
  {
    id: "snd-4",
    title: "Snooze",
    artist: "SZA",
    category: "Hip-Hop & R&B",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/62/93/13/6293132e-20ff-67ab-3d1f-96bb6797a6ba/196589564955.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b3/9b/ca/b39bca57-2627-1aec-77af-cbf551205394/mzaf_4430383240210492712.plus.aac.p.m4a",
  },
  {
    id: "snd-5",
    title: "Calm Down",
    artist: "Rema & Selena Gomez",
    category: "Amapiano & Afrobeats",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ee/f1/dc/eef1dc82-f516-fd0f-581c-3f952a0e2243/22UMGIM92113.rgb.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c3/c7/54/c3c754cd-6680-4818-9182-e08a719d59ba/mzaf_1190051474475595816.plus.aac.p.m4a",
  },
  {
    id: "snd-6",
    title: "Essence (feat. Tems)",
    artist: "Wizkid",
    category: "Amapiano & Afrobeats",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b0/09/8e/b0098ed0-ef53-f2b5-386a-c8e6181f3c8a/886448775256.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b3/dc/ba/b3dcba73-7f33-9abe-089c-73557a6dcb54/mzaf_16412591162283722395.plus.aac.p.m4a",
  },
  {
    id: "snd-7",
    title: "Tanzania (feat. Sino Msolo)",
    artist: "Uncle Waffles & Tony Duardo",
    category: "Amapiano & Afrobeats",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/df/fe/54/dffe545f-716a-2b46-8ee8-c5aeaeb68db7/757572933495.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ab/fd/25/abfd2533-3a55-ede0-8564-840ffb3806b4/mzaf_6356538675244338564.plus.aac.p.m4a",
  },
  {
    id: "snd-8",
    title: "Late Night Chill LoFi Beats",
    artist: "Lofi Chill Beats",
    category: "Lo-Fi & Chill",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a1/1b/b7/a11bb7fc-12c8-72f2-be48-3b3251e32808/4550796537175_cover.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1b/a1/26/1ba1268d-6536-353b-34cc-ae5d5f1d54da/mzaf_4348148378300859511.plus.aac.p.m4a",
  },
];

const CATEGORY_SEARCH_TERMS: Record<SoundCategory, string> = {
  Trending: "top hits 2024",
  "Hip-Hop & R&B": "hip hop rnb",
  "Amapiano & Afrobeats": "amapiano afrobeats",
  "Lo-Fi & Chill": "lofi chill beats",
};

export async function searchOnlineSongs(
  query: string,
  category: SoundCategory = "Trending",
  signal?: AbortSignal,
): Promise<SoundTrack[]> {
  const term = query.trim() || CATEGORY_SEARCH_TERMS[category];
  try {
    const apiRes = await fetch(
      `/api/music/search?q=${encodeURIComponent(query.trim())}&category=${encodeURIComponent(category)}`,
      signal ? { signal } : undefined,
    );
    if (apiRes.ok) {
      const payload = (await apiRes.json()) as { tracks?: SoundTrack[] };
      if (Array.isArray(payload.tracks) && payload.tracks.length > 0) {
        return payload.tracks.map((t) => ({
          ...t,
          cover: t.cover || TRENDING_SOUNDS[0]!.cover,
        }));
      }
    }
  } catch {
    /* Fall through to direct iTunes lookup if aborted/unavailable */
  }
  if (signal?.aborted) return [];
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=18`,
      signal ? { signal } : undefined,
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
    const items = data.results ?? [];
    const tracks: SoundTrack[] = [];
    for (const item of items) {
      if (!item.previewUrl || !item.trackName || !item.artistName) continue;
      tracks.push({
        id: `itunes-${item.trackId ?? crypto.randomUUID()}`,
        title: item.trackName,
        artist: item.artistName,
        category,
        duration: "0:30",
        cover: item.artworkUrl100 ?? item.artworkUrl60 ?? TRENDING_SOUNDS[0]!.cover,
        url: item.previewUrl,
        source: "Apple Music",
      });
    }
    return tracks;
  } catch {
    return [];
  }
}

export const FEELING_MOODS = [
  { emoji: "🎧", label: "In the Studio" },
  { emoji: "🔥", label: "Hyped" },
  { emoji: "🌙", label: "Late Night" },
  { emoji: "✨", label: "Blessed" },
  { emoji: "⚡", label: "Locked In" },
  { emoji: "😂", label: "Laughing" },
] as const;

export type Crew = {
  id: string;
  name: string;
  category: string;
  members: number;
  description: string;
  accent: string;
};

export const CREWS: Crew[] = [
  {
    id: "crew-amapiano",
    name: "Amapiano Producers",
    category: "Music & Sound",
    members: 1840,
    description: "Log drums, private-school piano loops, and late-night stems.",
    accent: "AP",
  },
  {
    id: "crew-laughs",
    name: "Campus Laughs",
    category: "Comedy & Memes",
    members: 3290,
    description: "Daily skits, reaction clips, and voice-note stories.",
    accent: "CL",
  },
  {
    id: "crew-nightowls",
    name: "Night Owls Studio",
    category: "Creators & Sessions",
    members: 960,
    description: "After-hours mixes, visual reels, and open-mic critiques.",
    accent: "NO",
  },
  {
    id: "crew-street",
    name: "Street Visuals",
    category: "Video & Film",
    members: 1410,
    description: "35mm night cuts, neon reflections, and city walk reels.",
    accent: "SV",
  },
];

export type StudioFilterOption = {
  id: string;
  label: string;
  emoji: string;
  css: string;
  canvasFilter: string;
  swatch: string;
  overlay?: string | undefined;
};

export const STUDIO_FILTERS: StudioFilterOption[] = [
  {
    id: "normal",
    label: "Natural",
    emoji: "✨",
    css: "",
    canvasFilter: "none",
    swatch: "from-zinc-400 via-zinc-600 to-zinc-900",
  },
  {
    id: "glam",
    label: "Glam Glow",
    emoji: "💫",
    css: "brightness-105 contrast-105 saturate-110",
    canvasFilter: "brightness(105%) contrast(105%) saturate(110%)",
    overlay: "bg-amber-400/10",
    swatch: "from-amber-200 via-amber-400 to-rose-300",
  },
  {
    id: "golden",
    label: "Golden Hour",
    emoji: "✨",
    css: "sepia-[0.35] saturate-160 brightness-105 contrast-105",
    canvasFilter: "sepia(35%) saturate(160%) brightness(105%) contrast(105%)",
    overlay: "bg-gradient-to-tr from-[#FFB800]/25 via-transparent to-[#FFB800]/15",
    swatch: "from-[#FFB800] via-orange-400 to-amber-700",
  },
  {
    id: "vintage",
    label: "Vintage 90s",
    emoji: "🎬",
    css: "sepia-[0.25] contrast-115 brightness-95 saturate-125",
    canvasFilter: "sepia(25%) contrast(115%) brightness(95%) saturate(125%)",
    overlay: "bg-amber-900/10",
    swatch: "from-amber-300 via-stone-500 to-stone-800",
  },
  {
    id: "cyber",
    label: "Cyber Neon",
    emoji: "⚡",
    css: "saturate-150 contrast-120 hue-rotate-[18deg]",
    canvasFilter: "saturate(150%) contrast(120%) hue-rotate(18deg)",
    overlay: "bg-gradient-to-tr from-cyan-500/15 via-transparent to-[#FFB800]/15",
    swatch: "from-cyan-400 via-indigo-500 to-[#FFB800]",
  },
  {
    id: "noir",
    label: "Moody Noir",
    emoji: "🖤",
    css: "grayscale contrast-135 brightness-95",
    canvasFilter: "grayscale(100%) contrast(135%) brightness(95%)",
    overlay: "bg-[#0A0A0C]/15",
    swatch: "from-zinc-200 via-zinc-600 to-black",
  },
  {
    id: "bronze",
    label: "Bronze Skin",
    emoji: "☀️",
    css: "sepia-[0.2] saturate-140 contrast-110",
    canvasFilter: "sepia(20%) saturate(140%) contrast(110%)",
    overlay: "bg-orange-500/10",
    swatch: "from-amber-400 via-amber-700 to-stone-900",
  },
  {
    id: "teal",
    label: "Cinematic Teal",
    emoji: "🎥",
    css: "contrast-115 saturate-135 hue-rotate-[-10deg]",
    canvasFilter: "contrast(115%) saturate(135%) hue-rotate(-10deg)",
    overlay: "bg-gradient-to-tr from-teal-500/15 via-transparent to-orange-500/10",
    swatch: "from-teal-400 via-cyan-700 to-orange-400",
  },
];

export function computeFilterCss(filter: StudioFilterOption, intensity = 100): string {
  if (filter.canvasFilter === "none" || intensity <= 0) return "none";
  const t = Math.max(0, Math.min(1, intensity / 100));
  if (t >= 0.99) return filter.canvasFilter;
  const parts: string[] = [];
  for (const token of filter.canvasFilter.split(/\s+/)) {
    const m = /^([a-z-]+)\((-?\d+(?:\.\d+)?)(%|deg)\)$/.exec(token);
    if (!m) continue;
    const fn = m[1]!;
    const val = Number(m[2]);
    const unit = m[3]!;
    const base = fn === "brightness" || fn === "contrast" || fn === "saturate" ? 100 : 0;
    const mixed = base + (val - base) * t;
    parts.push(`${fn}(${mixed.toFixed(1)}${unit})`);
  }
  return parts.length > 0 ? parts.join(" ") : "none";
}

export type VideoOverlay = {
  id: string;
  text: string;
  style: "classic" | "gold" | "pill" | "outline";
  color: string;
  position: "top" | "center" | "bottom";
};

export type VideoSticker = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type Comment = { id: string; user: User; text: string };
export type Post = {
  id: string;
  user: User;
  authorAccountId?: string | undefined;
  lane: Lane;
  kind: Kind;
  time: string;
  caption: string;
  tag?: string | undefined;
  media?: string | undefined;
  mediaStorageKey?: string | undefined;
  mediaIsVideo?: boolean | undefined;
  audience?: Audience | undefined;
  video?: string | undefined;
  audio?: string | undefined;
  soundUrl?: string | undefined;
  soundYoutubeId?: string | undefined;
  views?: number | undefined;
  duration?: string | undefined;
  track?: string | undefined;
  filterClass?: string | undefined;
  filterCss?: string | undefined;
  effectId?: string | undefined;
  playbackSpeed?: number | undefined;
  overlays?: VideoOverlay[] | undefined;
  stickers?: VideoSticker[] | undefined;
  mood?: string | undefined;
  likes: number;
  liked?: boolean | undefined;
  saved?: boolean | undefined;
  shares: number;
  comments: Comment[];
};

export const SEED_POSTS: Post[] = [
  {
    id: "post-1",
    user: USER_MAP.nala,
    lane: "circle",
    kind: "video",
    audience: "public",
    time: "18m ago",
    caption: "Midnight city cruise after the listening session.",
    tag: "#NightOut",
    video: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    media: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    mediaIsVideo: true,
    track: "Water — Tyla",
    soundUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9a/62/e6/9a62e688-9080-feed-2411-cc793c4545cf/mzaf_4449175929344535361.plus.aac.p.m4a",
    views: 14280,
    likes: 1312,
    shares: 89,
    comments: [
      { id: "c-1", user: USER_MAP.zuri, text: "That framing is unreal." },
      { id: "c-2", user: USER_MAP.kito, text: "Need the track ID from the outro!" },
    ],
  },
  {
    id: "post-2",
    user: USER_MAP.yung,
    lane: "mix",
    kind: "video",
    audience: "public",
    time: "45m ago",
    caption: "Studio visual teaser — full set drops Friday night.",
    tag: "#StayTuned",
    video: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    media: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    mediaIsVideo: true,
    track: "City Boys — Burna Boy",
    soundUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/63/42/9d/63429d7b-07e9-4c3c-8deb-a96719b9c436/mzaf_7227801979892688743.plus.aac.p.m4a",
    views: 9840,
    likes: 742,
    shares: 53,
    comments: [{ id: "c-2b", user: USER_MAP.dre, text: "Cannot wait for Friday." }],
  },
  {
    id: "post-3",
    user: USER_MAP.kito,
    lane: "music",
    kind: "audio",
    audience: "public",
    time: "1h ago",
    caption: "Late night rotation — warm vocals + deep log drum bounce.",
    tag: "#Afrohouse",
    audio:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b3/dc/ba/b3dcba73-7f33-9abe-089c-73557a6dcb54/mzaf_16412591162283722395.plus.aac.p.m4a",
    track: "Essence (feat. Tems) — Wizkid",
    duration: "0:30",
    likes: 486,
    shares: 64,
    comments: [{ id: "c-3", user: USER_MAP.yung, text: "Timeless rotation right here!" }],
  },
  {
    id: "post-4",
    user: USER_MAP.dre,
    lane: "circle",
    kind: "video",
    audience: "public",
    time: "2h ago",
    caption: "Quick warm-up clip before rehearsal. Sound on!",
    tag: "#Dance",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    media: "https://www.w3schools.com/html/mov_bbb.mp4",
    mediaIsVideo: true,
    track: "Original Audio — @dre.moves",
    views: 21600,
    likes: 1894,
    shares: 142,
    comments: [{ id: "c-4a", user: USER_MAP.nala, text: "Cleanest transition today." }],
  },
  {
    id: "post-5",
    user: USER_MAP.zuri,
    lane: "circle",
    kind: "text",
    audience: "public",
    time: "3h ago",
    caption:
      "Unpopular opinion: the best tracks never make it past the group chat voice notes. Drop your unfinished demos tonight.",
    tag: "#StayTuned",
    likes: 215,
    shares: 18,
    comments: [{ id: "c-4", user: USER_MAP.dre, text: "100% facts." }],
  },
  {
    id: "post-6",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "4h ago",
    caption: "Golden hour botanical garden reset between studio takes.",
    tag: "#GoodVibes",
    video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    media: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    mediaIsVideo: true,
    track: "Original Audio — @hahahub",
    views: 6410,
    likes: 518,
    shares: 34,
    comments: [],
  },
  {
    id: "post-7",
    user: USER_MAP.nala,
    lane: "mix",
    kind: "video",
    audience: "public",
    time: "6h ago",
    caption: "Weekend recap from the rooftop session.",
    tag: "#BeatMaker",
    video: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    media: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    mediaIsVideo: true,
    track: "Nala Gold — Rooftop Live",
    views: 18300,
    likes: 1520,
    shares: 112,
    comments: [],
  },
  {
    id: "post-8",
    user: USER_MAP.kito,
    lane: "music",
    kind: "video",
    audience: "public",
    time: "7h ago",
    caption: "Testing the deep bass synth bounce on studio monitors.",
    tag: "#StudioSession",
    video: "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
    media: "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
    mediaIsVideo: true,
    track: "Not Like Us — Kendrick Lamar",
    soundUrl: TRENDING_SOUNDS[1]!.url,
    views: 27400,
    likes: 2340,
    shares: 198,
    comments: [{ id: "c-8", user: USER_MAP.yung, text: "That low end hits crazy." }],
  },
  {
    id: "post-9",
    user: USER_MAP.zuri,
    lane: "mix",
    kind: "video",
    audience: "public",
    time: "8h ago",
    caption: "Ocean light and slow motion color grade test.",
    tag: "#Visuals",
    video: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
    media: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4",
    mediaIsVideo: true,
    track: "Snooze — SZA",
    soundUrl: TRENDING_SOUNDS[3]!.url,
    views: 15900,
    likes: 1410,
    shares: 94,
    comments: [{ id: "c-9", user: USER_MAP.nala, text: "Unreal tones on this cut." }],
  },
  {
    id: "post-10",
    user: USER_MAP.yung,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "10h ago",
    caption: "3D motion test before dropping tonight's main reel.",
    tag: "#Animation",
    video: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    media: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    mediaIsVideo: true,
    track: "Calm Down — Rema & Selena Gomez",
    soundUrl: TRENDING_SOUNDS[4]!.url,
    views: 32100,
    likes: 2890,
    shares: 215,
    comments: [{ id: "c-10", user: USER_MAP.dre, text: "Cinema mode activated!" }],
  },
  {
    id: "post-11",
    user: USER_MAP.dre,
    lane: "circle",
    kind: "video",
    audience: "public",
    time: "12h ago",
    caption: "Afternoon energy check — keep scrolling, more drops coming.",
    tag: "#FYP",
    video: "https://samplelib.com/lib/preview/mp4/sample-30s.mp4",
    media: "https://samplelib.com/lib/preview/mp4/sample-30s.mp4",
    mediaIsVideo: true,
    track: "Tanzania (feat. Sino Msolo) — Uncle Waffles & Tony Duardo",
    soundUrl: TRENDING_SOUNDS[6]!.url,
    views: 11200,
    likes: 960,
    shares: 67,
    comments: [],
  },
  {
    id: "post-12",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "14h ago",
    caption: "Weekend crew warmup — wait till the drop kicks in.",
    tag: "#Comedy",
    video: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    media: "https://media.w3.org/2010/05/bunny/trailer.mp4",
    mediaIsVideo: true,
    track: "Water — Tyla",
    soundUrl: TRENDING_SOUNDS[0]!.url,
    views: 19800,
    likes: 1745,
    shares: 130,
    comments: [{ id: "c-12", user: USER_MAP.kito, text: "Always bringing the vibes 😂" }],
  },
  {
    id: "post-13",
    user: USER_MAP.nala,
    lane: "music",
    kind: "video",
    audience: "public",
    time: "16h ago",
    caption: "Golden hour lens flare straight out of the studio.",
    tag: "#GoldenHour",
    video:
      "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    media:
      "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4",
    mediaIsVideo: true,
    track: "Essence (feat. Tems) — Wizkid",
    soundUrl: TRENDING_SOUNDS[5]!.url,
    views: 24300,
    likes: 2110,
    shares: 176,
    comments: [],
  },
  {
    id: "post-14",
    user: USER_MAP.kito,
    lane: "mix",
    kind: "video",
    audience: "public",
    time: "18h ago",
    caption: "Late night chill session with the crew.",
    tag: "#NightOwls",
    video: "https://filesamples.com/samples/video/mp4/sample_960x540.mp4",
    media: "https://filesamples.com/samples/video/mp4/sample_960x540.mp4",
    mediaIsVideo: true,
    track: "Late Night Chill LoFi Beats — Lofi Chill Beats",
    soundUrl: TRENDING_SOUNDS[7]!.url,
    views: 8740,
    likes: 690,
    shares: 41,
    comments: [],
  },
  {
    id: "post-15",
    user: USER_MAP.zuri,
    lane: "circle",
    kind: "video",
    audience: "public",
    time: "1d ago",
    caption: "Quick street visual from yesterday's walk.",
    tag: "#StreetCut",
    video: "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
    media: "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
    mediaIsVideo: true,
    track: "City Boys — Burna Boy",
    soundUrl: TRENDING_SOUNDS[2]!.url,
    views: 13400,
    likes: 1085,
    shares: 78,
    comments: [],
  },
];

export function canViewPost(
  post: Pick<Post, "user" | "audience" | "authorAccountId">,
  viewerId: string,
  friendIds: readonly string[],
) {
  if (post.user.id === viewerId || post.authorAccountId === viewerId) return true;
  if (!post.audience || post.audience === "public") return true;
  const authorId = post.authorAccountId ?? post.user.id;
  return post.audience === "friends" && friendIds.includes(authorId);
}

export function getVisiblePosts(posts: Post[], viewerId: string, friendIds: readonly string[]) {
  return posts.filter((post) => canViewPost(post, viewerId, friendIds));
}

export type VoiceNote = {
  duration: string;
  durationSec: number;
  src?: string | undefined;
};

export type ChatAttachment = {
  url: string;
  kind: "image" | "video";
  name?: string | undefined;
};

export type Msg = {
  id: string;
  from: string;
  text: string;
  time: string;
  read?: boolean | undefined;
  reactions?: string[] | undefined;
  post?: Post | undefined;
  voiceNote?: VoiceNote | undefined;
  media?: ChatAttachment | undefined;
};

export type Chat = {
  id: string;
  name: string;
  avatar: string;
  group?: boolean | undefined;
  online?: boolean | undefined;
  roster?: string | undefined;
  statusText?: string | undefined;
  muted?: boolean | undefined;
  messages: Msg[];
};

export const SEED_CHATS: Chat[] = [
  {
    id: "crew",
    name: "Night Owls Crew",
    avatar: "🦉",
    group: true,
    online: true,
    roster: "Zuri, Dre, Kito +2",
    statusText: "Studio Mode 🎧",
    messages: [
      {
        id: "m-1",
        from: "kito",
        text: "Just uploaded the new log drum bounce. Listen before midnight.",
        time: "10:14 PM",
        reactions: ["🔥", "👑"],
      },
      {
        id: "m-1b",
        from: "kito",
        text: "",
        time: "10:15 PM",
        voiceNote: {
          duration: "0:15",
          durationSec: 15,
          src: "https://samplelib.com/lib/preview/mp3/sample-15s.mp3",
        },
        reactions: ["💛"],
      },
      {
        id: "m-2",
        from: "zuri",
        text: "Pulling up to the studio in 20 — bringing the visual cut too.",
        time: "10:18 PM",
      },
      {
        id: "m-2b",
        from: "nala",
        text: "",
        time: "10:21 PM",
        post: SEED_POSTS[0],
        reactions: ["🔥"],
      },
      {
        id: "m-2c",
        from: "me",
        text: "Locked in. Dropping the final stems right after this set.",
        time: "10:23 PM",
        read: true,
      },
    ],
  },
  {
    id: "nala",
    name: "Nala Gold",
    avatar: avatar(47),
    online: true,
    roster: "@nalagold",
    statusText: "Studio Mode 🎧",
    messages: [
      {
        id: "m-3",
        from: "nala",
        text: "Loved your last drop — send the visual!",
        time: "9:40 PM",
        reactions: ["💛"],
      },
      {
        id: "m-3b",
        from: "me",
        text: "Sending the 9:16 master right now ✨",
        time: "9:42 PM",
        read: true,
      },
    ],
  },
  {
    id: "kito",
    name: "Kito Beats",
    avatar: avatar(12),
    online: true,
    roster: "@kitobeats",
    statusText: "Beat Lab Live",
    messages: [
      {
        id: "m-4",
        from: "kito",
        text: "Let's collab on a 15s snippet tonight.",
        time: "Yesterday",
      },
    ],
  },
];

export type LiveChatMsg = {
  id: string;
  user: string;
  avatar: string;
  text: string;
};

export type LiveStreamItem = {
  id: string;
  title: string;
  host: User;
  tag: string;
  videoUrl: string;
  audioUrl?: string | undefined;
  viewers: number;
  likes: number;
  initialChat: LiveChatMsg[];
};

export const LIVE_STREAMS: LiveStreamItem[] = [
  {
    id: "live-kito",
    title: "Midnight Beat Lab",
    host: USER_MAP.kito,
    tag: "#BeatLab",
    videoUrl: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    audioUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ab/fd/25/abfd2533-3a55-ede0-8564-840ffb3806b4/mzaf_6356538675244338564.plus.aac.p.m4a",
    viewers: 1420,
    likes: 4820,
    initialChat: [
      {
        id: "lc-1",
        user: "@nalagold",
        avatar: USER_MAP.nala.avatar,
        text: "That 808 bounce is crazy 🔥",
      },
      {
        id: "lc-2",
        user: "@zuri.k",
        avatar: USER_MAP.zuri.avatar,
        text: "Drop the stems in Night Owls!",
      },
      {
        id: "lc-3",
        user: "@dre.moves",
        avatar: USER_MAP.dre.avatar,
        text: "Need to choreograph to this tonight",
      },
    ],
  },
  {
    id: "live-nala",
    title: "Rooftop Visual Set",
    host: USER_MAP.nala,
    tag: "#Visuals",
    videoUrl: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    audioUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b3/9b/ca/b39bca57-2627-1aec-77af-cbf551205394/mzaf_4430383240210492712.plus.aac.p.m4a",
    viewers: 890,
    likes: 2340,
    initialChat: [
      {
        id: "lc-4",
        user: "@yungvibez",
        avatar: USER_MAP.yung.avatar,
        text: "Golden lighting looking cinematic 💛",
      },
      {
        id: "lc-5",
        user: "@kitobeats",
        avatar: USER_MAP.kito.avatar,
        text: "Sending the master mix right now",
      },
    ],
  },
  {
    id: "live-dre",
    title: "Late Night Rehearsal",
    host: USER_MAP.dre,
    tag: "#Dance",
    videoUrl: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
    audioUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2d/e0/e8/2de0e874-cd0b-e9a9-e876-76be13a86662/mzaf_12385336780649591409.plus.aac.p.m4a",
    viewers: 615,
    likes: 1690,
    initialChat: [
      {
        id: "lc-6",
        user: "@hahahub",
        avatar: USER_MAP.haha.avatar,
        text: "Footwork on point 💯",
      },
    ],
  },
];

export type LiveRoomConfig = {
  id: string;
  title: string;
  host: User;
  speakers: User[];
  listeners: User[];
  baseListeners: number;
  streamUrl: string;
  tag: string;
};

export const LIVE_ROOM: LiveRoomConfig = {
  id: "room-midnight-beat-lab",
  title: "Midnight Beat Lab",
  host: USER_MAP.kito,
  speakers: [USER_MAP.kito, USER_MAP.nala, USER_MAP.yung],
  listeners: [
    USER_MAP.zuri,
    USER_MAP.dre,
    USER_MAP.haha,
    { id: "l-1", name: "Sora", handle: "@sora.wav", avatar: avatar(25) },
    { id: "l-2", name: "Milo", handle: "@milo808", avatar: avatar(33) },
    { id: "l-3", name: "Taya", handle: "@taya.v", avatar: avatar(41) },
    { id: "l-4", name: "Jae", handle: "@jae.studio", avatar: avatar(52) },
    { id: "l-5", name: "Kairo", handle: "@kairo.fm", avatar: avatar(61) },
  ],
  baseListeners: 1420,
  streamUrl:
    "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ab/fd/25/abfd2533-3a55-ede0-8564-840ffb3806b4/mzaf_6356538675244338564.plus.aac.p.m4a",
  tag: "#BeatLab",
};

export const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);
