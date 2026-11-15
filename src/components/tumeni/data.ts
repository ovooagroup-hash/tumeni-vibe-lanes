import street from "@/assets/street.jpg";
import artist from "@/assets/artist.jpg";
import meme from "@/assets/meme.jpg";
import studio from "@/assets/studio.jpg";

export type Lane = "circle" | "music" | "laughs" | "mix";
export type Kind = "video" | "photo" | "audio" | "text";

export const LANES: { id: Lane; label: string }[] = [
  { id: "circle", label: "My Circle" },
  { id: "music", label: "Music" },
  { id: "laughs", label: "Laughs" },
  { id: "mix", label: "Mix" },
];

export const avatar = (n: number) => `https://i.pravatar.cc/150?img=${n}`;

export type User = { id: string; name: string; handle: string; avatar: string; verified?: boolean };

export const USERS: Record<string, User> = {
  yung: { id: "yung", name: "YungVibeZ", handle: "@yungvibez", avatar: artist, verified: true },
  haha: { id: "haha", name: "Haha Hub", handle: "@hahahub", avatar: "😆" },
  nala: { id: "nala", name: "Nala Gold", handle: "@nalagold", avatar: avatar(47), verified: true },
  kito: { id: "kito", name: "Kito Beats", handle: "@kitobeats", avatar: avatar(12) },
  zuri: { id: "zuri", name: "Zuri", handle: "@zuri.k", avatar: avatar(45) },
  dre: { id: "dre", name: "Dre M.", handle: "@dre.moves", avatar: avatar(59) },
};

export type Comment = { id: string; user: User; text: string };
export type Post = {
  id: string;
  user: User;
  lane: Lane;
  kind: Kind;
  time: string;
  caption: string;
  tag?: string;
  media?: string;
  mediaIsVideo?: boolean;
  views?: number;
  duration?: string;
  track?: string;
  likes: number;
  liked?: boolean;
  shares: number;
  comments: Comment[];
};

const c = (u: string, t: string, i: number): Comment => ({ id: `${u}${i}`, user: USERS[u], text: t });

export const SEED_POSTS: Post[] = [
  { id: "p1", user: USERS.yung, lane: "circle", kind: "video", time: "2h ago", caption: "New drop otw 🔥", tag: "#StayTuned", media: artist, views: 48200, likes: 2400, shares: 120, comments: [c("zuri", "Been waiting for this!!", 1), c("dre", "Sheesh 🔥", 2)] },
  { id: "p2", user: USERS.haha, lane: "laughs", kind: "photo", time: "4h ago", caption: "Me pretending I didn't eat the last slice.", media: meme, likes: 1800, shares: 89, comments: [c("kito", "This is literally me 😭", 1)] },
  { id: "p3", user: USERS.nala, lane: "music", kind: "audio", time: "5h ago", caption: "Late night session — rough cut 🎙️", track: "Golden Hour (demo)", media: studio, duration: "0:42", likes: 3100, shares: 210, comments: [c("yung", "Vocals are crazy", 1)] },
  { id: "p4", user: USERS.dre, lane: "laughs", kind: "text", time: "6h ago", caption: "Told my plants about my problems. Now they're dying too. Solidarity 🌱💀", likes: 940, shares: 55, comments: [] },
  { id: "p5", user: USERS.kito, lane: "music", kind: "video", time: "8h ago", caption: "Cooking up a beat on the street 🥁", tag: "#BeatMaker", media: street, views: 12900, likes: 1200, shares: 64, comments: [c("nala", "Send me this one 👀", 1)] },
  { id: "p6", user: USERS.zuri, lane: "circle", kind: "photo", time: "10h ago", caption: "City lights hit different tonight ✨", media: street, likes: 760, shares: 18, comments: [] },
  { id: "p7", user: USERS.kito, lane: "mix", kind: "audio", time: "1d ago", caption: "Afro-house loop, who's hopping on?", track: "Midnight Loop 04", duration: "0:30", likes: 530, shares: 40, comments: [] },
  { id: "p8", user: USERS.haha, lane: "mix", kind: "text", time: "1d ago", caption: "Group chat: 47 unread. Me: 'lol' 🙂", likes: 2200, shares: 300, comments: [] },
];

export type Msg = { id: string; from: string; text: string; time: string; post?: Post };
export type Chat = { id: string; name: string; avatar: string; group?: boolean; online?: boolean; messages: Msg[] };

export const SEED_CHATS: Chat[] = [
  { id: "crew", name: "The Crew", avatar: "👑", group: true, messages: [
    { id: "m1", from: "zuri", text: "Who's pulling up Friday?", time: "9:12" },
    { id: "m2", from: "dre", text: "I'm in, bringing the speaker 🔊", time: "9:14" },
    { id: "m3", from: "kito", text: "Just finished a new beat, sending later", time: "9:20" },
  ]},
  { id: "nala", name: "Nala Gold", avatar: avatar(47), online: true, messages: [
    { id: "n1", from: "nala", text: "Did you hear the demo??", time: "Yesterday" },
  ]},
  { id: "yung", name: "YungVibeZ", avatar: artist, messages: [
    { id: "y1", from: "yung", text: "Appreciate the co-sign fam 🙏", time: "Mon" },
  ]},
  { id: "haha", name: "Haha Hub", avatar: "😆", messages: [
    { id: "h1", from: "haha", text: "Got another meme for you 😂", time: "Sun" },
  ]},
];

export const PROFILES = [
  { id: "me", name: "You", handle: "@you", avatar: avatar(33) },
  { id: "alt", name: "You (Studio)", handle: "@you.studio", avatar: avatar(68) },
];

export const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
export const GRID = [artist, studio, meme, street, studio, artist, street, meme, studio];
