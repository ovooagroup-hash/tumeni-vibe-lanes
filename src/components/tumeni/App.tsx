import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bell, Heart, MessageCircle, Send, Play, Pause, MoreHorizontal, BadgeCheck, Home, Search, Plus, User as UserIcon,
  X, ArrowLeft, Video, Image as ImageIcon, AudioLines, MessageSquareText, Users, Music, Laugh, Sparkles, Eye,
  Crown, Bookmark, Zap, Check, LogOut, Repeat, Settings, Aperture,
} from "lucide-react";
import { LogoMark } from "./Logo";
import {
  LANES, SEED_POSTS, SEED_CHATS, USERS, PROFILES, GRID, fmt, getUser, type Lane, type Kind, type Post, type Chat, type User,
} from "./data";
import street from "@/assets/street.jpg";

type Tab = "home" | "explore" | "messages" | "profile";
const LANE_ICON = { circle: Users, music: Music, laughs: Laugh, mix: Sparkles };

function Avatar({ src, size = 44, ring = false }: { src: string; size?: number; ring?: boolean | undefined }) {
  const isEmoji = !src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data") && !src.startsWith("blob");
  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-secondary ${ring ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`} style={{ width: size, height: size }}>
      {isEmoji ? <div className="flex h-full w-full items-center justify-center" style={{ fontSize: size * 0.55 }}>{src}</div> : <img src={src} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}

export function Waveform({ playing, bars = 36, className = "h-10" }: { playing: boolean; bars?: number; className?: string }) {
  const heights = useMemo(() => Array.from({ length: bars }, (_, i) => 25 + Math.abs(Math.sin(i * 1.7) * 60) + (i % 3) * 5), [bars]);
  return (
    <div className={`flex items-end gap-[3px] ${className}`}>
      {heights.map((h, i) => (
        <span key={i} className={`w-[3px] rounded-full bg-primary ${playing ? "animate-wave" : ""}`} style={{ height: `${h}%`, animationDelay: `${(i % 9) * 0.08}s`, boxShadow: "0 0 6px var(--primary)", opacity: playing ? 1 : 0.7 }} />
      ))}
    </div>
  );
}

function Actions({ post, onLike, onComment, onShare }: { post: Post; onLike: () => void; onComment: () => void; onShare: () => void }) {
  const Item = ({ children, label, onClick, aria }: { children: React.ReactNode; label: string; onClick: () => void; aria: string }) => (
    <button onClick={onClick} aria-label={aria} className="flex flex-col items-center gap-1 text-xs font-medium transition active:scale-90">{children}<span>{label}</span></button>
  );
  return (
    <div className="flex flex-col items-center gap-4">
      <Item onClick={onLike} label={fmt(post.likes)} aria="Like"><Heart className={`h-7 w-7 transition ${post.liked ? "scale-110 fill-primary text-primary" : "fill-primary/90 text-primary"}`} /></Item>
      <Item onClick={onComment} label={fmt(post.comments.length + Math.floor(post.likes / 8))} aria="Comments"><MessageCircle className="h-7 w-7" /></Item>
      <Item onClick={onShare} label={fmt(post.shares)} aria="Send in"><Send className="h-7 w-7" /></Item>
    </div>
  );
}

function PostCard({ post, onLike, onComment, onShare }: { post: Post; onLike: () => void; onComment: () => void; onShare: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!playing || post.kind !== "audio") return;
    const t = setInterval(() => setElapsed((e) => (e >= 42 ? 0 : e + 1)), 1000);
    return () => clearInterval(t);
  }, [playing, post.kind]);

  return (
    <article className="animate-rise rounded-3xl border border-border bg-card p-3">
      <header className="flex items-center gap-3 px-2 py-2">
        <Avatar src={post.user.avatar} ring />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 font-medium">{post.user.name}{post.user.verified && <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />}</div>
          <div className="text-xs text-muted-foreground">{post.time}</div>
        </div>
        <button aria-label="More" onClick={() => toast("Saved to your collection")}><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      {post.kind === "video" && (
        <div className="relative overflow-hidden rounded-2xl">
          {post.mediaIsVideo ? (
            <video src={post.media} className="aspect-[4/5] w-full object-cover" loop muted playsInline ref={(v) => { if (v) { playing ? v.play() : v.pause(); } }} />
          ) : (
            <img src={post.media} alt="" className={`aspect-[4/5] w-full object-cover transition duration-[8s] ${playing ? "scale-110" : ""}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)} className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/50 backdrop-blur transition ${playing ? "opacity-0 hover:opacity-100" : ""}`}>
            {playing ? <Pause className="h-7 w-7 fill-foreground" /> : <Play className="ml-1 h-7 w-7 fill-foreground" />}
          </button>
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/60 px-2 py-1 text-xs backdrop-blur"><Eye className="h-3 w-3" /> {fmt(post.views ?? 0)}</div>
          <div className="absolute bottom-4 left-4 right-20">
            <p className="text-sm text-muted-foreground">{post.user.handle}</p>
            <p>{post.caption}</p>
            {post.tag && <p className="text-primary">{post.tag}</p>}
          </div>
          <div className="absolute bottom-4 right-3"><Actions post={post} onLike={onLike} onComment={onComment} onShare={onShare} /></div>
          {playing && <div className="absolute bottom-0 left-0 h-1 bg-primary animate-progress" />}
        </div>
      )}

      {post.kind === "photo" && (
        <div className="flex gap-3 px-2 pb-2">
          <div className="flex-1">
            <p className="mb-3">{post.caption}</p>
            <img src={post.media} alt="" className="w-full rounded-2xl object-cover" />
          </div>
          <div className="flex items-end pb-2"><Actions post={post} onLike={onLike} onComment={onComment} onShare={onShare} /></div>
        </div>
      )}

      {post.kind === "text" && (
        <div className="flex gap-3 px-2 pb-2">
          <p className="flex-1 rounded-2xl bg-secondary p-5 text-xl font-medium leading-snug">{post.caption}</p>
          <div className="flex items-end"><Actions post={post} onLike={onLike} onComment={onComment} onShare={onShare} /></div>
        </div>
      )}

      {post.kind === "audio" && (
        <div className="flex gap-3 px-2 pb-2">
          <div className="flex-1">
            <p className="mb-3">{post.caption}</p>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
              {post.media ? <img src={post.media} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary"><Music className="text-primary" /></div>}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{post.track}</p>
                <Waveform playing={playing} bars={28} className="mt-1 h-8" />
                <p className="mt-1 text-xs text-muted-foreground">0:{String(elapsed).padStart(2, "0")} / {post.duration}</p>
              </div>
              <button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground glow">
                {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
              </button>
            </div>
          </div>
          <div className="flex items-end"><Actions post={post} onLike={onLike} onComment={onComment} onShare={onShare} /></div>
        </div>
      )}
    </article>
  );
}

function LanePills({ lane, setLane, icons = false }: { lane: Lane; setLane: (l: Lane) => void; icons?: boolean }) {
  return (
    <div className="flex gap-2">
      {LANES.map((l) => {
        const I = LANE_ICON[l.id];
        const active = lane === l.id;
        return (
          <button key={l.id} onClick={() => setLane(l.id)} className={`flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground glow" : "border-border bg-card text-foreground"}`}>
            {icons && <I className="h-4 w-4" />}{l.label}
          </button>
        );
      })}
    </div>
  );
}

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-rise w-full max-w-md rounded-t-3xl border border-border bg-card p-5 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

function CreatePost({ onClose, onPublish }: { onClose: () => void; onPublish: (p: { lane: Lane; kind: Kind; caption: string; media?: string | undefined; isVideo?: boolean | undefined }) => void }) {
  const [lane, setLane] = useState<Lane>("circle");
  const [kind, setKind] = useState<Kind>("video");
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<string>();
  const [isVideo, setIsVideo] = useState(false);
  const [sec, setSec] = useState(0);
  const [flash, setFlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const t = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  const kinds: { id: Kind; label: string; I: typeof Video }[] = [
    { id: "video", label: "Video", I: Video }, { id: "photo", label: "Photo", I: ImageIcon },
    { id: "audio", label: "Audio", I: AudioLines }, { id: "text", label: "Text/Thought", I: MessageSquareText },
  ];
  const publish = () => {
    if (kind === "text" && !caption.trim()) { toast.error("Write a thought first"); return; }
    onPublish({ lane, kind, caption: caption.trim() || (kind === "audio" ? "Fresh audio drop 🎧" : "New drop 🔥"), media, isVideo });
  };

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-background animate-rise">
      <div className="absolute inset-0 overflow-hidden">
        {kind === "text" ? <div className="h-full w-full bg-gradient-to-b from-secondary to-background" /> :
          media && isVideo ? <video src={media} autoPlay loop muted playsInline className="h-full w-full object-cover" /> :
          <img src={media ?? street} alt="" className={`h-full w-full object-cover ${flash ? "brightness-125" : "brightness-75"}`} />}
      </div>
      <div className="relative flex items-center justify-between p-4 pt-6">
        <button aria-label="Close" onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-glass backdrop-blur"><X /></button>
        <div className="flex items-center gap-2 rounded-full border border-border bg-glass px-4 py-2 text-sm backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> REC 00:{String(sec % 60).padStart(2, "0")}
        </div>
        <button aria-label="Settings" onClick={() => toast("Camera settings coming soon")} className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-glass backdrop-blur"><Settings /></button>
      </div>
      {kind !== "text" && (
        <div className="relative ml-auto mr-4 mt-24 flex flex-col gap-4 text-center text-sm">
          <button onClick={() => setFlash(!flash)} className="flex flex-col items-center gap-1"><span className={`flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-glass backdrop-blur ${flash ? "text-primary" : ""}`}><Zap /></span>Flash</button>
          <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1"><span className="flex h-16 w-16 items-center justify-center rounded-3xl border border-border bg-glass backdrop-blur"><Repeat /></span>Upload</button>
        </div>
      )}
      <input ref={fileRef} type="file" hidden accept={kind === "audio" ? "audio/*" : kind === "photo" ? "image/*" : "video/*,image/*"} onChange={(e) => {
        const f = e.target.files?.[0]; if (!f) return;
        if (f.type.startsWith("audio")) { toast.success(`Attached ${f.name}`); return; }
        setMedia(URL.createObjectURL(f)); setIsVideo(f.type.startsWith("video"));
      }} />
      <div className="relative mt-auto space-y-4 rounded-t-3xl border border-border bg-glass p-5 pb-8 backdrop-blur-xl">
        <p className="text-center text-xs tracking-[0.3em] text-muted-foreground">— VIBE LANE —<br />CHOOSE WHERE TO POST</p>
        <LanePills lane={lane} setLane={setLane} icons />
        <div className="grid grid-cols-4 gap-2">
          {kinds.map(({ id, label, I }) => (
            <button key={id} onClick={() => setKind(id)} className={`flex flex-col items-center gap-1 py-2 text-xs ${kind === id ? "text-foreground" : "text-muted-foreground"}`}>
              <I className="h-6 w-6" />[ {label} ]
              <span className={`h-0.5 w-10 rounded-full ${kind === id ? "bg-primary" : "bg-transparent"}`} />
            </button>
          ))}
        </div>
        {kind === "audio" && <div className="flex justify-center"><Waveform playing bars={40} className="h-10" /></div>}
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={kind === "text" ? 3 : 1} placeholder={kind === "text" ? "What's the thought?" : "Add a caption…"} className="w-full resize-none rounded-2xl border border-border bg-background/60 p-3 outline-none placeholder:text-muted-foreground focus:border-primary" />
        <button onClick={publish} className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-primary text-lg font-bold text-primary-foreground glow active:scale-[0.98]">
          <Aperture /> PUBLISH · POST NOW
        </button>
      </div>
    </div>
  );
}

export function TumeniApp({ account, onLogout }: { account: string; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("home");
  const [lane, setLane] = useState<Lane>("circle");
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [chats, setChats] = useState<Chat[]>(SEED_CHATS);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<Post | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [profileIdx, setProfileIdx] = useState(0);
  const [switcher, setSwitcher] = useState(false);
  const [notif, setNotif] = useState(true);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab, openChat]);
  const profile = PROFILES[profileIdx] ?? PROFILES[0]!;
  const me: User = { id: "me", name: profile.name, handle: profile.handle, avatar: profile.avatar };

  const feed = lane === "mix" ? posts : posts.filter((p) => p.lane === lane || (lane === "circle" && p.user.id === "me"));
  const myPosts = posts.filter((p) => p.user.id === "me");

  const like = (id: string) => setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)));
  const sendTo = (chatId: string, post: Post) => {
    setChats((cs) => cs.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), from: "me", text: "", time: "now", post }] } : c)));
    setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, shares: p.shares + 1 } : p)));
    toast.success(`Sent into ${chats.find((c) => c.id === chatId)?.name}`);
  };
  const commentPost = posts.find((p) => p.id === commentsFor);

  return (
    <div className="relative mx-auto min-h-dvh max-w-md pb-32">
      {tab === "home" && (
        <>
          <header className="sticky top-0 z-30 space-y-4 bg-background/85 px-4 pb-3 pt-5 backdrop-blur-xl">
            <div className="relative flex items-center justify-center">
              <button aria-label="Switch profile" onClick={() => setSwitcher(true)} className="absolute left-0"><Avatar src={me.avatar} size={36} /></button>
              <LogoMark className="h-12 w-12" />
              <button aria-label="Notifications" onClick={() => { setNotif(false); toast("Nala Gold co-signed your drop ✨"); }} className="absolute right-0">
                <Bell className="h-7 w-7" />{notif && <span className="absolute -right-0.5 top-0 h-2.5 w-2.5 rounded-full bg-primary glow" />}
              </button>
            </div>
            <LanePills lane={lane} setLane={setLane} />
          </header>
          <div className="space-y-4 px-4 pt-2">
            {feed.map((p) => <PostCard key={p.id} post={p} onLike={() => like(p.id)} onComment={() => setCommentsFor(p.id)} onShare={() => setShareFor(p)} />)}
            {feed.length === 0 && <p className="py-20 text-center text-muted-foreground">Nothing in this lane yet — drop something!</p>}
          </div>
        </>
      )}

      {tab === "explore" && <Explore posts={posts} onOpen={(p) => { setLane(p.lane); setTab("home"); }} />}

      {tab === "messages" && (openChat ? (
        <ChatView chat={chats.find((c) => c.id === openChat)!} onBack={() => setOpenChat(null)} onSend={(text) => {
          setChats((cs) => cs.map((c) => (c.id === openChat ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), from: "me", text, time: "now" }] } : c)));
          setTimeout(() => setChats((cs) => cs.map((c) => (c.id === openChat ? { ...c, messages: [...c.messages, { id: crypto.randomUUID(), from: c.group ? "zuri" : c.id, text: ["😂😂", "facts", "say less 🔥", "pull up!", "no way 👀"][Math.floor(Math.random() * 5)] ?? "🔥", time: "now" }] } : c))), 1200);
        }} />
      ) : (
        <Messages chats={chats} onOpen={setOpenChat} />
      ))}

      {tab === "profile" && <Profile me={me} account={account} myPosts={myPosts} onSwitch={() => setSwitcher(true)} onLogout={onLogout} />}

      {/* Bottom glass nav */}
      {!(tab === "messages" && openChat) && (
        <nav className="fixed bottom-4 left-1/2 z-40 flex h-[72px] w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 items-center justify-around rounded-[2rem] border border-border bg-glass backdrop-blur-xl">
          {([["home", Home], ["explore", Search]] as const).map(([t, I]) => <NavBtn key={t} active={tab === t} onClick={() => setTab(t)} label={t}><I className="h-7 w-7" /></NavBtn>)}
          <button aria-label="Create post" onClick={() => setCreating(true)} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary text-primary glow transition active:scale-90"><Plus className="h-7 w-7" /></button>
          {([["messages", MessageCircle], ["profile", UserIcon]] as const).map(([t, I]) => <NavBtn key={t} active={tab === t} onClick={() => { setTab(t); setOpenChat(null); }} label={t}><I className="h-7 w-7" /></NavBtn>)}
        </nav>
      )}

      <Sheet open={!!shareFor} onClose={() => setShareFor(null)} title="SEND IN">
        <div className="space-y-2">
          {chats.map((c) => (
            <SendRow key={c.id} chat={c} onSend={() => shareFor && sendTo(c.id, shareFor)} />
          ))}
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(location.href); toast.success("Link copied"); }} className="mt-4 h-12 w-full rounded-full border border-border">Copy link</button>
      </Sheet>

      <Sheet open={!!commentPost} onClose={() => setCommentsFor(null)} title="Comments">
        {commentPost && <Comments post={commentPost} me={me} onAdd={(text) => setPosts((ps) => ps.map((p) => (p.id === commentPost.id ? { ...p, comments: [...p.comments, { id: crypto.randomUUID(), user: me, text }] } : p)))} />}
      </Sheet>

      <Sheet open={switcher} onClose={() => setSwitcher(false)} title="Switch profile">
        <div className="space-y-2">
          {PROFILES.map((p, i) => (
            <button key={p.id} onClick={() => { setProfileIdx(i); setSwitcher(false); toast(`Switched to ${p.handle}`); }} className="flex w-full items-center gap-3 rounded-2xl border border-border p-3">
              <Avatar src={p.avatar} /><div className="flex-1 text-left"><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.handle}</p></div>
              {i === profileIdx && <Check className="text-primary" />}
            </button>
          ))}
        </div>
      </Sheet>

      {creating && <CreatePost onClose={() => setCreating(false)} onPublish={({ lane: l, kind, caption, media, isVideo }) => {
        const post: Post = { id: crypto.randomUUID(), user: me, lane: l, kind, time: "just now", caption, likes: 0, shares: 0, comments: [],
          media: kind === "text" ? undefined : kind === "audio" ? media : media ?? street, mediaIsVideo: isVideo, views: kind === "video" ? 1 : undefined, track: kind === "audio" ? `${me.name} — new sound` : undefined, duration: kind === "audio" ? "0:42" : undefined };
        setPosts((ps) => [post, ...ps]); setLane(l); setTab("home"); setCreating(false); window.scrollTo({ top: 0 });
        toast.success(`Dropped into ${LANES.find((x) => x.id === l)?.label}`);
      }} />}
    </div>
  );
}

function NavBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? "text-primary" : "text-foreground"}`}>
      {children}<span className={`h-0.5 w-5 rounded-full ${active ? "bg-primary" : "bg-transparent"}`} />
    </button>
  );
}

function SendRow({ chat, onSend }: { chat: Chat; onSend: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3">
      <Avatar src={chat.avatar} /><div className="flex-1"><p className="font-medium">{chat.name}</p><p className="text-xs text-muted-foreground">{chat.group ? "Group · 5 members" : "Direct"}</p></div>
      <button disabled={sent} onClick={() => { onSend(); setSent(true); }} className={`h-9 rounded-full px-4 text-sm font-semibold ${sent ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"}`}>{sent ? "Sent" : "Send"}</button>
    </div>
  );
}

function Comments({ post, me, onAdd }: { post: Post; me: User; onAdd: (t: string) => void }) {
  const [text, setText] = useState("");
  return (
    <>
      <div className="max-h-72 space-y-3 overflow-y-auto">
        {post.comments.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Be the first to co-sign.</p>}
        {post.comments.map((c) => (
          <div key={c.id} className="flex gap-3"><Avatar src={c.user.avatar} size={32} /><div><p className="text-sm font-medium">{c.user.name}</p><p className="text-sm text-muted-foreground">{c.text}</p></div></div>
        ))}
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdd(text.trim()); setText(""); } }}>
        <Avatar src={me.avatar} size={40} />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" className="flex-1 rounded-full border border-border bg-background px-4 outline-none focus:border-primary" />
        <button aria-label="Post comment" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
      </form>
    </>
  );
}

function Explore({ posts, onOpen }: { posts: Post[]; onOpen: (p: Post) => void }) {
  const [q, setQ] = useState("");
  const list = posts.filter((p) => (p.caption + p.user.name + (p.tag ?? "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="px-4 pt-6">
      <h1 className="mb-4 text-3xl font-bold">Explore<span className="text-primary">.</span></h1>
      <label className="flex h-12 items-center gap-2 rounded-full border border-border bg-card px-4"><Search className="h-5 w-5 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creators, sounds, vibes" className="w-full bg-transparent outline-none" /></label>
      <div className="no-scrollbar my-4 flex gap-2 overflow-x-auto">{["#StayTuned", "#BeatMaker", "#NightOut", "#Memes", "#Afrohouse"].map((t) => <button key={t} onClick={() => setQ(t.slice(1))} className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-sm text-primary">{t}</button>)}</div>
      <div className="grid grid-cols-2 gap-2">
        {list.map((p) => (
          <button key={p.id} onClick={() => onOpen(p)} className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card text-left">
            {p.media ? <img src={p.media} alt="" className="h-full w-full object-cover" /> : <p className="p-3 text-sm">{p.kind === "audio" ? "🎧 " + p.track : p.caption}</p>}
            <span className="absolute bottom-2 left-2 rounded-full bg-background/70 px-2 py-0.5 text-xs">{p.user.handle}</span>
          </button>
        ))}
      </div>
      <h2 className="mb-3 mt-6 font-semibold">Creators to tap into</h2>
      <div className="space-y-2">{Object.values(USERS).slice(0, 4).map((u) => <FollowRow key={u.id} u={u} />)}</div>
    </div>
  );
}

function FollowRow({ u }: { u: User }) {
  const [on, setOn] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <Avatar src={u.avatar} /><div className="flex-1"><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.handle}</p></div>
      <button onClick={() => setOn(!on)} className={`h-9 rounded-full px-4 text-sm font-semibold ${on ? "border border-border" : "bg-primary text-primary-foreground"}`}>{on ? "Tapped in" : "Tap in"}</button>
    </div>
  );
}

function Messages({ chats, onOpen }: { chats: Chat[]; onOpen: (id: string) => void }) {
  return (
    <div className="px-4 pt-6">
      <h1 className="mb-4 text-3xl font-bold">Messages<span className="text-primary">.</span></h1>
      <div className="space-y-2">
        {chats.map((c) => {
          const last = c.messages.at(-1);
          return (
            <button key={c.id} onClick={() => onOpen(c.id)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left">
              <div className="relative"><Avatar src={c.avatar} size={52} ring={c.group} />{c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-primary" />}</div>
              <div className="min-w-0 flex-1"><div className="flex justify-between"><p className="font-medium">{c.name}</p><span className="text-xs text-muted-foreground">{last?.time}</span></div>
                <p className="truncate text-sm text-muted-foreground">{last?.post ? "📎 Shared a post" : last?.text}</p></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChatView({ chat, onBack, onSend }: { chat: Chat; onBack: () => void; onSend: (t: string) => void }) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [chat.messages.length]);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 p-4 backdrop-blur-xl">
        <button aria-label="Back" onClick={onBack}><ArrowLeft /></button><Avatar src={chat.avatar} size={40} />
        <div><p className="font-semibold">{chat.name}</p><p className="text-xs text-primary">{chat.group ? "Zuri, Dre, Kito +2" : chat.online ? "online" : "tap in"}</p></div>
      </header>
      <div className="flex-1 space-y-3 p-4 pb-28">
        {chat.messages.map((m) => {
          const mine = m.from === "me"; const u = getUser(m.from);
          return (
            <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`}>
              {!mine && u && <Avatar src={u.avatar} size={28} />}
              <div className={`max-w-[75%] rounded-3xl px-4 py-2 ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card"}`}>
                {chat.group && !mine && u && <p className="text-xs text-primary">{u.name}</p>}
                {m.post ? (
                  <div className="w-52"><p className="mb-1 text-xs opacity-70">Sent in a post from {m.post.user.handle}</p>
                    {m.post.media ? <img src={m.post.media} alt="" className="aspect-square w-full rounded-2xl object-cover" /> : <p className="rounded-2xl bg-background/20 p-2 text-sm">{m.post.caption}</p>}
                    <p className="mt-1 truncate text-sm">{m.post.caption}</p></div>
                ) : m.text}
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSend(text.trim()); setText(""); } }} className="fixed bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-[26rem] -translate-x-1/2 gap-2 rounded-full border border-border bg-glass p-2 backdrop-blur-xl">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" className="flex-1 bg-transparent px-3 outline-none" />
        <button aria-label="Send message" className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><Send className="h-5 w-5" /></button>
      </form>
    </div>
  );
}

function Profile({ me, account, myPosts, onSwitch, onLogout }: { me: User; account: string; myPosts: Post[]; onSwitch: () => void; onLogout: () => void }) {
  const [filter, setFilter] = useState<"all" | "video" | "photo" | "audio">("all");
  const items = [
    ...myPosts.map((p) => ({ src: p.media, kind: p.kind, text: p.caption })),
    ...GRID.map((src, i) => ({ src, kind: (["video", "photo", "audio"] as const)[i % 3], text: "" })),
  ].filter((i) => filter === "all" || i.kind === filter);
  const stats = [
    { label: "TAP-INS", value: "1.2K", I: Users }, { label: "CO-SIGNS", value: "8.4K", I: Heart },
    { label: "SAVED", value: "312", I: Bookmark },
  ];
  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between"><button onClick={onSwitch} className="text-sm text-muted-foreground">Switch ⇄</button><button aria-label="Log out" onClick={onLogout}><LogOut className="h-5 w-5" /></button></div>
      <div className="mt-2 flex flex-col items-center">
        <Avatar src={me.avatar} size={96} ring />
        <h1 className="mt-4 text-2xl font-bold">{me.name}</h1>
        <p className="text-sm text-muted-foreground">{me.handle} · {account.split(":")[1]}</p>
        <p className="mt-2 text-center text-sm">Vibes, sounds & laughs only ✨</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, I }) => (
          <div key={label} className="rounded-3xl border border-border bg-card p-4"><I className="h-5 w-5 text-primary" /><p className="mt-3 text-2xl font-bold">{value}</p><p className="text-xs tracking-widest text-muted-foreground">{label}</p></div>
        ))}
        <div className="relative overflow-hidden rounded-3xl border border-primary bg-gradient-to-br from-primary/25 to-card p-4 glow">
          <Crown className="h-5 w-5 text-primary" /><p className="mt-3 text-2xl font-bold text-primary">VIP</p><p className="text-xs tracking-widest text-muted-foreground">CREW PASSES · 3</p>
        </div>
      </div>
      <div className="mt-6 flex gap-2">{(["all", "video", "photo", "audio"] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`flex-1 rounded-full border py-1.5 text-sm capitalize ${filter === f ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{f}</button>)}</div>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {items.map((it, i) => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-card">
            {it.src && it.kind !== "audio" ? <img src={it.src} alt="" className="h-full w-full object-cover" /> :
              it.kind === "audio" ? <div className="flex h-full flex-col items-center justify-center gap-2 bg-secondary"><Waveform playing={false} bars={10} className="h-8" /></div> :
              <p className="p-2 text-xs">{it.text}</p>}
            <span className="absolute right-1.5 top-1.5">{it.kind === "video" ? <Play className="h-4 w-4 fill-foreground" /> : it.kind === "audio" ? <AudioLines className="h-4 w-4 text-primary" /> : it.kind === "photo" ? <ImageIcon className="h-4 w-4" /> : null}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
