import { useEffect, useRef, useState } from "react";
import { Plus, X, Heart, Send, Camera, ImagePlus, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { USERS, type User } from "./data";
import { claimMediaFocus, releaseMediaFocus } from "./mediaCoordinator";

type Slide = { video?: string; image?: string; text?: string };
type Story = { user: User; slides: Slide[] };

const SEED: Story[] = [
  {
    user: USERS.haha,
    slides: [
      { video: "https://cdn.coverr.co/videos/coverr-girl-touches-a-dog-s-nose-3909/720p.mp4" },
      { text: "More dog bloopers dropping tonight 😂🐶" },
    ],
  },
  {
    user: USERS.amara,
    slides: [
      { video: "https://cdn.coverr.co/videos/coverr-woman-dancing-in-the-street-7552/720p.mp4" },
    ],
  },
  {
    user: USERS.zuri,
    slides: [
      {
        video: "https://cdn.coverr.co/videos/coverr-vlogger-greeting-audience-by-the-sea/720p.mp4",
      },
      { text: "Coastal vlog up on the feed 🌊📸" },
    ],
  },
  {
    user: USERS.dre,
    slides: [
      { video: "https://cdn.coverr.co/videos/coverr-slow-mo-basketball-hoop-5187/720p.mp4" },
      { text: "Game winner in slow-mo 🏀🔥" },
    ],
  },
  {
    user: USERS.yung,
    slides: [{ video: "https://cdn.coverr.co/videos/coverr-dj-at-a-party-8079/720p.mp4" }],
  },
  { user: USERS.taya, slides: [{ text: "5-min breakfast hack just dropped 🍳✨" }] },
];

function Ring({ user, seen, size = 60 }: { user: User; seen: boolean; size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasAvatar = Boolean(user.avatar);
  const emoji =
    hasAvatar &&
    !user.avatar.startsWith("http") &&
    !user.avatar.startsWith("/") &&
    !user.avatar.startsWith("data") &&
    !user.avatar.startsWith("blob");
  const initial = (user.name.trim() || user.handle.replace(/^@/, "").trim() || "T")
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className={`rounded-full p-[2px] ${
        seen
          ? "bg-[#222228]"
          : "bg-gradient-to-tr from-[#FFB800]/80 via-[#FFB800]/55 to-[#FFB800]/25"
      }`}
    >
      <div
        className="overflow-hidden rounded-full border-2 border-[#0A0A0C] bg-[#141418]"
        style={{ width: size, height: size }}
      >
        {!hasAvatar || imgFailed ? (
          <div
            className="flex h-full w-full items-center justify-center bg-[#0A0A0C] font-bold text-[#FFB800]"
            style={{ fontSize: Math.max(14, Math.round(size * 0.36)) }}
          >
            {initial}
          </div>
        ) : emoji ? (
          <div className="flex h-full items-center justify-center text-2xl">{user.avatar}</div>
        ) : (
          <img
            src={user.avatar}
            alt={user.name}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}

export function StoriesBar({ me }: { me: User }) {
  const [stories, setStories] = useState(SEED);
  const [seen, setSeen] = useState<string[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const storyCamRef = useRef<HTMLInputElement>(null);
  const storyGalleryRef = useRef<HTMLInputElement>(null);

  const publishMine = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setStories((s) => [
      { user: me, slides: [{ text: trimmed }] },
      ...s.filter((x) => x.user.id !== me.id),
    ]);
    setDraft("");
    setComposing(false);
    toast.success("Your vibe drop is live for 24h");
  };

  const publishStoryMedia = (file: File) => {
    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");
    if (!isVid && !isImg) {
      toast.error("Choose a photo or video for your story.");
      return;
    }
    const url = URL.createObjectURL(file);
    const slide: Slide = isVid
      ? { video: url, ...(draft.trim() ? { text: draft.trim() } : {}) }
      : { image: url, ...(draft.trim() ? { text: draft.trim() } : {}) };
    setStories((s) => [{ user: me, slides: [slide] }, ...s.filter((x) => x.user.id !== me.id)]);
    setDraft("");
    setComposing(false);
    toast.success("Your story is live for 24h");
  };

  const mine = stories.find((s) => s.user.id === me.id);

  return (
    <>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 py-3">
        <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              aria-label={mine ? "View your vibe drop" : "Add your vibe drop"}
              onClick={() => (mine ? setOpen(0) : setComposing(true))}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800]"
            >
              <Ring user={me} seen={!mine} />
            </button>
            <button
              type="button"
              aria-label="Add vibe drop"
              onClick={() => setComposing(true)}
              className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0A0A0C] bg-[#FFB800] text-[#0A0A0C] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
          </div>
          <span className="w-full truncate text-center text-xs text-foreground">Your vibe</span>
        </div>

        {stories.map((s, i) =>
          s.user.id === me.id ? null : (
            <button
              type="button"
              key={s.user.id}
              onClick={() => setOpen(i)}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB800]"
            >
              <Ring user={s.user} seen={seen.includes(s.user.id)} />
              <span className="w-full truncate text-center text-xs text-muted-foreground">
                {s.user.name}
              </span>
            </button>
          ),
        )}
      </div>

      {composing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C]/80 backdrop-blur-sm sm:items-center"
          onClick={() => setComposing(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              publishMine();
            }}
            className="animate-rise w-full max-w-md rounded-t-3xl border border-[#222228] bg-[#141418] p-5 sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Drop a 24h vibe</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setComposing(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-[#222228] hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={140}
              autoFocus
              placeholder="Drop a quick thought or studio update…"
              className="w-full resize-none rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-[#FFB800]"
            />
            <input
              ref={storyCamRef}
              type="file"
              accept="video/*,image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) publishStoryMedia(f);
              }}
            />
            <input
              ref={storyGalleryRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.currentTarget.value = "";
                if (f) publishStoryMedia(f);
              }}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => storyCamRef.current?.click()}
                className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-[#222228] bg-[#0A0A0C] text-xs font-semibold text-foreground transition hover:border-[#FFB800]"
              >
                <Camera className="h-4 w-4 text-[#FFB800]" />
                <span>Open Camera</span>
              </button>
              <button
                type="button"
                onClick={() => storyGalleryRef.current?.click()}
                className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-[#222228] bg-[#0A0A0C] text-xs font-semibold text-foreground transition hover:border-[#FFB800]"
              >
                <ImagePlus className="h-4 w-4 text-[#FFB800]" />
                <span>Gallery</span>
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs tabular-nums text-muted-foreground">{draft.length}/140</span>
              <button
                type="submit"
                disabled={!draft.trim()}
                className="min-h-[44px] rounded-full bg-[#FFB800] px-6 py-2 text-sm font-semibold text-[#0A0A0C] transition hover:brightness-110 disabled:opacity-40"
              >
                Share vibe
              </button>
            </div>
          </form>
        </div>
      )}

      {open !== null && stories[open] && (
        <Viewer
          stories={stories}
          start={open}
          onSeen={(id) => setSeen((v) => (v.includes(id) ? v : [...v, id]))}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function Viewer({
  stories,
  start,
  onSeen,
  onClose,
}: {
  stories: Story[];
  start: number;
  onSeen: (id: string) => void;
  onClose: () => void;
}) {
  const [si, setSi] = useState(start);
  const [i, setI] = useState(0);
  const [reply, setReply] = useState("");
  const [muted, setMuted] = useState(false);
  const story = stories[si];
  const next = () => {
    if (!story) return;
    if (i < story.slides.length - 1) setI(i + 1);
    else if (si < stories.length - 1) {
      setSi(si + 1);
      setI(0);
    } else onClose();
  };
  const prev = () => {
    if (i > 0) setI(i - 1);
    else if (si > 0) {
      setSi(si - 1);
      setI(0);
    }
  };
  useEffect(() => {
    claimMediaFocus("story-viewer");
    return () => {
      releaseMediaFocus("story-viewer");
    };
  }, []);
  useEffect(() => {
    if (story) onSeen(story.user.id);
    const t = setTimeout(next, 5000);
    return () => clearTimeout(t);
  });
  if (!story) return null;
  const slide = story.slides[i];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0C]">
      <div className="relative h-dvh w-full max-w-md overflow-hidden border-[#222228] bg-[#141418] sm:h-[90dvh] sm:rounded-3xl sm:border">
        {slide?.video ? (
          <video
            key={slide.video}
            src={slide.video}
            autoPlay
            loop
            muted={muted}
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              void e.currentTarget.play().catch(() => {
                e.currentTarget.muted = true;
                void e.currentTarget.play().catch(() => {});
              });
            }}
            className="h-full w-full object-cover"
          />
        ) : slide?.image ? (
          <img
            src={slide.image}
            alt={slide.text || `${story.user.name} story`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#FFB800]/20 via-[#141418] to-[#0A0A0C] p-8 text-center text-3xl font-bold text-foreground">
            {slide?.text}
          </div>
        )}
        <div className="absolute inset-x-0 top-0 space-y-3 bg-gradient-to-b from-[#0A0A0C]/85 to-transparent p-3">
          <div className="flex gap-1">
            {story.slides.map((_, k) => (
              <div
                key={`${si}-${k}`}
                className="h-0.5 flex-1 overflow-hidden rounded bg-foreground/30"
              >
                <div
                  className={`h-full bg-[#FFB800] ${k < i ? "w-full" : k === i ? "story-progress" : "w-0"}`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Ring user={story.user} seen size={32} />
            <span className="font-semibold text-foreground">{story.user.name}</span>
            <span className="text-xs text-muted-foreground">2h</span>
            {slide?.video && (
              <button
                type="button"
                aria-label={muted ? "Unmute story" : "Mute story"}
                onClick={() => setMuted((m) => !m)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C]/55 text-foreground"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}
            <button
              aria-label="Close story"
              onClick={onClose}
              className={`${slide?.video ? "" : "ml-auto "}flex h-10 w-10 items-center justify-center rounded-full text-foreground`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        <button aria-label="Previous" onClick={prev} className="absolute inset-y-16 left-0 w-1/3" />
        <button aria-label="Next" onClick={next} className="absolute inset-y-16 right-0 w-2/3" />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reply.trim()) {
              toast.success(`Reply sent to ${story.user.name}`);
              setReply("");
            }
          }}
          className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-[#0A0A0C]/90 to-transparent p-4"
        >
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={`Reply to ${story.user.name}…`}
            className="min-h-[44px] flex-1 rounded-full border border-[#222228] bg-[#141418]/80 px-4 py-2.5 text-sm text-foreground outline-none backdrop-blur focus:border-[#FFB800]"
          />
          <button
            type="button"
            aria-label="Like story"
            onClick={() => toast("Liked vibe")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:text-[#FFB800]"
          >
            <Heart className="h-6 w-6" />
          </button>
          <button
            aria-label="Send reply"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C]"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
