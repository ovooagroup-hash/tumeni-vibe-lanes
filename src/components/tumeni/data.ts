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
    mutuals: 6,
    followers: 14200,
    nearYou: true,
    sharedWith: [USER_MAP.zuri, USER_MAP.kito, USER_MAP.yung],
  },
  {
    user: USER_MAP.kito,
    bio: "808s, Rhodes chords, and unreleased log drum packs.",
    vibeTag: "#Producer",
    mutuals: 4,
    followers: 8900,
    nearYou: true,
    sharedWith: [USER_MAP.yung, USER_MAP.dre, USER_MAP.nala],
  },
  {
    user: USER_MAP.zuri,
    bio: "Film reels, rooftop sessions, and good energy.",
    vibeTag: "#Filmmaker",
    mutuals: 3,
    followers: 5400,
    nearYou: true,
    sharedWith: [USER_MAP.nala, USER_MAP.dre],
  },
  {
    user: USER_MAP.dre,
    bio: "Choreography, freestyle clips, and studio linkups.",
    vibeTag: "#Choreo",
    mutuals: 5,
    followers: 11300,
    nearYou: false,
    sharedWith: [USER_MAP.zuri, USER_MAP.kito, USER_MAP.haha],
  },
  {
    user: USER_MAP.yung,
    bio: "Creative director & sound curator on tumeni.",
    vibeTag: "#Curator",
    mutuals: 2,
    followers: 24800,
    nearYou: true,
    sharedWith: [USER_MAP.kito, USER_MAP.nala],
  },
  {
    user: USER_MAP.haha,
    bio: "Daily chaos, studio outtakes, and campus comedy.",
    vibeTag: "#Comedy",
    mutuals: 7,
    followers: 31500,
    nearYou: false,
    sharedWith: [USER_MAP.dre, USER_MAP.zuri, USER_MAP.kito],
  },
];

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

export type Comment = { id: string; user: User; text: string };
export type Post = {
  id: string;
  user: User;
  lane: Lane;
  kind: Kind;
  time: string;
  caption: string;
  tag?: string | undefined;
  media?: string | undefined;
  mediaIsVideo?: boolean | undefined;
  audience?: Audience | undefined;
  video?: string | undefined;
  audio?: string | undefined;
  views?: number | undefined;
  duration?: string | undefined;
  track?: string | undefined;
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
    track: "Original Audio — @nalagold",
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
    track: "YungVibeZ — Gold Hour Edit",
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
    caption: "Cooked this up at 2 AM — warm Rhodes + deep log drum bounce.",
    tag: "#Afrohouse",
    audio: "https://samplelib.com/lib/preview/mp3/sample-15s.mp3",
    track: "Kito Beats — Obsidian Groove (Demo)",
    duration: "0:15",
    likes: 486,
    shares: 64,
    comments: [{ id: "c-3", user: USER_MAP.yung, text: "Send the stems to the crew!" }],
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
];

export function canViewPost(
  post: Pick<Post, "user" | "audience">,
  viewerId: string,
  friendIds: readonly string[],
) {
  if (post.user.id === viewerId) return true;
  if (!post.audience || post.audience === "public") return true;
  return post.audience === "friends" && friendIds.includes(post.user.id);
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
  baseListeners: 48,
  streamUrl: "https://samplelib.com/lib/preview/mp3/sample-15s.mp3",
  tag: "#BeatLab",
};

export const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);
