export type Lane = "circle" | "laughs" | "amapiano" | "vlog" | "sports" | "music" | "mix";
export type Kind = "video" | "photo" | "audio" | "text";
export type Audience = "public" | "friends" | "private";

export const POST_AUDIENCES: { id: Audience; label: string; description: string }[] = [
  { id: "public", label: "Public", description: "Visible to everyone in feed & explore" },
  { id: "friends", label: "Friends Only", description: "Only people in your circle" },
  { id: "private", label: "Only Me", description: "Private to your profile" },
];

export const LANES: { id: Lane; label: string }[] = [
  { id: "circle", label: "My Circle" },
  { id: "laughs", label: "Funny" },
  { id: "amapiano", label: "Amapiano" },
  { id: "vlog", label: "Vlogs & Blog" },
  { id: "sports", label: "Sports" },
  { id: "music", label: "Music" },
  { id: "mix", label: "Mix" },
];

export const FEED_CATEGORIES: { id: "all" | Lane; label: string; emoji: string }[] = [
  { id: "all", label: "For You", emoji: "✨" },
  { id: "laughs", label: "Funny", emoji: "😂" },
  { id: "amapiano", label: "Amapiano", emoji: "🎹" },
  { id: "vlog", label: "Vlogs & Blog", emoji: "📸" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "music", label: "Music", emoji: "🎵" },
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
  sora: { id: "sora", name: "Sora Waves", handle: "@sora.wav", avatar: avatar(25), verified: true },
  milo: { id: "milo", name: "Milo 808", handle: "@milo808", avatar: avatar(33) },
  taya: { id: "taya", name: "Taya V.", handle: "@taya.v", avatar: avatar(41), verified: true },
  jae: { id: "jae", name: "Jae Studio", handle: "@jae.studio", avatar: avatar(52) },
  kairo: { id: "kairo", name: "Kairo FM", handle: "@kairo.fm", avatar: avatar(61), verified: true },
  kairoWav: {
    id: "kairo-wav",
    name: "Kairo Beats",
    handle: "@kairo.wav",
    avatar: avatar(61),
    verified: true,
  },
  amapianoPlug: {
    id: "amapiano-plug",
    name: "The Groove Plug",
    handle: "@amapiano_plug",
    avatar: avatar(14),
    verified: true,
  },
  streetHeatSa: {
    id: "street-heat-sa",
    name: "Durban Visuals",
    handle: "@street_heat_sa",
    avatar: avatar(31),
    verified: true,
  },
  vocalLuxe: {
    id: "vocal-luxe",
    name: "Nia Rose",
    handle: "@vocal_luxe",
    avatar: avatar(44),
    verified: true,
  },
  amara: {
    id: "amara",
    name: "Amara Moves",
    handle: "@amara.dance",
    avatar: avatar(36),
    verified: true,
  },
} satisfies Record<string, User>;

export type CreatorProfileMeta = {
  bio: string;
  location: string;
  followers: number;
  following: number;
  coverGradient: string;
};

export const CREATOR_PROFILES: Record<string, CreatorProfileMeta> = {
  "kairo-wav": {
    bio: "Afro-tech & Amapiano producer · Cooking 3 AM stems & unreleased log drum drops.",
    location: "Johannesburg",
    followers: 184200,
    following: 142,
    coverGradient: "from-[#FFB800]/30 via-[#1E1A12] to-[#0A0A0C]",
  },
  "amapiano-plug": {
    bio: "The Groove Plug · Live DJ moments, private school piano & Konka crowds.",
    location: "Johannesburg",
    followers: 312000,
    following: 96,
    coverGradient: "from-amber-500/30 via-[#221610] to-[#0A0A0C]",
  },
  "street-heat-sa": {
    bio: "Urban streetwear edits, golden hour fits & coastal visual storytelling.",
    location: "Durban",
    followers: 94800,
    following: 215,
    coverGradient: "from-orange-500/25 via-[#1C1612] to-[#0A0A0C]",
  },
  "vocal-luxe": {
    bio: "Soul & R&B vocalist · Raw late-night booth takes, harmonies & live sessions.",
    location: "London",
    followers: 241500,
    following: 184,
    coverGradient: "from-rose-500/25 via-[#1C141A] to-[#0A0A0C]",
  },
  yung: {
    bio: "Creative director, pop culture blog & trending creator.",
    location: "Atlanta",
    followers: 24800,
    following: 190,
    coverGradient: "from-[#FFB800]/25 via-[#181612] to-[#0A0A0C]",
  },
  haha: {
    bio: "Daily comedy skits, pet chaos, and viral reactions.",
    location: "London",
    followers: 31500,
    following: 88,
    coverGradient: "from-amber-400/20 via-[#191610] to-[#0A0A0C]",
  },
  nala: {
    bio: "Amapiano sets, street dance edits & downtown visuals.",
    location: "Johannesburg",
    followers: 14200,
    following: 230,
    coverGradient: "from-[#FFB800]/25 via-[#1A1610] to-[#0A0A0C]",
  },
  kito: {
    bio: "Log drums, Rhodes chords, and midnight studio drops.",
    location: "Johannesburg",
    followers: 8900,
    following: 120,
    coverGradient: "from-cyan-500/20 via-[#121820] to-[#0A0A0C]",
  },
  zuri: {
    bio: "Daily vlogs, travel diaries, food spots & good energy.",
    location: "Cape Town",
    followers: 18400,
    following: 310,
    coverGradient: "from-teal-500/20 via-[#121A18] to-[#0A0A0C]",
  },
  dre: {
    bio: "Pickup hoops, football tricks, fitness & choreography.",
    location: "NYC",
    followers: 11300,
    following: 175,
    coverGradient: "from-orange-500/20 via-[#1A1512] to-[#0A0A0C]",
  },
  sora: {
    bio: "Analog synths & rooftop sessions every Friday.",
    location: "Lagos",
    followers: 9600,
    following: 144,
    coverGradient: "from-indigo-500/20 via-[#141422] to-[#0A0A0C]",
  },
  milo: {
    bio: "Sub bass designer & studio engineer.",
    location: "Johannesburg",
    followers: 4100,
    following: 98,
    coverGradient: "from-amber-500/20 via-[#181512] to-[#0A0A0C]",
  },
  taya: {
    bio: "Quick recipes, morning routines & concert front-row POVs.",
    location: "Toronto",
    followers: 16700,
    following: 205,
    coverGradient: "from-[#FFB800]/20 via-[#1A1812] to-[#0A0A0C]",
  },
  jae: {
    bio: "Midnight beats, Afrobeats rotations & comfort cooking.",
    location: "Accra",
    followers: 12400,
    following: 162,
    coverGradient: "from-emerald-500/20 via-[#121A15] to-[#0A0A0C]",
  },
  kairo: {
    bio: "Night drives, radio edits & city soundtracks.",
    location: "London",
    followers: 15900,
    following: 134,
    coverGradient: "from-sky-500/20 via-[#121620] to-[#0A0A0C]",
  },
  amara: {
    bio: "Amapiano choreography, fitness & street dance challenges.",
    location: "Pretoria",
    followers: 27400,
    following: 264,
    coverGradient: "from-[#FFB800]/25 via-[#1C1612] to-[#0A0A0C]",
  },
};

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
    src: "https://cdn.coverr.co/videos/coverr-dj-at-a-party-8079/720p.mp4",
    likes: 1342,
  },
  {
    id: "grid-2",
    type: "video",
    src: "https://cdn.coverr.co/videos/coverr-woman-dancing-in-the-street-7552/720p.mp4",
    likes: 918,
  },
  {
    id: "grid-3",
    type: "video",
    src: "https://cdn.coverr.co/videos/coverr-futuristic-car-speeding-in-neon-city/720p.mp4",
    likes: 2504,
  },
  {
    id: "grid-4",
    type: "video",
    src: "https://cdn.coverr.co/videos/coverr-dancing-in-room-with-graffiti-9584/720p.mp4",
    likes: 1189,
  },
  {
    id: "grid-5",
    type: "video",
    src: "https://cdn.coverr.co/videos/coverr-live-music-concert-5249/720p.mp4",
    likes: 1740,
  },
  {
    id: "grid-6",
    type: "video",
    src: "https://cdn.coverr.co/videos/coverr-a-guy-listening-to-music-while-flipping-through-vinyl-records-9836/720p.mp4",
    likes: 860,
  },
];

export type SuggestedPerson = {
  user: User;
  bio: string;
  vibeTag: string;
  location?: string | undefined;
  city?: string | undefined;
  mutuals: number;
  followers: number;
  nearYou?: boolean | undefined;
  sharedWith: User[];
};

export const SUGGESTED_PEOPLE: SuggestedPerson[] = [];

export const FRIEND_REQUESTS: SuggestedPerson[] = [];

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
  {
    id: "snd-9",
    title: "Fall",
    artist: "Davido",
    category: "Amapiano & Afrobeats",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/1e/c9/5b/1ec95bbc-a56f-cbef-070c-ddec9f4fdd3c/196871296205.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/43/26/76/43267638-733c-c6e6-2252-9d6f448d3061/mzaf_9692574823920042259.plus.aac.p.m4a",
  },
  {
    id: "snd-10",
    title: "Margaret",
    artist: "Major League DJz & Victony",
    category: "Amapiano & Afrobeats",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/df/fe/54/dffe545f-716a-2b46-8ee8-c5aeaeb68db7/757572933495.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/6c/33/59/6c3359ea-df07-105a-06d5-a679c6f2f48a/mzaf_8636066408385618982.plus.aac.p.m4a",
  },
  {
    id: "snd-11",
    title: "Lush Life",
    artist: "Zara Larsson",
    category: "Trending",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ee/f1/dc/eef1dc82-f516-fd0f-581c-3f952a0e2243/22UMGIM92113.rgb.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/77/52/6a/77526a57-f53f-b8ba-bdc7-e74e242c7c55/mzaf_11538198025885549610.plus.aac.p.m4a",
  },
  {
    id: "snd-12",
    title: "International Love",
    artist: "Pitbull & Chris Brown",
    category: "Hip-Hop & R&B",
    duration: "0:30",
    cover:
      "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/31/3a/3f/313a3fbc-bb8f-80c7-b5a2-e226869a38cd/24UMGIM51924.rgb.jpg/100x100bb.jpg",
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/25/73/61/25736155-2993-3277-72bb-6d4f2911eb6c/mzaf_17551155527966317730.plus.aac.p.m4a",
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
    id: "crew-laughs",
    name: "Daily Laughs & Memes",
    category: "Funny & Comedy",
    members: 4290,
    description: "Skits, pet chaos, fails, pranks, and funny reaction clips.",
    accent: "DL",
  },
  {
    id: "crew-amapiano",
    name: "Amapiano Groove",
    category: "Amapiano & Dance",
    members: 2840,
    description: "Log drums, private-school piano, dance challenges & sets.",
    accent: "AP",
  },
  {
    id: "crew-vlogs",
    name: "Vlogs, Food & Travel",
    category: "Lifestyle & Blog",
    members: 1960,
    description: "Morning routines, quick recipes, trip diaries, and fit checks.",
    accent: "VT",
  },
  {
    id: "crew-sports",
    name: "Street Sports & Active",
    category: "Sports & Fitness",
    members: 1410,
    description: "Pickup basketball, beach soccer, skate runs & workout logs.",
    accent: "SS",
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
  commentCount?: number | undefined;
  soundDropsCount?: string | undefined;
  comments: Comment[];
};

export function toSoundTrackFromPost(post: Post): SoundTrack {
  const rawTrack = post.track ?? `Original Audio — ${post.user.name}`;
  const parts = rawTrack.split(/\s+—\s+/);
  const title = parts[0]?.trim() || rawTrack;
  const artist = parts[1]?.trim() || post.user.name;
  return {
    id: `post-sound-${post.id}`,
    title,
    artist,
    category: post.lane === "amapiano" ? "Amapiano & Afrobeats" : "Trending",
    duration: post.duration ?? "0:30",
    cover: post.user.avatar?.startsWith("http") ? post.user.avatar : TRENDING_SOUNDS[0]!.cover,
    url: post.soundUrl ?? "",
    youtubeId: post.soundYoutubeId,
    source: "tumeni. Sound",
  };
}

export const SEED_POSTS: Post[] = [
  {
    id: "post-feat-1",
    user: USER_MAP.kairoWav,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "3m ago",
    caption: "Cooking that 3 AM baseline. Does this drop go hard or what? 🔥🔊",
    tag: "#Amapiano #StudioHeat #AfroTech",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaIsVideo: true,
    track: "Original Sound — Kairo Beats · Unreleased Stems",
    soundUrl: TRENDING_SOUNDS[9]!.url,
    soundDropsCount: "14.8K drops",
    views: 482000,
    likes: 48200,
    commentCount: 1240,
    shares: 8410,
    comments: [
      { id: "cf-1a", user: USER_MAP.amapianoPlug, text: "Drop the full stems right now 🔥🔊" },
      { id: "cf-1b", user: USER_MAP.vocalLuxe, text: "That log drum pocket is lethal!" },
    ],
  },
  {
    id: "post-feat-2",
    user: USER_MAP.amapianoPlug,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "9m ago",
    caption: "Crowd went crazy when the log drum dropped at Konka yesterday 🕺✨",
    tag: "#Amapiano #Konka #LiveSet",
    video:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    media:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    mediaIsVideo: true,
    track: "Mnike (Slowed + Reverb) — Tyler ICU",
    soundUrl: TRENDING_SOUNDS[6]!.url,
    soundDropsCount: "38.2K drops",
    views: 940500,
    likes: 94600,
    commentCount: 3118,
    shares: 15200,
    comments: [
      { id: "cf-2a", user: USER_MAP.kairoWav, text: "Konka floor never misses 🕺⚡" },
      { id: "cf-2b", user: USER_MAP.amara, text: "Need this slowed edit immediately!" },
    ],
  },
  {
    id: "post-feat-3",
    user: USER_MAP.streetHeatSa,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "14m ago",
    caption: "Golden hour fit check. Obsidian and amber only ⚡",
    tag: "#tumeni #outfit",
    video:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    media:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    mediaIsVideo: true,
    track: "Water (Club Mix) — Tyla",
    soundUrl: TRENDING_SOUNDS[0]!.url,
    soundDropsCount: "22.4K drops",
    views: 312000,
    likes: 32100,
    commentCount: 642,
    shares: 2930,
    comments: [
      { id: "cf-3a", user: USER_MAP.zuri, text: "Obsidian + amber palette is undefeated ⚡" },
    ],
  },
  {
    id: "post-feat-4",
    user: USER_MAP.vocalLuxe,
    lane: "music",
    kind: "video",
    audience: "public",
    time: "22m ago",
    caption: "Late night raw vocals in the booth. No autotune needed 🎙️✨",
    tag: "#SoulSession #Vocals #RnB",
    video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    media: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    mediaIsVideo: true,
    track: "Soul Session 04 — Nia Rose",
    soundUrl: TRENDING_SOUNDS[3]!.url,
    soundDropsCount: "19.1K drops",
    views: 589000,
    likes: 61400,
    commentCount: 1890,
    shares: 5600,
    comments: [
      { id: "cf-4a", user: USER_MAP.yung, text: "Pure velvet on the mic 🎙️✨" },
      { id: "cf-4b", user: USER_MAP.kairoWav, text: "Let's put this over an Afro-tech chord pad!" },
    ],
  },
  {
    id: "post-1",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "8m ago",
    caption: "POV: When a friendly snowball fight turns into a full-on ambush 😂❄️",
    tag: "#Funny #Comedy #WinterFails",
    video: "https://cdn.coverr.co/videos/coverr-snowball-fighting-in-the-forest-7136/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-snowball-fighting-in-the-forest-7136/720p.mp4",
    mediaIsVideo: true,
    track: "Original Comedy Audio — @hahahub",
    views: 94200,
    likes: 8910,
    shares: 1240,
    comments: [
      { id: "c-1", user: USER_MAP.zuri, text: "That second throw came out of nowhere 😂" },
      { id: "c-2", user: USER_MAP.dre, text: "Zero mercy out there lmao" },
    ],
  },
  {
    id: "post-2",
    user: USER_MAP.amara,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "18m ago",
    caption: "Amapiano street groove — wait for the log drum drop on the second beat 🎹🔥",
    tag: "#Amapiano #DanceChallenge",
    video: "https://cdn.coverr.co/videos/coverr-woman-dancing-in-the-street-7552/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-woman-dancing-in-the-street-7552/720p.mp4",
    mediaIsVideo: true,
    track: "Tanzania (feat. Sino Msolo) — Uncle Waffles & Tony Duardo",
    soundUrl: TRENDING_SOUNDS[6]!.url,
    views: 118400,
    likes: 11240,
    shares: 980,
    comments: [{ id: "c-2b", user: USER_MAP.nala, text: "Footwork cleaner than ever 🔥🎹" }],
  },
  {
    id: "post-3",
    user: USER_MAP.zuri,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "27m ago",
    caption: "Day in my life vlog: morning ocean air before editing all afternoon 🌊📸",
    tag: "#DailyVlog #LifestyleBlog",
    video: "https://cdn.coverr.co/videos/coverr-vlogger-greeting-audience-by-the-sea/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-vlogger-greeting-audience-by-the-sea/720p.mp4",
    mediaIsVideo: true,
    track: "Daily Vlog Audio — @zuri.k",
    views: 42100,
    likes: 3890,
    shares: 310,
    comments: [{ id: "c-3a", user: USER_MAP.taya, text: "Living the dream right now ✨" }],
  },
  {
    id: "post-4",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "41m ago",
    caption: "Testing the 'boop the nose' challenge on my dog… he was NOT amused 🐶😂",
    tag: "#FunnyPets #DogsOfTumeni",
    video: "https://cdn.coverr.co/videos/coverr-girl-touches-a-dog-s-nose-3909/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-girl-touches-a-dog-s-nose-3909/720p.mp4",
    mediaIsVideo: true,
    track: "Original Sound — @hahahub",
    views: 136800,
    likes: 14520,
    shares: 2140,
    comments: [
      { id: "c-4a", user: USER_MAP.milo, text: "His face said 'do that one more time' 😭" },
    ],
  },
  {
    id: "post-5",
    user: USER_MAP.yung,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "55m ago",
    caption: "Friday night Amapiano booth going crazy — crowd asked for three rewinds 🎧🎹",
    tag: "#Amapiano #ClubVibes",
    video: "https://cdn.coverr.co/videos/coverr-dj-at-a-party-8079/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-dj-at-a-party-8079/720p.mp4",
    mediaIsVideo: true,
    track: "Margaret — Major League DJz & Victony",
    soundUrl: TRENDING_SOUNDS[9]!.url,
    views: 74900,
    likes: 6742,
    shares: 653,
    comments: [{ id: "c-5a", user: USER_MAP.kairo, text: "Private school piano hits different!" }],
  },
  {
    id: "post-6",
    user: USER_MAP.dre,
    lane: "sports",
    kind: "video",
    audience: "public",
    time: "1h ago",
    caption: "Nothing but net on the slow-mo buzzer beater — game point 🏀🔥",
    tag: "#Basketball #Sports #Clutch",
    video: "https://cdn.coverr.co/videos/coverr-slow-mo-basketball-hoop-5187/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-slow-mo-basketball-hoop-5187/720p.mp4",
    mediaIsVideo: true,
    track: "Court Side Mic — @dre.moves",
    views: 61500,
    likes: 5430,
    shares: 485,
    comments: [{ id: "c-6a", user: USER_MAP.jae, text: "Cleanest arc on the court!" }],
  },
  {
    id: "post-7",
    user: USER_MAP.taya,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "1h ago",
    caption: "5-minute breakfast egg hack for busy mornings — rate the crack 🍳✨",
    tag: "#FoodBlog #QuickRecipe #Vlog",
    video: "https://cdn.coverr.co/videos/coverr-breaking-an-egg-9198/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-breaking-an-egg-9198/720p.mp4",
    mediaIsVideo: true,
    track: "Kitchen ASMR — @taya.v",
    views: 49300,
    likes: 4120,
    shares: 390,
    comments: [],
  },
  {
    id: "post-8",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "2h ago",
    caption:
      "Board game night always starts peaceful and ends with someone flipping the table 😭🎲",
    tag: "#Comedy #GameNight #Relatable",
    video:
      "https://cdn.coverr.co/videos/coverr-a-couple-having-fun-while-playing-a-board-game-335/720p.mp4",
    media:
      "https://cdn.coverr.co/videos/coverr-a-couple-having-fun-while-playing-a-board-game-335/720p.mp4",
    mediaIsVideo: true,
    track: "Original Audio — @hahahub",
    views: 83400,
    likes: 7745,
    shares: 930,
    comments: [{ id: "c-8", user: USER_MAP.zuri, text: "Uno & Monopoly ruined friendships fr 😂" }],
  },
  {
    id: "post-9",
    user: USER_MAP.nala,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "2h ago",
    caption: "Neon night fit check — thrifted leather jacket + gold hoops ⚡🧥",
    tag: "#FitCheck #FashionBlog #GRWM",
    video: "https://cdn.coverr.co/videos/coverr-neon-glow-fashion-portrait/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-neon-glow-fashion-portrait/720p.mp4",
    mediaIsVideo: true,
    track: "Water — Tyla",
    soundUrl: TRENDING_SOUNDS[0]!.url,
    views: 68200,
    likes: 6410,
    shares: 520,
    comments: [{ id: "c-9", user: USER_MAP.amara, text: "The lighting + jacket combo is 10/10" }],
  },
  {
    id: "post-10",
    user: USER_MAP.milo,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "3h ago",
    caption: "Me at 7 AM pretending I'm ready for my morning meeting 😹☕",
    tag: "#CatTok #Funny #Mood",
    video: "https://cdn.coverr.co/videos/coverr-kitten-yawning-488/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-kitten-yawning-488/720p.mp4",
    mediaIsVideo: true,
    track: "Sleepy Vibes — @milo808",
    views: 109400,
    likes: 12180,
    shares: 1620,
    comments: [{ id: "c-10", user: USER_MAP.haha, text: "Biggest yawn per square inch 😂" }],
  },
  {
    id: "post-11",
    user: USER_MAP.jae,
    lane: "music",
    kind: "audio",
    audience: "public",
    time: "3h ago",
    caption: "Late night rotation — warm Afrobeats & Amapiano vocals on repeat.",
    tag: "#Afrohouse #Playlist",
    audio: TRENDING_SOUNDS[5]!.url,
    track: "Essence (feat. Tems) — Wizkid",
    duration: "0:30",
    likes: 486,
    shares: 64,
    comments: [{ id: "c-3", user: USER_MAP.yung, text: "Timeless rotation right here!" }],
  },
  {
    id: "post-12",
    user: USER_MAP.amara,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "4h ago",
    caption: "Graffiti room Amapiano combo — try learning the step in 15 seconds 💃🎹",
    tag: "#Amapiano #Choreo #FYP",
    video: "https://cdn.coverr.co/videos/coverr-dancing-in-room-with-graffiti-9584/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-dancing-in-room-with-graffiti-9584/720p.mp4",
    mediaIsVideo: true,
    track: "Water — Tyla",
    soundUrl: TRENDING_SOUNDS[0]!.url,
    views: 53400,
    likes: 4890,
    shares: 410,
    comments: [{ id: "c-12", user: USER_MAP.dre, text: "Cleanest isolation today 💯" }],
  },
  {
    id: "post-13",
    user: USER_MAP.zuri,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "4h ago",
    caption: "Solo travel diary: landing in a new city with one carry-on & zero plans ✈️🌏",
    tag: "#TravelBlog #TravelVlog",
    video:
      "https://cdn.coverr.co/videos/coverr-young-traveler-with-a-suitcase-crossing-the-street-at-the-crosswalk/720p.mp4",
    media:
      "https://cdn.coverr.co/videos/coverr-young-traveler-with-a-suitcase-crossing-the-street-at-the-crosswalk/720p.mp4",
    mediaIsVideo: true,
    track: "Travel Diary — @zuri.k",
    views: 57900,
    likes: 5110,
    shares: 476,
    comments: [],
  },
  {
    id: "post-14",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "5h ago",
    caption: "When your friend hits the wrong cue during an empty-hallway dance video 😂",
    tag: "#Comedy #DanceFail",
    video: "https://cdn.coverr.co/videos/coverr-dancing-in-an-empty-building-895/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-dancing-in-an-empty-building-895/720p.mp4",
    mediaIsVideo: true,
    track: "Original Comedy — @hahahub",
    views: 78400,
    likes: 7210,
    shares: 840,
    comments: [{ id: "c-14", user: USER_MAP.kito, text: "The spin at the end got me 😂" }],
  },
  {
    id: "post-15",
    user: USER_MAP.sora,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "5h ago",
    caption: "Golden hour outdoor Amapiano DJ session — full tracklist in the comments 👇",
    tag: "#Amapiano #OutdoorSet",
    video: "https://cdn.coverr.co/videos/coverr-outdoor-dj-9787/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-outdoor-dj-9787/720p.mp4",
    mediaIsVideo: true,
    track: "Fall — Davido",
    soundUrl: TRENDING_SOUNDS[8]!.url,
    views: 72100,
    likes: 6890,
    shares: 515,
    comments: [{ id: "c-15", user: USER_MAP.yung, text: "Best sunset mix this week!" }],
  },
  {
    id: "post-16",
    user: USER_MAP.dre,
    lane: "sports",
    kind: "video",
    audience: "public",
    time: "6h ago",
    caption: "Sunset beach football with the boys — winner buys dinner ⚽🌅",
    tag: "#Football #Soccer #BeachSports",
    video: "https://cdn.coverr.co/videos/coverr-playing-football-on-a-beach-7320/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-playing-football-on-a-beach-7320/720p.mp4",
    mediaIsVideo: true,
    track: "Beach Match Audio — @dre.moves",
    views: 64200,
    likes: 5830,
    shares: 430,
    comments: [{ id: "c-16", user: USER_MAP.amara, text: "That volley was disrespectful 🔥" }],
  },
  {
    id: "post-17",
    user: USER_MAP.taya,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "6h ago",
    caption: "Morning pour-over routine before answering emails ☕✨",
    tag: "#CoffeeVlog #MorningRoutine",
    video: "https://cdn.coverr.co/videos/coverr-pouring-coffee-into-a-mug-1176/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-pouring-coffee-into-a-mug-1176/720p.mp4",
    mediaIsVideo: true,
    track: "Late Night Chill LoFi Beats — Lofi Chill Beats",
    soundUrl: TRENDING_SOUNDS[7]!.url,
    views: 34800,
    likes: 2940,
    shares: 215,
    comments: [],
  },
  {
    id: "post-18",
    user: USER_MAP.zuri,
    lane: "vlog",
    kind: "text",
    audience: "public",
    time: "7h ago",
    caption:
      "Real talk: what's the funniest video or creator you discovered this week? Drop handles below 👇😂",
    tag: "#Community #TumeniBlog",
    likes: 415,
    shares: 38,
    comments: [{ id: "c-4", user: USER_MAP.dre, text: "@hahahub's dog clip had me crying!" }],
  },
  {
    id: "post-19",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "7h ago",
    caption: "Caught my friend laughing at her own selfie mid-shoot 😂📱",
    tag: "#Funny #BestFriends #Laughs",
    video:
      "https://cdn.coverr.co/videos/coverr-close-up-of-a-woman-taking-a-photo-on-the-phone-and-laughing-7325/720p.mp4",
    media:
      "https://cdn.coverr.co/videos/coverr-close-up-of-a-woman-taking-a-photo-on-the-phone-and-laughing-7325/720p.mp4",
    mediaIsVideo: true,
    track: "Original Sound — @hahahub",
    views: 52600,
    likes: 4780,
    shares: 390,
    comments: [],
  },
  {
    id: "post-20",
    user: USER_MAP.kairo,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "8h ago",
    caption: "Midnight highway cruise through the neon skyline 🚗⚡",
    tag: "#NightDrive #CityVlog",
    video: "https://cdn.coverr.co/videos/coverr-futuristic-car-speeding-in-neon-city/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-futuristic-car-speeding-in-neon-city/720p.mp4",
    mediaIsVideo: true,
    track: "City Boys — Burna Boy",
    soundUrl: TRENDING_SOUNDS[2]!.url,
    views: 91200,
    likes: 8894,
    shares: 942,
    comments: [],
  },
  {
    id: "post-21",
    user: USER_MAP.amara,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "8h ago",
    caption: "Duo Amapiano vibe check — rate our sync 1 to 10! 💃🕺",
    tag: "#Amapiano #DuoDance",
    video: "https://cdn.coverr.co/videos/coverr-couple-dancing-4825/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-couple-dancing-4825/720p.mp4",
    mediaIsVideo: true,
    track: "Calm Down — Rema & Selena Gomez",
    soundUrl: TRENDING_SOUNDS[4]!.url,
    views: 49200,
    likes: 4610,
    shares: 312,
    comments: [],
  },
  {
    id: "post-22",
    user: USER_MAP.zuri,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "9h ago",
    caption: "Setting up the tripod for a raw 'get ready with me' vlog on the balcony 🎥☀️",
    tag: "#GRWM #VloggerLife",
    video:
      "https://cdn.coverr.co/videos/coverr-a-girl-presses-record-on-a-camera-and-begins-a-vlog-2609/720p.mp4",
    media:
      "https://cdn.coverr.co/videos/coverr-a-girl-presses-record-on-a-camera-and-begins-a-vlog-2609/720p.mp4",
    mediaIsVideo: true,
    track: "Vlog Setup — @zuri.k",
    views: 37500,
    likes: 3120,
    shares: 205,
    comments: [],
  },
  {
    id: "post-23",
    user: USER_MAP.dre,
    lane: "sports",
    kind: "video",
    audience: "public",
    time: "10h ago",
    caption: "Forest downhill skate session with the whole crew ⚡🛹",
    tag: "#Skateboarding #ExtremeSports",
    video:
      "https://cdn.coverr.co/videos/coverr-friends-skateboarding-on-the-road-in-a-forest-8641/720p.mp4",
    media:
      "https://cdn.coverr.co/videos/coverr-friends-skateboarding-on-the-road-in-a-forest-8641/720p.mp4",
    mediaIsVideo: true,
    track: "Lush Life — Zara Larsson",
    soundUrl: TRENDING_SOUNDS[10]!.url,
    views: 45900,
    likes: 4410,
    shares: 394,
    comments: [],
  },
  {
    id: "post-24",
    user: USER_MAP.taya,
    lane: "music",
    kind: "video",
    audience: "public",
    time: "11h ago",
    caption: "Front-row POV when the whole arena sang the chorus back 😭💛",
    tag: "#LiveMusic #ConcertPOV",
    video: "https://cdn.coverr.co/videos/coverr-pov-crowd-at-a-concert-4932/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-pov-crowd-at-a-concert-4932/720p.mp4",
    mediaIsVideo: true,
    track: "International Love — Pitbull & Chris Brown",
    soundUrl: TRENDING_SOUNDS[11]!.url,
    views: 112500,
    likes: 10940,
    shares: 1120,
    comments: [],
  },
  {
    id: "post-25",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "12h ago",
    caption: "Piggyback sprint gone hilariously wrong in 3... 2... 1 😂",
    tag: "#Funny #Fails #Friends",
    video: "https://cdn.coverr.co/videos/coverr-woman-jumps-on-man-s-back-2006/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-woman-jumps-on-man-s-back-2006/720p.mp4",
    mediaIsVideo: true,
    track: "Original Comedy — @hahahub",
    views: 69100,
    likes: 6340,
    shares: 720,
    comments: [],
  },
  {
    id: "post-26",
    user: USER_MAP.nala,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "13h ago",
    caption: "Weekend vintage market thrift haul — found three crazy pieces under $25 🛍️✨",
    tag: "#ThriftHaul #FashionVlog",
    video: "https://cdn.coverr.co/videos/coverr-fashion-hunt-at-outdoor-market/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-fashion-hunt-at-outdoor-market/720p.mp4",
    mediaIsVideo: true,
    track: "Snooze — SZA",
    soundUrl: TRENDING_SOUNDS[3]!.url,
    views: 39400,
    likes: 3420,
    shares: 265,
    comments: [],
  },
  {
    id: "post-27",
    user: USER_MAP.dre,
    lane: "sports",
    kind: "video",
    audience: "public",
    time: "14h ago",
    caption: "Zero-equipment outdoor core & abs circuit — save this for tomorrow 💪🔥",
    tag: "#Fitness #WorkoutVlog #Sports",
    video: "https://cdn.coverr.co/videos/coverr-focused-outdoor-ab-workout/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-focused-outdoor-ab-workout/720p.mp4",
    mediaIsVideo: true,
    track: "Workout Energy — @dre.moves",
    views: 42300,
    likes: 3750,
    shares: 460,
    comments: [],
  },
  {
    id: "post-28",
    user: USER_MAP.jae,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "15h ago",
    caption: "Sunday comfort dinner from scratch — smell through the screen 🍲🧄",
    tag: "#Cooking #FoodieBlog",
    video: "https://cdn.coverr.co/videos/coverr-woman-cooking-in-the-kitchen-3837/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-woman-cooking-in-the-kitchen-3837/720p.mp4",
    mediaIsVideo: true,
    track: "Kitchen Audio — @jae.studio",
    views: 31800,
    likes: 2890,
    shares: 310,
    comments: [],
  },
  {
    id: "post-29",
    user: USER_MAP.haha,
    lane: "laughs",
    kind: "video",
    audience: "public",
    time: "17h ago",
    caption: "When everyone talks at the exact same time on the group video call 😂📞",
    tag: "#GroupChat #Comedy #Relatable",
    video: "https://cdn.coverr.co/videos/coverr-people-say-hi-on-a-video-call-3316/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-people-say-hi-on-a-video-call-3316/720p.mp4",
    mediaIsVideo: true,
    track: "Original Sound — @hahahub",
    views: 58900,
    likes: 5340,
    shares: 610,
    comments: [],
  },
  {
    id: "post-30",
    user: USER_MAP.kito,
    lane: "music",
    kind: "video",
    audience: "public",
    time: "19h ago",
    caption: "One take in the vocal booth — raw freestyle before mixing 🎙️🔥",
    tag: "#Vocalist #OneTake #Music",
    video: "https://cdn.coverr.co/videos/coverr-a-guy-singing-into-a-microphone-745/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-a-guy-singing-into-a-microphone-745/720p.mp4",
    mediaIsVideo: true,
    track: "Not Like Us — Kendrick Lamar",
    soundUrl: TRENDING_SOUNDS[1]!.url,
    views: 44100,
    likes: 3960,
    shares: 310,
    comments: [],
  },
  {
    id: "post-31",
    user: USER_MAP.amara,
    lane: "amapiano",
    kind: "video",
    audience: "public",
    time: "21h ago",
    caption: "Cardio + Amapiano groove check — best way to start the day 💪🎹",
    tag: "#Amapiano #MoveDaily",
    video: "https://cdn.coverr.co/videos/coverr-dancing-in-activewear-1021/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-dancing-in-activewear-1021/720p.mp4",
    mediaIsVideo: true,
    track: "Tanzania (feat. Sino Msolo) — Uncle Waffles & Tony Duardo",
    soundUrl: TRENDING_SOUNDS[6]!.url,
    views: 51200,
    likes: 4720,
    shares: 340,
    comments: [],
  },
  {
    id: "post-32",
    user: USER_MAP.zuri,
    lane: "vlog",
    kind: "video",
    audience: "public",
    time: "23h ago",
    caption: "Subway commute mini-vlog + city people-watching diary 🚇🎧",
    tag: "#CityVlog #DailyBlog",
    video: "https://cdn.coverr.co/videos/coverr-walking-through-the-subway-9363/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-walking-through-the-subway-9363/720p.mp4",
    mediaIsVideo: true,
    track: "City Diary — @zuri.k",
    views: 28400,
    likes: 2390,
    shares: 155,
    comments: [],
  },
  {
    id: "post-33",
    user: USER_MAP.dre,
    lane: "sports",
    kind: "video",
    audience: "public",
    time: "1d ago",
    caption: "Evening city run to clear the mind before tomorrow starts 🏃‍♂️🌆",
    tag: "#Running #Fitness #Sports",
    video: "https://cdn.coverr.co/videos/coverr-urban-running-in-the-evening/720p.mp4",
    media: "https://cdn.coverr.co/videos/coverr-urban-running-in-the-evening/720p.mp4",
    mediaIsVideo: true,
    track: "Night Run — @dre.moves",
    views: 24600,
    likes: 2140,
    shares: 132,
    comments: [],
  },
  {
    id: "post-34",
    user: USER_MAP.yung,
    lane: "music",
    kind: "video",
    audience: "public",
    time: "1d ago",
    caption: "Car speaker bass test before dropping the weekend mix 🚗🔊",
    tag: "#CarTest #BassDrop",
    video:
      "https://cdn.coverr.co/videos/coverr-a-man-selecting-music-to-listen-to-in-the-car-3131/720p.mp4",
    media:
      "https://cdn.coverr.co/videos/coverr-a-man-selecting-music-to-listen-to-in-the-car-3131/720p.mp4",
    mediaIsVideo: true,
    track: "Not Like Us — Kendrick Lamar",
    soundUrl: TRENDING_SOUNDS[1]!.url,
    views: 36700,
    likes: 3280,
    shares: 240,
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
    title: "Amapiano Night Groove",
    host: USER_MAP.nala,
    tag: "#Amapiano",
    videoUrl: "https://cdn.coverr.co/videos/coverr-dj-at-a-party-8079/720p.mp4",
    audioUrl:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/ab/fd/25/abfd2533-3a55-ede0-8564-840ffb3806b4/mzaf_6356538675244338564.plus.aac.p.m4a",
    viewers: 1420,
    likes: 4820,
    initialChat: [
      {
        id: "lc-1",
        user: "@amara.dance",
        avatar: USER_MAP.amara.avatar,
        text: "That log drum bounce is crazy 🔥",
      },
      {
        id: "lc-2",
        user: "@zuri.k",
        avatar: USER_MAP.zuri.avatar,
        text: "Whole room is moving right now!",
      },
      {
        id: "lc-3",
        user: "@dre.moves",
        avatar: USER_MAP.dre.avatar,
        text: "Play that next Amapiano ID!",
      },
    ],
  },
  {
    id: "live-haha",
    title: "Late Night Comedy & Storytime",
    host: USER_MAP.haha,
    tag: "#Funny",
    videoUrl:
      "https://cdn.coverr.co/videos/coverr-a-couple-having-fun-while-playing-a-board-game-335/720p.mp4",
    viewers: 980,
    likes: 3190,
    initialChat: [
      {
        id: "lc-4",
        user: "@yungvibez",
        avatar: USER_MAP.yung.avatar,
        text: "You guys are hilarious tonight 😂",
      },
      {
        id: "lc-5",
        user: "@zuri.k",
        avatar: USER_MAP.zuri.avatar,
        text: "Tell the airport story next!!",
      },
    ],
  },
  {
    id: "live-zuri",
    title: "Coastal Travel & Sunset Vlog",
    host: USER_MAP.zuri,
    tag: "#TravelVlog",
    videoUrl: "https://cdn.coverr.co/videos/coverr-vlogger-greeting-audience-by-the-sea/720p.mp4",
    viewers: 615,
    likes: 1690,
    initialChat: [
      {
        id: "lc-6",
        user: "@taya.v",
        avatar: USER_MAP.taya.avatar,
        text: "That ocean view looks unreal 🌊💛",
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
