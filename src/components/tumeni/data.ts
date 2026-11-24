import artist from "@/assets/artist.jpg";

export type Lane = "circle" | "music" | "laughs" | "mix";
export type Kind = "video" | "photo" | "audio" | "text";
export type Audience = "public" | "friends" | "private";

export const POST_AUDIENCES: { id: Audience; label: string }[] = [
  { id: "public", label: "Public" },
  { id: "friends", label: "Friends Only" },
  { id: "private", label: "Only Me" },
];

export const LANES: { id: Lane; label: string }[] = [
  { id: "circle", label: "My Circle" },
  { id: "music", label: "Music" },
  { id: "laughs", label: "Laughs" },
  { id: "mix", label: "Mix" },
];

export const avatar = (n: number) => `https://i.pravatar.cc/150?img=${n}`;

export type User = { id: string; name: string; handle: string; avatar: string; verified?: boolean | undefined };

const USER_MAP = {
  yung: { id: "yung", name: "YungVibeZ", handle: "@yungvibez", avatar: artist, verified: true },
  haha: { id: "haha", name: "Haha Hub", handle: "@hahahub", avatar: "😆" },
  nala: { id: "nala", name: "Nala Gold", handle: "@nalagold", avatar: avatar(47), verified: true },
  kito: { id: "kito", name: "Kito Beats", handle: "@kitobeats", avatar: avatar(12) },
  zuri: { id: "zuri", name: "Zuri", handle: "@zuri.k", avatar: avatar(45) },
  dre: { id: "dre", name: "Dre M.", handle: "@dre.moves", avatar: avatar(59) },
} satisfies Record<string, User>;
export type UserId = keyof typeof USER_MAP;
export const USERS: Record<UserId, User> = USER_MAP;
export const getUser = (id: string): User | undefined => (USER_MAP as Record<string, User>)[id];

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

export const SEED_POSTS: Post[] = [];

export function canViewPost(post: Pick<Post, "user" | "audience">, viewerId: string, friendIds: readonly string[]) {
  if (post.user.id === viewerId) return true;
  if (post.audience === "public") return true;
  return post.audience === "friends" && friendIds.includes(post.user.id);
}

export function getVisiblePosts(posts: Post[], viewerId: string, friendIds: readonly string[]) {
  return posts.filter((post) => canViewPost(post, viewerId, friendIds));
}

export type Msg = { id: string; from: string; text: string; time: string; post?: Post | undefined };
export type Chat = { id: string; name: string; avatar: string; group?: boolean | undefined; online?: boolean | undefined; messages: Msg[] };

export const SEED_CHATS: Chat[] = [];

export const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));
