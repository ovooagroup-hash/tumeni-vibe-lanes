import { useEffect, useState } from "react";
import { Plus, X, Heart, Send } from "lucide-react";
import { toast } from "sonner";
import { USERS, type User } from "./data";
import artist from "@/assets/artist.jpg";
import studio from "@/assets/studio.jpg";
import street from "@/assets/street.jpg";
import meme from "@/assets/meme.jpg";

type Slide = { src?: string; text?: string };
type Story = { user: User; slides: Slide[] };

const SEED: Story[] = [
  { user: USERS.nala, slides: [{ src: street }, { text: "Sunday vibes only ☀️" }] },
  { user: USERS.yung, slides: [{ src: artist }, { src: studio }] },
  { user: USERS.haha, slides: [{ src: meme }] },
  { user: USERS.kito, slides: [{ src: studio }, { text: "New beat drops tonight 🔥" }] },
  { user: USERS.zuri, slides: [{ text: "Who's pulling up later? 👀" }] },
  { user: USERS.dre, slides: [{ src: street }] },
];

function Ring({ user, seen, size = 64 }: { user: User; seen: boolean; size?: number }) {
  const emoji = !user.avatar.startsWith("http") && !user.avatar.startsWith("/") && !user.avatar.startsWith("data");
  return (
    <div className={`rounded-full p-[2.5px] ${seen ? "bg-border" : "bg-gradient-to-tr from-primary via-primary/70 to-primary/30 glow"}`}>
      <div className="overflow-hidden rounded-full border-2 border-background bg-secondary" style={{ width: size, height: size }}>
        {emoji ? <div className="flex h-full items-center justify-center text-2xl">{user.avatar}</div> : <img src={user.avatar} alt="" className="h-full w-full object-cover" />}
      </div>
    </div>
  );
}

export function StoriesBar({ me }: { me: User }) {
  const [stories, setStories] = useState(SEED);
  const [seen, setSeen] = useState<string[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const addMine = () => {
    const text = window.prompt("Drop a quick vibe for 24h:");
    if (!text?.trim()) return;
    setStories((s) => [{ user: me, slides: [{ text: text.trim() }] }, ...s.filter((x) => x.user.id !== me.id)]);
    toast.success("Your vibe is live for 24h");
  };
  const mine = stories.find((s) => s.user.id === me.id);
  return (
    <>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-3">
        <button onClick={mine ? () => setOpen(0) : addMine} className="flex w-16 shrink-0 flex-col items-center gap-1">
          <div className="relative"><Ring user={me} seen={!mine} /><span onClick={(e) => { e.stopPropagation(); addMine(); }} className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground"><Plus className="h-3.5 w-3.5" /></span></div>
          <span className="w-full truncate text-center text-xs">Your vibe</span>
        </button>
        {stories.map((s, i) => s.user.id === me.id ? null : (
          <button key={s.user.id} onClick={() => setOpen(i)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <Ring user={s.user} seen={seen.includes(s.user.id)} />
            <span className="w-full truncate text-center text-xs text-muted-foreground">{s.user.name}</span>
          </button>
        ))}
      </div>
      {open !== null && stories[open] && <Viewer stories={stories} start={open} onSeen={(id) => setSeen((v) => v.includes(id) ? v : [...v, id])} onClose={() => setOpen(null)} />}
    </>
  );
}

function Viewer({ stories, start, onSeen, onClose }: { stories: Story[]; start: number; onSeen: (id: string) => void; onClose: () => void }) {
  const [si, setSi] = useState(start);
  const [i, setI] = useState(0);
  const [reply, setReply] = useState("");
  const story = stories[si];
  const next = () => { if (!story) return; if (i < story.slides.length - 1) setI(i + 1); else if (si < stories.length - 1) { setSi(si + 1); setI(0); } else onClose(); };
  const prev = () => { if (i > 0) setI(i - 1); else if (si > 0) { setSi(si - 1); setI(0); } };
  useEffect(() => { if (story) onSeen(story.user.id); const t = setTimeout(next, 5000); return () => clearTimeout(t); });
  if (!story) return null;
  const slide = story.slides[i];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative h-dvh w-full max-w-md overflow-hidden bg-card sm:h-[90dvh] sm:rounded-3xl">
        {slide?.src ? <img src={slide.src} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-background p-8 text-center text-3xl font-bold">{slide?.text}</div>}
        <div className="absolute inset-x-0 top-0 space-y-3 bg-gradient-to-b from-background/80 to-transparent p-3">
          <div className="flex gap-1">{story.slides.map((_, k) => <div key={`${si}-${k}`} className="h-0.5 flex-1 overflow-hidden rounded bg-foreground/30"><div className={`h-full bg-foreground ${k < i ? "w-full" : k === i ? "story-progress" : "w-0"}`} /></div>)}</div>
          <div className="flex items-center gap-2"><Ring user={story.user} seen size={32} /><span className="font-semibold">{story.user.name}</span><span className="text-xs text-muted-foreground">2h</span><button aria-label="Close story" onClick={onClose} className="ml-auto"><X className="h-6 w-6" /></button></div>
        </div>
        <button aria-label="Previous" onClick={prev} className="absolute inset-y-16 left-0 w-1/3" />
        <button aria-label="Next" onClick={next} className="absolute inset-y-16 right-0 w-2/3" />
        <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) { toast.success(`Reply sent to ${story.user.name}`); setReply(""); } }} className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-background/90 to-transparent p-4">
          <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Reply to ${story.user.name}…`} className="flex-1 rounded-full border border-border bg-background/60 px-4 py-2.5 outline-none backdrop-blur" />
          <button type="button" aria-label="Like story" onClick={() => toast("Co-signed ❤️")}><Heart className="h-6 w-6" /></button>
          <button aria-label="Send reply"><Send className="h-6 w-6" /></button>
        </form>
      </div>
    </div>
  );
}
