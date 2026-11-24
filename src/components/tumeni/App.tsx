import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Heart,
  MessageCircle,
  Send,
  Play,
  Pause,
  MoreHorizontal,
  BadgeCheck,
  Home,
  Plus,
  User as UserIcon,
  X,
  ArrowLeft,
  Video,
  Image as ImageIcon,
  AudioLines,
  MessageSquareText,
  Users,
  Music,
  Eye,
  Bookmark,
  Check,
  LogOut,
  Repeat,
  Clapperboard,
  Volume2,
  VolumeX,
  Globe,
  Lock,
  Radio,
  Upload,
  Camera,
  Hash,
} from "lucide-react";
import { LogoMark } from "./Logo";
import {
  SEED_POSTS,
  SEED_CHATS,
  PROFILES,
  GRID,
  SUGGESTED_PEOPLE,
  CREWS,
  POST_AUDIENCES,
  LIVE_ROOM,
  getVisiblePosts,
  fmt,
  getUser,
  type Audience,
  type Kind,
  type Post,
  type Chat,
  type ChatAttachment,
  type User,
  type GridItem,
  type Crew,
  type VoiceNote,
} from "./data";
import { toggleSelection, profileError, type SetupProfile } from "./onboarding";
import { StoriesBar } from "./Stories";
import { Avatar, Waveform } from "./SharedUI";
import { CircleRadarCarousel, CircleRadarHub, type RadarFilter } from "./CircleRadar";
import { MessagesList, CrewChatRoom } from "./CrewChat";
import { LiveMiniPlayer, LiveRoomBanner, LiveVibeRoomSheet } from "./LiveVibeRoom";

type Tab = "home" | "explore" | "messages" | "profile";

function AudienceBadge({ audience = "public" }: { audience?: Audience | undefined }) {
  const Icon = audience === "private" ? Lock : audience === "friends" ? Users : Globe;
  const label =
    audience === "private" ? "Only Me" : audience === "friends" ? "Friends Only" : "Public";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={label}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

function Actions({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
}: {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}) {
  const Item = ({
    children,
    label,
    onClick,
    aria,
  }: {
    children: React.ReactNode;
    label?: string;
    onClick: () => void;
    aria: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className="flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 text-xs font-medium tabular-nums transition active:scale-90"
    >
      {children}
      {label !== undefined && <span>{label}</span>}
    </button>
  );
  return (
    <div className="flex flex-col items-center gap-2">
      <Item onClick={onLike} label={fmt(post.likes)} aria="Like">
        <Heart
          className={`h-6 w-6 transition ${
            post.liked ? "scale-110 fill-[#FFB800] text-[#FFB800]" : "text-[#FFB800]"
          }`}
        />
      </Item>
      <Item onClick={onComment} label={fmt(post.comments.length)} aria="Comments">
        <MessageCircle className="h-6 w-6" />
      </Item>
      <Item onClick={onShare} label={fmt(post.shares)} aria="Send in">
        <Send className="h-6 w-6" />
      </Item>
      <Item onClick={onSave} aria={post.saved ? "Remove from saved" : "Save drop"}>
        <Bookmark
          className={`h-5 w-5 transition ${post.saved ? "fill-[#FFB800] text-[#FFB800]" : ""}`}
        />
      </Item>
    </div>
  );
}

function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onOpen,
}: {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onOpen?: (() => void) | undefined;
}) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      void a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [playing]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (playing) {
      void v.play().catch(() => {
        v.muted = true;
        setMuted(true);
        void v.play().catch(() => {});
      });
    } else {
      v.pause();
    }
  }, [playing, muted]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!playing || post.kind !== "audio" || post.audio) return;
    const t = setInterval(() => setElapsed((e) => (e >= 42 ? 0 : e + 1)), 1000);
    return () => clearInterval(t);
  }, [playing, post.kind, post.audio]);

  const videoSrc = post.video ?? post.media;

  return (
    <article className="animate-rise border-b border-[#222228] bg-[#141418] py-3 sm:rounded-3xl sm:border sm:p-4">
      <header className="flex items-center gap-3 px-4 py-2 sm:px-0">
        <Avatar src={post.user.avatar} name={post.user.name} handle={post.user.handle} ring />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="truncate">{post.user.name}</span>
            {post.user.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{post.user.handle}</span>
            <span aria-hidden="true">·</span>
            <span>{post.time}</span>
            <span aria-hidden="true">·</span>
            <AudienceBadge audience={post.audience} />
          </div>
        </div>
        <button
          type="button"
          aria-label={post.saved ? "Saved" : "Save drop"}
          onClick={onSave}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-[#222228] hover:text-foreground"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      {post.kind === "video" && (
        <div className="relative mt-2 overflow-hidden bg-[#0A0A0C] sm:rounded-2xl">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="aspect-[4/5] w-full bg-[#0A0A0C] object-cover"
              loop
              muted={muted}
              playsInline
              preload="metadata"
              onClick={() => setPlaying((prev) => !prev)}
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#0A0A0C] text-sm text-muted-foreground">
              Video unavailable
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-transparent to-[#0A0A0C]/25" />

          <button
            type="button"
            aria-label={playing ? "Pause video" : "Play video"}
            onClick={() => setPlaying((prev) => !prev)}
            className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0A0A0C]/70 text-foreground backdrop-blur transition ${
              playing ? "opacity-0 hover:opacity-100" : "opacity-100"
            }`}
          >
            {playing ? (
              <Pause className="h-7 w-7 fill-foreground" />
            ) : (
              <Play className="ml-1 h-7 w-7 fill-foreground" />
            )}
          </button>

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-[#0A0A0C]/70 px-2.5 py-1 text-xs tabular-nums backdrop-blur">
              <Eye className="h-3.5 w-3.5 text-[#FFB800]" /> {fmt(post.views ?? 0)}
            </span>
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <button
              type="button"
              aria-label={muted ? "Unmute video" : "Mute video"}
              onClick={() => setMuted((m) => !m)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C]/70 text-foreground backdrop-blur transition hover:text-[#FFB800]"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            {onOpen && (
              <button
                type="button"
                aria-label="Open in Reels"
                onClick={onOpen}
                className="flex h-9 items-center gap-1 rounded-full bg-[#0A0A0C]/70 px-3 text-xs font-medium text-foreground backdrop-blur transition hover:text-[#FFB800]"
              >
                <Clapperboard className="h-3.5 w-3.5 text-[#FFB800]" />
                <span>Reels</span>
              </button>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-20 space-y-1.5">
            <p className="text-sm font-medium text-foreground">{post.user.handle}</p>
            <p className="text-sm leading-relaxed text-foreground">
              {post.caption}{" "}
              {post.tag && <span className="font-medium text-[#FFB800]">{post.tag}</span>}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Music className="h-3.5 w-3.5 shrink-0 text-[#FFB800]" />
              <span className="truncate">
                {post.track ?? `Original Audio — ${post.user.handle}`}
              </span>
            </div>
          </div>

          <div className="absolute bottom-4 right-2">
            <Actions
              post={post}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onSave={onSave}
            />
          </div>
          {playing && (
            <div className="animate-progress absolute bottom-0 left-0 h-1 bg-[#FFB800]" />
          )}
        </div>
      )}

      {post.kind === "photo" && (
        <div className="mt-2 flex gap-3 px-4 pb-2 sm:px-0">
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-sm leading-relaxed text-foreground">
              {post.caption}{" "}
              {post.tag && <span className="font-medium text-[#FFB800]">{post.tag}</span>}
            </p>
            {post.media && (
              <img
                src={post.media}
                alt={post.caption}
                referrerPolicy="no-referrer"
                className="w-full rounded-2xl border border-[#222228] bg-[#0A0A0C] object-cover"
              />
            )}
          </div>
          <div className="flex items-end pb-1">
            <Actions
              post={post}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onSave={onSave}
            />
          </div>
        </div>
      )}

      {post.kind === "text" && (
        <div className="mt-2 flex gap-3 px-4 pb-2 sm:px-0">
          <div className="min-w-0 flex-1 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-5">
            <p className="text-lg font-medium leading-relaxed text-foreground">{post.caption}</p>
            {post.tag && <p className="mt-3 text-xs font-medium text-[#FFB800]">{post.tag}</p>}
          </div>
          <div className="flex items-end">
            <Actions
              post={post}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onSave={onSave}
            />
          </div>
        </div>
      )}

      {post.kind === "audio" && (
        <div className="mt-2 flex gap-3 px-4 pb-2 sm:px-0">
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-sm leading-relaxed text-foreground">
              {post.caption}{" "}
              {post.tag && <span className="font-medium text-[#FFB800]">{post.tag}</span>}
            </p>
            <div className="flex items-center gap-3 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3">
              {post.audio && (
                <audio
                  ref={audioRef}
                  src={post.audio}
                  loop
                  preload="none"
                  onTimeUpdate={(e) => setElapsed(Math.floor(e.currentTarget.currentTime) % 60)}
                />
              )}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#222228] bg-[#141418]">
                <Music className="h-6 w-6 text-[#FFB800]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{post.track}</p>
                <Waveform playing={playing} bars={24} className="mt-1.5 h-8" />
                <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                  0:{String(elapsed).padStart(2, "0")} / {post.duration ?? "0:30"}
                </p>
              </div>
              <button
                type="button"
                aria-label={playing ? "Pause track" : "Play track"}
                onClick={() => setPlaying(!playing)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C] glow transition hover:brightness-110"
              >
                {playing ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <Actions
              post={post}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onSave={onSave}
            />
          </div>
        </div>
      )}
    </article>
  );
}

function ComposerBox({ me, onOpenCreate }: { me: User; onOpenCreate: (kind: Kind) => void }) {
  const firstName = me.name.split(" ")[0] || me.name;
  const shortcuts: { kind: Kind; label: string; Icon: typeof Video }[] = [
    { kind: "video", label: "Video", Icon: Video },
    { kind: "photo", label: "Photo", Icon: ImageIcon },
    { kind: "audio", label: "Track", Icon: Music },
    { kind: "text", label: "Thought", Icon: MessageSquareText },
  ];

  return (
    <section
      aria-label="Create a post"
      className="border-b border-[#222228] bg-[#141418] p-4 sm:mx-4 sm:mt-4 sm:rounded-3xl sm:border"
    >
      <div className="flex items-center gap-3">
        <Avatar src={me.avatar} name={me.name} handle={me.handle} size={44} ring />
        <button
          type="button"
          onClick={() => onOpenCreate("text")}
          className="min-h-[44px] flex-1 truncate rounded-full border border-[#222228] bg-[#0A0A0C] px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:border-[#FFB800]/60 hover:text-foreground"
        >
          What&apos;s on your mind, {firstName}?
        </button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5 border-t border-[#222228] pt-3">
        {shortcuts.map(({ kind, label, Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onOpenCreate(kind)}
            className="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-medium text-foreground transition hover:bg-[#0A0A0C] hover:text-[#FFB800]"
          >
            <Icon className="h-4 w-4 shrink-0 text-[#FFB800]" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C]/75 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-rise w-full max-w-md rounded-t-3xl border border-[#222228] bg-[#141418] p-5 pb-8 sm:rounded-3xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#222228] sm:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-[#222228] hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const QUICK_HASHTAGS = ["#StayTuned", "#NightOut", "#BeatMaker", "#Dance", "#Comedy"];

function CreatePost({
  initialKind = "video",
  me,
  onClose,
  onPublish,
}: {
  initialKind?: Kind;
  me: User;
  onClose: () => void;
  onPublish: (p: {
    kind: Kind;
    audience: Audience;
    caption: string;
    tag?: string | undefined;
    track?: string | undefined;
    media?: string | undefined;
    isVideo?: boolean | undefined;
  }) => void;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [audience, setAudience] = useState<Audience>("public");
  const [caption, setCaption] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [audioTag, setAudioTag] = useState(`Original Audio — ${me.handle}`);
  const [media, setMedia] = useState<string>();
  const [fileName, setFileName] = useState<string>();
  const [isVideo, setIsVideo] = useState(false);
  const [isAudioFile, setIsAudioFile] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [previewPaused, setPreviewPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = previewVideoRef.current;
    if (!v) return;
    v.muted = previewMuted;
    if (previewPaused) {
      v.pause();
    } else {
      void v.play().catch(() => {});
    }
  }, [previewMuted, previewPaused, media]);

  const kinds: { id: Kind; label: string; I: typeof Video }[] = [
    { id: "video", label: "Video", I: Video },
    { id: "photo", label: "Photo", I: ImageIcon },
    { id: "audio", label: "Track", I: AudioLines },
    { id: "text", label: "Thought", I: MessageSquareText },
  ];

  const audienceIcons: Record<Audience, typeof Globe> = {
    public: Globe,
    friends: Users,
    private: Lock,
  };

  const handleSelectedFile = (f: File) => {
    const url = URL.createObjectURL(f);
    setFileName(f.name);
    if (f.type.startsWith("video/")) {
      setKind("video");
      setMedia(url);
      setIsVideo(true);
      setIsAudioFile(false);
      setPreviewPaused(false);
      return;
    }
    if (f.type.startsWith("image/")) {
      setKind("photo");
      setMedia(url);
      setIsVideo(false);
      setIsAudioFile(false);
      return;
    }
    if (f.type.startsWith("audio/")) {
      setKind("audio");
      setMedia(url);
      setIsVideo(false);
      setIsAudioFile(true);
      setAudioTag(f.name.replace(/\.[^.]+$/, ""));
      return;
    }
    toast.error("Unsupported file type. Choose a video, image, or audio file.");
  };

  const toggleQuickTag = (t: string) => {
    const tokens = hashtag
      .split(/\s+/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (tokens.includes(t)) {
      setHashtag(tokens.filter((x) => x !== t).join(" "));
    } else {
      setHashtag([...tokens, t].join(" "));
    }
  };

  const publish = () => {
    if (kind === "video" && (!media || !isVideo)) {
      toast.error("Select a video from your device first");
      return;
    }
    if (kind === "photo" && (!media || isVideo || isAudioFile)) {
      toast.error("Select a photo from your device first");
      return;
    }
    if (kind === "text" && !caption.trim()) {
      toast.error("Write a thought first");
      return;
    }
    const cleanedTag = hashtag
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");

    onPublish({
      kind,
      audience,
      caption:
        caption.trim() ||
        (kind === "audio" ? "Fresh audio drop 🎧" : kind === "video" ? "New video drop" : ""),
      tag: cleanedTag || undefined,
      track:
        kind === "video" || kind === "audio"
          ? audioTag.trim() || `Original Audio — ${me.handle}`
          : undefined,
      media,
      isVideo: kind === "video" ? true : undefined,
    });
  };

  const submitLabel =
    kind === "video"
      ? "Drop Video"
      : kind === "photo"
        ? "Drop Photo"
        : kind === "audio"
          ? "Drop Track"
          : "Drop Thought";

  return (
    <div className="animate-rise fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C]/85 backdrop-blur-md sm:items-center">
      <div className="flex max-h-[95dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[#222228] bg-[#141418] sm:rounded-3xl">
        {/* Clean Header */}
        <div className="flex items-center justify-between border-b border-[#222228] px-5 py-4">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-[#0A0A0C] hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-foreground">Create Drop</h2>
          <div className="w-10" />
        </div>

        {/* Format Tabs */}
        <div className="grid grid-cols-4 gap-1 border-b border-[#222228] bg-[#0A0A0C] p-1.5">
          {kinds.map(({ id, label, I }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setKind(id);
                if (id === "text") {
                  setMedia(undefined);
                  setFileName(undefined);
                  setIsVideo(false);
                  setIsAudioFile(false);
                }
              }}
              className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition ${
                kind === id
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <I className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Upload + Details Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <input
            ref={fileRef}
            type="file"
            hidden
            accept={kind === "audio" ? "audio/*" : kind === "photo" ? "image/*" : "video/*"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleSelectedFile(f);
            }}
          />

          {kind === "video" && (
            <div>
              {media && isVideo ? (
                <div className="relative mx-auto aspect-[9/16] max-h-[40dvh] overflow-hidden rounded-2xl border border-[#222228] bg-[#0A0A0C]">
                  <video
                    ref={previewVideoRef}
                    src={media}
                    autoPlay
                    loop
                    muted={previewMuted}
                    playsInline
                    onClick={() => setPreviewPaused((p) => !p)}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="min-h-[36px] rounded-full bg-[#0A0A0C]/75 px-3 text-xs font-medium text-foreground backdrop-blur hover:text-[#FFB800]"
                    >
                      Change Video
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={previewPaused ? "Play preview" : "Pause preview"}
                        onClick={() => setPreviewPaused((p) => !p)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C]/75 text-foreground backdrop-blur hover:text-[#FFB800]"
                      >
                        {previewPaused ? (
                          <Play className="h-4 w-4 fill-current" />
                        ) : (
                          <Pause className="h-4 w-4 fill-current" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={previewMuted ? "Unmute preview" : "Mute preview"}
                        onClick={() => setPreviewMuted((m) => !m)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C]/75 text-foreground backdrop-blur hover:text-[#FFB800]"
                      >
                        {previewMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {fileName && (
                    <div className="pointer-events-none absolute inset-x-3 bottom-3 truncate rounded-full bg-[#0A0A0C]/75 px-3 py-1 text-center text-xs text-muted-foreground backdrop-blur">
                      {fileName}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleSelectedFile(f);
                  }}
                  className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
                    dragging ? "border-[#FFB800] bg-[#FFB800]/10" : "border-[#222228] bg-[#0A0A0C]"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#222228] bg-[#141418] text-[#FFB800]">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Upload a vertical video for Feed &amp; Reels
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    MP4, MOV, or WebM from your device (9:16 recommended)
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#FFB800] px-5 text-xs font-semibold text-[#0A0A0C] transition hover:brightness-110"
                  >
                    <Video className="h-4 w-4" />
                    <span>Select Video from Device</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {kind === "photo" && (
            <div>
              {media && !isVideo && !isAudioFile ? (
                <div className="relative overflow-hidden rounded-2xl border border-[#222228] bg-[#0A0A0C]">
                  <img
                    src={media}
                    alt="Selected photo preview"
                    className="max-h-[38dvh] w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute right-3 top-3 min-h-[36px] rounded-full bg-[#0A0A0C]/80 px-3 text-xs font-medium text-foreground backdrop-blur hover:text-[#FFB800]"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[#222228] bg-[#0A0A0C] px-6 py-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#222228] bg-[#141418] text-[#FFB800]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    Choose a photo from your device
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#FFB800] px-5 text-xs font-semibold text-[#0A0A0C] transition hover:brightness-110"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Select Photo from Device</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {kind === "audio" && (
            <div className="space-y-3 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {fileName ? fileName : "Audio Track"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAudioFile && media
                      ? "Ready to stream in feed"
                      : "Optional: attach an MP3 / WAV from your device"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="min-h-[40px] shrink-0 rounded-full border border-[#222228] bg-[#141418] px-4 text-xs font-semibold text-[#FFB800] hover:border-[#FFB800]"
                >
                  {isAudioFile ? "Change File" : "Select Audio"}
                </button>
              </div>
              <Waveform playing bars={38} className="h-10 justify-center" />
              {isAudioFile && media && <audio src={media} controls className="w-full" />}
            </div>
          )}

          {/* Caption */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {kind === "text" ? "Thought" : "Caption"}
            </span>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={kind === "text" ? 4 : 2}
              maxLength={280}
              placeholder={
                kind === "text" ? "What's on your mind?" : "Write a caption for your circle…"
              }
              className="w-full resize-none rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#FFB800]"
            />
          </label>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 rounded-2xl border border-[#222228] bg-[#0A0A0C] px-3.5 focus-within:border-[#FFB800]">
              <Hash className="h-4 w-4 shrink-0 text-[#FFB800]" />
              <input
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                placeholder="Add tags (e.g. #NightOut #Afrohouse)"
                className="min-h-[44px] w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {QUICK_HASHTAGS.map((t) => {
                const active = hashtag.split(/\s+/).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleQuickTag(t)}
                    className={`min-h-[32px] shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition ${
                      active
                        ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                        : "border-[#222228] bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Audio Tag for Video / Track */}
          {(kind === "video" || kind === "audio") && (
            <label className="flex items-center gap-2 rounded-2xl border border-[#222228] bg-[#0A0A0C] px-3.5 focus-within:border-[#FFB800]">
              <Music className="h-4 w-4 shrink-0 text-[#FFB800]" />
              <input
                value={audioTag}
                onChange={(e) => setAudioTag(e.target.value)}
                placeholder={`Original Audio — ${me.handle}`}
                className="min-h-[44px] w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
          )}

          {/* Audience / Privacy Selector */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Audience</p>
            <div className="grid grid-cols-3 gap-2">
              {POST_AUDIENCES.map((opt) => {
                const Icon = audienceIcons[opt.id];
                const active = audience === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAudience(opt.id)}
                    className={`flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 text-xs font-medium transition ${
                      active
                        ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                        : "border-[#222228] bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer Submit */}
        <div className="border-t border-[#222228] bg-[#141418] p-4 pb-6">
          <button
            type="button"
            onClick={publish}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#FFB800] text-sm font-bold text-[#0A0A0C] glow transition hover:brightness-110 active:scale-[0.98]"
          >
            <Clapperboard className="h-4 w-4" />
            <span>{submitLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function TumeniApp({
  account,
  setup,
  onSetupChange,
  onLogout,
}: {
  account: string;
  setup: SetupProfile;
  onSetupChange: (profile: SetupProfile) => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [radarFilter, setRadarFilter] = useState<RadarFilter>("suggested");
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [chats, setChats] = useState<Chat[]>(SEED_CHATS);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<Post | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [creatingKind, setCreatingKind] = useState<Kind | null>(null);
  const [profileIdx, setProfileIdx] = useState(0);
  const [switcher, setSwitcher] = useState(false);
  const [notif, setNotif] = useState(true);
  const [reelAt, setReelAt] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [joinedCrews, setJoinedCrews] = useState<string[]>([]);

  // Live Vibe Room state
  const [liveJoined, setLiveJoined] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveStreamMuted, setLiveStreamMuted] = useState(false);
  const [liveMicMuted, setLiveMicMuted] = useState(true);
  const [liveHandRaised, setLiveHandRaised] = useState(false);
  const [liveOnStage, setLiveOnStage] = useState(false);
  const liveAudioRef = useRef<HTMLAudioElement>(null);

  const reelPosts = posts.filter((p) => p.kind === "video" || p.video || p.mediaIsVideo);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab, openChat]);

  useEffect(() => {
    const audio = liveAudioRef.current;
    if (!audio) return;
    audio.muted = liveStreamMuted;
    if (liveJoined && !liveStreamMuted) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [liveJoined, liveStreamMuted]);

  const myUser: User = { id: "me", name: setup.name, handle: setup.handle, avatar: setup.avatar };
  const profiles: User[] = [myUser, ...PROFILES];
  const profile = profiles[profileIdx] ?? myUser;
  const isMe = profileIdx === 0;
  const me: User = {
    id: isMe ? "me" : profile.id,
    name: profile.name,
    handle: profile.handle,
    avatar: profile.avatar,
  };

  const tappedIds = setup.friends;
  const liveListenerCount = LIVE_ROOM.baseListeners + (liveJoined ? 1 : 0);

  const openReels = (startId?: string) => {
    const firstId = startId ?? reelPosts[0]?.id;
    if (firstId) {
      setReelAt(firstId);
    } else {
      toast("Drop a video first to launch Reels");
    }
  };

  const handleTapIn = (id: string, name: string) => {
    const alreadyTapped = setup.friends.includes(id);
    onSetupChange({
      ...setup,
      friends: toggleSelection(setup.friends, id),
      following: alreadyTapped
        ? toggleSelection(setup.following, id)
        : setup.following.includes(id)
          ? setup.following
          : [...setup.following, id],
    });
    toast.success(alreadyTapped ? `Removed ${name} from your circle` : `Tapped in with ${name} ✓`);
  };

  const openDmForUser = (user: User) => {
    setChats((prev) => {
      if (prev.some((c) => c.id === user.id)) return prev;
      const nextChat: Chat = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        online: true,
        roster: user.handle,
        statusText: "Active now",
        messages: [],
      };
      return [nextChat, ...prev];
    });
    setTab("messages");
    setOpenChat(user.id);
  };

  const handleJoinCrew = (crew: Crew) => {
    const alreadyJoined = joinedCrews.includes(crew.id);
    setJoinedCrews((prev) => toggleSelection(prev, crew.id));
    toast.success(alreadyJoined ? `Left ${crew.name}` : `Tapped into ${crew.name}`);
  };

  const handleJoinLiveRoom = () => {
    setLiveJoined(true);
    setLiveOpen(true);
    setLiveStreamMuted(false);
  };

  const handleLeaveLiveRoom = () => {
    setLiveJoined(false);
    setLiveOpen(false);
    setLiveMicMuted(true);
    setLiveHandRaised(false);
    setLiveOnStage(false);
    toast("Left Midnight Beat Lab");
  };

  const handleToggleHand = () => {
    if (liveOnStage) {
      setLiveOnStage(false);
      setLiveHandRaised(false);
      setLiveMicMuted(true);
      toast("Stepped back to Listeners");
      return;
    }
    const next = !liveHandRaised;
    setLiveHandRaised(next);
    if (next) {
      toast.success("Hand raised — @kitobeats invited you to stage");
      setTimeout(() => {
        setLiveOnStage(true);
        setLiveHandRaised(false);
      }, 900);
    }
  };

  const visibleSuggestions = SUGGESTED_PEOPLE.filter((p) => !dismissedIds.includes(p.user.id));

  const feed = getVisiblePosts(posts, "me", setup.friends);
  const publicPosts = posts.filter((p) => !p.audience || p.audience === "public");
  const myPosts = posts.filter((p) => p.user.id === "me");
  const activeProfilePosts = isMe ? myPosts : posts.filter((p) => p.user.id === me.id);

  const like = (id: string) =>
    setPosts((ps) =>
      ps.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
      ),
    );

  const sendTo = (chatId: string, post: Post) => {
    setChats((cs) =>
      cs.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: crypto.randomUUID(), from: "me", text: "", time: "now", read: true, post },
              ],
            }
          : c,
      ),
    );
    setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, shares: p.shares + 1 } : p)));
    toast.success(`Sent into ${chats.find((c) => c.id === chatId)?.name}`);
  };

  const save = (id: string) => {
    const target = posts.find((p) => p.id === id);
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)));
    if (target) {
      toast(target.saved ? "Removed from saved" : "Saved to your profile");
    }
  };

  const handleOpenEmbeddedPost = (post: Post) => {
    if (post.kind === "video" || post.mediaIsVideo || post.video) {
      openReels(post.id);
    } else {
      setTab("home");
      setOpenChat(null);
      toast(`Opened ${post.user.handle}'s drop in Home Feed`);
    }
  };

  const commentPost = posts.find((p) => p.id === commentsFor);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl justify-center gap-8 bg-[#0A0A0C] text-foreground lg:px-6">
      <audio ref={liveAudioRef} src={LIVE_ROOM.streamUrl} loop preload="none" />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 border-r border-[#222228] py-6 pr-4 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-3">
          <LogoMark className="h-9 w-9" />
          <span className="text-2xl font-bold tracking-tight">
            tumeni<span className="text-[#FFB800]">.</span>
          </span>
        </div>
        {(
          [
            ["home", Home, "Home"],
            ["explore", Radio, "Radar"],
            ["messages", MessageCircle, "Crew Chat"],
            ["profile", UserIcon, "Profile"],
          ] as const
        ).map(([t, I, l]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setOpenChat(null);
            }}
            className={`flex min-h-[44px] items-center gap-4 rounded-2xl px-3 py-3 text-base transition hover:bg-[#141418] ${
              tab === t ? "bg-[#141418] font-semibold text-[#FFB800]" : "text-foreground"
            }`}
          >
            <I className="h-5 w-5" />
            <span>{l}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => openReels()}
          className="flex min-h-[44px] items-center gap-4 rounded-2xl px-3 py-3 text-base text-foreground transition hover:bg-[#141418]"
        >
          <Clapperboard className="h-5 w-5 text-[#FFB800]" />
          <span>Reels</span>
        </button>
        <button
          type="button"
          onClick={handleJoinLiveRoom}
          className="flex min-h-[44px] items-center justify-between rounded-2xl px-3 py-3 text-base text-foreground transition hover:bg-[#141418]"
        >
          <span className="flex items-center gap-4">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
            <span>Live Room</span>
          </span>
          <span className="text-xs font-semibold tabular-nums text-[#FFB800]">
            {liveListenerCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setCreatingKind("video")}
          className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full bg-[#FFB800] font-semibold text-[#0A0A0C] glow transition hover:brightness-110"
        >
          <Plus className="h-5 w-5" />
          <span>Create Drop</span>
        </button>
        <button
          type="button"
          onClick={() => setSwitcher(true)}
          className="mt-auto flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition hover:border-[#222228] hover:bg-[#141418]"
        >
          <Avatar src={me.avatar} name={me.name} handle={me.handle} size={40} />
          <div className="min-w-0 text-left text-sm">
            <p className="truncate font-medium">{me.name}</p>
            <p className="truncate text-xs text-muted-foreground">{me.handle}</p>
          </div>
        </button>
      </aside>

      {/* Main Column */}
      <main
        className={`relative min-h-dvh w-full min-w-0 max-w-xl lg:pb-12 ${
          liveJoined && !liveOpen ? "pb-40" : "pb-24"
        }`}
      >
        {tab === "home" && (
          <>
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#222228] bg-[#0A0A0C]/90 px-4 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <LogoMark className="h-8 w-8" />
                <span className="text-xl font-bold tracking-tight">
                  tumeni<span className="text-[#FFB800]">.</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Watch reels"
                  onClick={() => openReels()}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-[#141418] hover:text-[#FFB800]"
                >
                  <Clapperboard className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => {
                    setNotif(false);
                    toast("Nala Gold liked your drop");
                  }}
                  className="relative flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-[#141418]"
                >
                  <Bell className="h-6 w-6" />
                  {notif && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FFB800]" />
                  )}
                </button>
              </div>
            </header>

            <LiveRoomBanner
              joined={liveJoined}
              listenerCount={liveListenerCount}
              onOpen={handleJoinLiveRoom}
            />

            <div className="border-b border-[#222228] bg-[#141418] sm:mx-4 sm:mt-4 sm:rounded-3xl sm:border">
              <StoriesBar me={myUser} />
            </div>

            <ComposerBox me={myUser} onOpenCreate={(k) => setCreatingKind(k)} />

            <div className="sm:space-y-4 sm:px-4 sm:pt-4">
              {feed.map((p, idx) => (
                <div key={p.id} className="space-y-4">
                  <PostCard
                    post={p}
                    onLike={() => like(p.id)}
                    onComment={() => setCommentsFor(p.id)}
                    onShare={() => setShareFor(p)}
                    onSave={() => save(p.id)}
                    onOpen={() => openReels(p.id)}
                  />
                  {idx === 2 && feed.length > 3 && (
                    <CircleRadarCarousel
                      suggestions={visibleSuggestions}
                      tappedIds={tappedIds}
                      onTapIn={handleTapIn}
                      onSendDm={openDmForUser}
                      onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
                      onSeeAll={() => {
                        setRadarFilter("suggested");
                        setTab("explore");
                      }}
                    />
                  )}
                </div>
              ))}
              {feed.length > 0 && feed.length <= 3 && visibleSuggestions.length > 0 && (
                <CircleRadarCarousel
                  suggestions={visibleSuggestions}
                  tappedIds={tappedIds}
                  onTapIn={handleTapIn}
                  onSendDm={openDmForUser}
                  onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
                  onSeeAll={() => {
                    setRadarFilter("suggested");
                    setTab("explore");
                  }}
                />
              )}
              {feed.length === 0 && (
                <div className="rounded-3xl border border-[#222228] bg-[#141418] px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    Your feed is quiet. Share your first drop above.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "explore" && (
          <CircleRadarHub
            activeFilter={radarFilter}
            setActiveFilter={setRadarFilter}
            posts={publicPosts}
            tappedIds={tappedIds}
            joinedCrews={joinedCrews}
            onTapIn={handleTapIn}
            onSendDm={openDmForUser}
            onJoinCrew={handleJoinCrew}
            onOpenCrewChat={() => {
              setTab("messages");
              setOpenChat("crew");
            }}
            onOpenPost={handleOpenEmbeddedPost}
          />
        )}

        {tab === "messages" &&
          (openChat ? (
            <CrewChatRoom
              chat={chats.find((c) => c.id === openChat) ?? chats[0]!}
              onBack={() => setOpenChat(null)}
              onSendMessage={({ text, voiceNote, media }) => {
                const targetId = openChat;
                setChats((cs) =>
                  cs.map((c) =>
                    c.id === targetId
                      ? {
                          ...c,
                          messages: [
                            ...c.messages,
                            {
                              id: crypto.randomUUID(),
                              from: "me",
                              text: text ?? "",
                              time: "now",
                              read: true,
                              voiceNote,
                              media,
                            },
                          ],
                        }
                      : c,
                  ),
                );
                if (text) {
                  setTimeout(
                    () =>
                      setChats((cs) =>
                        cs.map((c) =>
                          c.id === targetId
                            ? {
                                ...c,
                                messages: [
                                  ...c.messages,
                                  {
                                    id: crypto.randomUUID(),
                                    from: c.group ? "zuri" : c.id,
                                    text:
                                      [
                                        "facts 🔥",
                                        "say less 🎧",
                                        "pull up!",
                                        "locked in 👑",
                                        "bet 👀",
                                      ][Math.floor(Math.random() * 5)] ?? "🔥",
                                    time: "now",
                                  },
                                ],
                              }
                            : c,
                        ),
                      ),
                    1100,
                  );
                }
              }}
              onReact={(messageId, emoji) => {
                setChats((cs) =>
                  cs.map((c) =>
                    c.id === openChat
                      ? {
                          ...c,
                          messages: c.messages.map((m) => {
                            if (m.id !== messageId) return m;
                            const existing = m.reactions ?? [];
                            const next = existing.includes(emoji)
                              ? existing.filter((x) => x !== emoji)
                              : [...existing, emoji];
                            return { ...m, reactions: next };
                          }),
                        }
                      : c,
                  ),
                );
              }}
              onUpdateChat={(patch) => {
                setChats((cs) => cs.map((c) => (c.id === openChat ? { ...c, ...patch } : c)));
              }}
              onOpenPost={handleOpenEmbeddedPost}
            />
          ) : (
            <MessagesList chats={chats} onOpen={setOpenChat} />
          ))}

        {tab === "profile" && (
          <Profile
            me={me}
            bio={isMe ? setup.bio : "Studio sessions & new sounds"}
            interests={isMe ? setup.interests : []}
            account={account}
            myPosts={activeProfilePosts}
            saved={posts.filter((p) => p.saved)}
            followersCount={
              isMe ? 0 : (SUGGESTED_PEOPLE.find((p) => p.user.id === me.id)?.followers ?? 0)
            }
            followingCount={isMe ? setup.following.length : 0}
            editable={isMe}
            onEdit={(v) => onSetupChange({ ...setup, ...v })}
            onOpen={(id) => openReels(id)}
            onCreateDrop={() => setCreatingKind("video")}
            onSwitch={() => setSwitcher(true)}
            onLogout={onLogout}
          />
        )}

        {/* Bottom glass nav */}
        {!(tab === "messages" && openChat) && (
          <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-[#222228] bg-[#141418]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
            {(
              [
                ["home", Home, "Home"],
                ["explore", Radio, "Radar"],
              ] as const
            ).map(([t, I, label]) => (
              <NavBtn key={t} active={tab === t} onClick={() => setTab(t)} label={label}>
                <I className="h-6 w-6" />
              </NavBtn>
            ))}
            <button
              type="button"
              aria-label="Create drop"
              onClick={() => setCreatingKind("video")}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#FFB800] bg-[#0A0A0C] text-[#FFB800] glow transition active:scale-90"
            >
              <Plus className="h-6 w-6" />
            </button>
            {(
              [
                ["messages", MessageCircle, "Messages"],
                ["profile", UserIcon, "Profile"],
              ] as const
            ).map(([t, I, label]) => (
              <NavBtn
                key={t}
                active={tab === t}
                onClick={() => {
                  setTab(t);
                  setOpenChat(null);
                }}
                label={label}
              >
                <I className="h-6 w-6" />
              </NavBtn>
            ))}
          </nav>
        )}
      </main>

      {/* Desktop right column */}
      <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 space-y-5 py-6 xl:block">
        <div className="rounded-3xl border border-[#222228] bg-[#141418] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Circle Radar</h3>
            <button
              type="button"
              onClick={() => {
                setRadarFilter("suggested");
                setTab("explore");
              }}
              className="text-xs font-medium text-[#FFB800] hover:underline"
            >
              See all
            </button>
          </div>
          <div className="space-y-3">
            {SUGGESTED_PEOPLE.slice(0, 4).map(({ user, vibeTag }) => (
              <RadarSidebarRow
                key={user.id}
                u={user}
                vibeTag={vibeTag}
                tapped={tappedIds.includes(user.id)}
                onTapIn={() => handleTapIn(user.id, user.name)}
                onSendDm={() => openDmForUser(user)}
              />
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-[#222228] bg-[#141418] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Trending crews</h3>
            <button
              type="button"
              onClick={() => {
                setRadarFilter("crews");
                setTab("explore");
              }}
              className="text-xs font-medium text-[#FFB800] hover:underline"
            >
              Explore
            </button>
          </div>
          <div className="space-y-2.5">
            {CREWS.slice(0, 3).map((crew) => {
              const joined = joinedCrews.includes(crew.id);
              return (
                <div
                  key={crew.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{crew.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {fmt(crew.members + (joined ? 1 : 0))} members
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleJoinCrew(crew)}
                    className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition ${
                      joined
                        ? "border border-[#222228] bg-[#141418] text-[#FFB800]"
                        : "bg-[#FFB800] text-[#0A0A0C] hover:brightness-110"
                    }`}
                  >
                    {joined ? "Tapped In" : "Tap In"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {reelAt && (
        <Reels
          posts={reelPosts.length > 0 ? reelPosts : posts}
          startId={reelAt}
          onClose={() => setReelAt(null)}
          onLike={like}
          onComment={setCommentsFor}
          onShare={setShareFor}
          onSave={save}
        />
      )}

      {liveJoined && liveOpen && (
        <LiveVibeRoomSheet
          me={myUser}
          listenerCount={liveListenerCount}
          streamMuted={liveStreamMuted}
          micMuted={liveMicMuted}
          handRaised={liveHandRaised}
          onStage={liveOnStage}
          onToggleStreamMute={() => setLiveStreamMuted((m) => !m)}
          onToggleMic={() => {
            if (!liveOnStage) {
              toast("Raise your hand first to step onto the Speaker Stage");
              return;
            }
            setLiveMicMuted((m) => !m);
          }}
          onToggleHand={handleToggleHand}
          onMinimize={() => setLiveOpen(false)}
          onLeave={handleLeaveLiveRoom}
        />
      )}

      {liveJoined && !liveOpen && (
        <LiveMiniPlayer
          listenerCount={liveListenerCount}
          streamMuted={liveStreamMuted}
          onToggleMute={() => setLiveStreamMuted((m) => !m)}
          onExpand={() => setLiveOpen(true)}
          onLeave={handleLeaveLiveRoom}
        />
      )}

      <Sheet open={!!shareFor} onClose={() => setShareFor(null)} title="Send Drop">
        <div className="space-y-2">
          {chats.map((c) => (
            <SendRow key={c.id} chat={c} onSend={() => shareFor && sendTo(c.id, shareFor)} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(location.href).catch(() => {});
            toast.success("Link copied");
          }}
          className="mt-4 h-12 w-full rounded-full border border-[#222228] bg-[#0A0A0C] text-sm font-medium transition hover:border-[#FFB800]"
        >
          Copy link
        </button>
      </Sheet>

      <Sheet open={!!commentPost} onClose={() => setCommentsFor(null)} title="Comments">
        {commentPost && (
          <Comments
            post={commentPost}
            me={me}
            onAdd={(text) =>
              setPosts((ps) =>
                ps.map((p) =>
                  p.id === commentPost.id
                    ? {
                        ...p,
                        comments: [...p.comments, { id: crypto.randomUUID(), user: me, text }],
                      }
                    : p,
                ),
              )
            }
          />
        )}
      </Sheet>

      <Sheet open={switcher} onClose={() => setSwitcher(false)} title="Switch profile">
        <div className="space-y-2">
          {profiles.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProfileIdx(i);
                setSwitcher(false);
                toast(`Switched to ${p.handle}`);
              }}
              className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3 transition hover:border-[#FFB800]/60"
            >
              <Avatar src={p.avatar} name={p.name} handle={p.handle} />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-foreground">{p.name}</p>
                <p className="truncate text-xs text-muted-foreground">{p.handle}</p>
              </div>
              {i === profileIdx && <Check className="h-5 w-5 text-[#FFB800]" />}
            </button>
          ))}
        </div>
      </Sheet>

      {creatingKind !== null && (
        <CreatePost
          initialKind={creatingKind}
          me={myUser}
          onClose={() => setCreatingKind(null)}
          onPublish={({ kind, audience, caption, tag, track, media, isVideo }) => {
            const post: Post = {
              id: crypto.randomUUID(),
              user: myUser,
              lane: "circle",
              kind,
              audience,
              time: "just now",
              caption,
              tag,
              likes: 0,
              shares: 0,
              comments: [],
              media: kind === "text" || kind === "audio" ? undefined : media,
              video: kind === "video" ? media : undefined,
              audio: kind === "audio" ? media : undefined,
              mediaIsVideo: isVideo,
              views: kind === "video" ? 1 : undefined,
              track: track ?? (kind === "audio" ? `${setup.name} — new sound` : undefined),
              duration: kind === "audio" ? "0:30" : undefined,
            };
            setPosts((ps) => [post, ...ps]);
            setTab("home");
            setCreatingKind(null);
            window.scrollTo({ top: 0 });
            const audienceLabel = POST_AUDIENCES.find((a) => a.id === audience)?.label ?? "Public";
            toast.success(
              kind === "video"
                ? `Video dropped to Feed & Reels (${audienceLabel})`
                : `Published (${audienceLabel})`,
            );
          }}
        />
      )}
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 transition ${
        active ? "text-[#FFB800]" : "text-foreground"
      }`}
    >
      {children}
      <span className={`h-0.5 w-5 rounded-full ${active ? "bg-[#FFB800]" : "bg-transparent"}`} />
    </button>
  );
}

function SendRow({ chat, onSend }: { chat: Chat; onSend: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3">
      <Avatar src={chat.avatar} name={chat.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{chat.name}</p>
        <p className="text-xs text-muted-foreground">
          {chat.group ? "Crew chat" : "Direct message"}
        </p>
      </div>
      <button
        type="button"
        disabled={sent}
        onClick={() => {
          onSend();
          setSent(true);
        }}
        className={`min-h-[36px] rounded-full px-4 text-xs font-semibold transition ${
          sent
            ? "border border-[#222228] bg-[#141418] text-muted-foreground"
            : "bg-[#FFB800] text-[#0A0A0C] hover:brightness-110"
        }`}
      >
        {sent ? "Sent" : "Send"}
      </button>
    </div>
  );
}

function Comments({ post, me, onAdd }: { post: Post; me: User; onAdd: (t: string) => void }) {
  const [text, setText] = useState("");
  return (
    <>
      <div className="max-h-72 space-y-3 overflow-y-auto">
        {post.comments.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Be the first to comment on this drop.
          </p>
        )}
        {post.comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar src={c.user.avatar} name={c.user.name} handle={c.user.handle} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{c.user.name}</p>
              <p className="text-sm text-muted-foreground">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form
        className="mt-4 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) {
            onAdd(text.trim());
            setText("");
          }
        }}
      >
        <Avatar src={me.avatar} name={me.name} handle={me.handle} size={40} />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          className="min-h-[44px] flex-1 rounded-full border border-[#222228] bg-[#0A0A0C] px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#FFB800]"
        />
        <button
          type="submit"
          aria-label="Post comment"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C]"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}

function RadarSidebarRow({
  u,
  vibeTag,
  tapped,
  onTapIn,
  onSendDm,
}: {
  u: User;
  vibeTag: string;
  tapped: boolean;
  onTapIn: () => void;
  onSendDm: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3">
      <Avatar src={u.avatar} name={u.name} handle={u.handle} glowRing />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
          {u.verified && (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {u.handle} · <span className="text-[#FFB800]">{vibeTag}</span>
        </p>
      </div>
      <button
        type="button"
        aria-label={`Send DM to ${u.name}`}
        onClick={onSendDm}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#222228] bg-[#141418] text-muted-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onTapIn}
        className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition ${
          tapped
            ? "border border-[#FFB800]/50 bg-[#141418] text-[#FFB800]"
            : "bg-[#FFB800] text-[#0A0A0C] hover:brightness-110"
        }`}
      >
        {tapped ? "Tapped In ✓" : "Tap In"}
      </button>
    </div>
  );
}

function Profile({
  me,
  bio,
  interests,
  account,
  myPosts,
  saved,
  followersCount,
  followingCount,
  editable,
  onEdit,
  onOpen,
  onCreateDrop,
  onSwitch,
  onLogout,
}: {
  me: User;
  bio: string;
  interests: string[];
  account: string;
  myPosts: Post[];
  saved: Post[];
  followersCount: number;
  followingCount: number;
  editable: boolean;
  onEdit: (v: { name: string; handle: string; bio: string; avatar: string }) => void;
  onOpen: (id: string) => void;
  onCreateDrop: () => void;
  onSwitch: () => void;
  onLogout: () => void;
}) {
  const [tab, setTab] = useState<"drops" | "saved">("drops");
  const [filter, setFilter] = useState<"all" | "video" | "photo" | "audio">("all");
  const [editing, setEditing] = useState(false);

  const creatorFallbackGrid = editable
    ? []
    : GRID.map((item: GridItem, i: number) => ({
        id: `${item.id}-${i}`,
        src: item.src,
        kind: item.type as Kind,
        text: "",
        video: item.type === "video",
      }));

  const base =
    tab === "saved"
      ? saved.map((p) => ({
          id: p.id,
          src: p.video ?? p.media,
          kind: p.kind,
          text: p.caption,
          video: !!(p.video || p.mediaIsVideo),
        }))
      : [
          ...myPosts.map((p) => ({
            id: p.id,
            src: p.video ?? p.media,
            kind: p.kind,
            text: p.caption,
            video: !!(p.video || p.mediaIsVideo),
          })),
          ...creatorFallbackGrid,
        ];

  const items = base.filter((i) => filter === "all" || i.kind === filter);
  const totalLikes = myPosts.reduce((n, p) => n + p.likes, 0);
  const dropsCount = myPosts.length + creatorFallbackGrid.length;

  const stats = [
    { label: "Total Likes", value: fmt(totalLikes), I: Heart },
    { label: "Saved Drops", value: fmt(saved.length), I: Bookmark },
  ];

  const share = () => {
    void navigator.clipboard?.writeText(`${location.origin}/${me.handle}`).catch(() => {});
    toast.success("Profile link copied");
  };

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#222228] bg-[#0A0A0C]/90 px-4 backdrop-blur-xl">
        <button
          type="button"
          onClick={onSwitch}
          className="flex min-h-[44px] items-center gap-1.5 font-bold text-foreground"
        >
          <span>{me.handle}</span>
          <Repeat className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          type="button"
          aria-label="Log out"
          onClick={onLogout}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-[#141418] hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pt-5">
        <div className="flex items-center gap-5">
          <Avatar src={me.avatar} name={me.name} handle={me.handle} size={84} ring />
          <div className="grid flex-1 grid-cols-3 text-center">
            <div>
              <p className="text-lg font-bold tabular-nums text-foreground">{dropsCount}</p>
              <p className="text-xs text-muted-foreground">Drops</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {fmt(followersCount)}
              </p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums text-foreground">
                {fmt(followingCount)}
              </p>
              <p className="text-xs text-muted-foreground">Following</p>
            </div>
          </div>
        </div>

        <h1 className="mt-3 break-words text-lg font-bold text-foreground">{me.name}</h1>
        {editable && account.includes(":") && (
          <p className="text-xs text-muted-foreground">{account.split(":")[1]}</p>
        )}
        {bio && (
          <p className="mt-1.5 whitespace-pre-line break-words text-sm text-foreground">{bio}</p>
        )}
        {interests.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">{interests.join(" · ")}</p>
        )}

        <div className="mt-4 flex gap-2.5">
          {editable && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-[44px] flex-1 rounded-xl border border-[#222228] bg-[#141418] py-2 text-sm font-semibold text-foreground transition hover:border-[#FFB800]/60"
            >
              Edit profile
            </button>
          )}
          <button
            type="button"
            onClick={share}
            className="min-h-[44px] flex-1 rounded-xl border border-[#222228] bg-[#141418] py-2 text-sm font-semibold text-foreground transition hover:border-[#FFB800]/60"
          >
            Share profile
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map(({ label, value, I }) => (
            <div key={label} className="rounded-3xl border border-[#222228] bg-[#141418] p-4">
              <I className="h-5 w-5 text-[#FFB800]" />
              <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex border-b border-[#222228]">
        {(["drops", "saved"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-[44px] flex-1 border-b-2 py-3 text-sm font-semibold capitalize transition ${
              tab === t
                ? "border-[#FFB800] text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {(["all", "video", "photo", "audio"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-4 py-1 text-xs font-medium capitalize transition ${
              filter === f
                ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                : "border-[#222228] bg-[#141418] text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mx-4 mt-2 rounded-3xl border border-[#222228] bg-[#141418] px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {tab === "saved"
              ? "Save drops from the feed and they show up here."
              : "No drops yet. Share your first video, track, or thought."}
          </p>
          {tab === "drops" && editable && (
            <button
              type="button"
              onClick={onCreateDrop}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#FFB800] px-6 text-sm font-semibold text-[#0A0A0C] glow transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              <span>Create Drop</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => (it.video ? onOpen(it.id) : undefined)}
              className="relative aspect-[3/4] overflow-hidden bg-[#141418]"
            >
              {it.video && it.src ? (
                <video
                  src={it.src}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : it.src && it.kind !== "audio" ? (
                <img
                  src={it.src}
                  alt={it.text || "Drop"}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition hover:scale-105"
                />
              ) : it.kind === "audio" ? (
                <div className="flex h-full items-center justify-center bg-[#141418]">
                  <Waveform playing={false} bars={10} className="h-8" />
                </div>
              ) : (
                <p className="p-2.5 text-left text-xs text-foreground">{it.text}</p>
              )}
              <span className="absolute right-1.5 top-1.5">
                {it.kind === "video" ? (
                  <Play className="h-4 w-4 fill-foreground" />
                ) : it.kind === "audio" ? (
                  <AudioLines className="h-4 w-4 text-[#FFB800]" />
                ) : it.kind === "photo" ? (
                  <ImageIcon className="h-4 w-4" />
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <EditProfile
          me={me}
          bio={bio}
          onClose={() => setEditing(false)}
          onSave={(v) => {
            onEdit(v);
            setEditing(false);
            toast.success("Profile updated");
          }}
        />
      )}
    </div>
  );
}

function EditProfile({
  me,
  bio,
  onClose,
  onSave,
}: {
  me: User;
  bio: string;
  onClose: () => void;
  onSave: (v: { name: string; handle: string; bio: string; avatar: string }) => void;
}) {
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle.replace(/^@/, ""));
  const [text, setText] = useState(bio);
  const [pic, setPic] = useState(me.avatar);
  const [photoError, setPhotoError] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const err = profileError(name, handle);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C]/80 backdrop-blur sm:items-center"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!err)
            onSave({
              name: name.trim(),
              handle: `@${handle.replace(/^@/, "")}`,
              bio: text.trim(),
              avatar: pic,
            });
        }}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-[#222228] bg-[#141418] p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#222228]"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-bold text-foreground">Edit profile</h2>
          <button
            type="submit"
            disabled={!!err}
            className="min-h-[40px] px-2 font-semibold text-[#FFB800] disabled:opacity-40"
          >
            Save
          </button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Avatar src={pic} name={name} handle={handle} size={88} ring />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-[#FFB800] px-4 text-xs font-semibold text-[#0A0A0C] transition hover:brightness-110"
            >
              <Camera className="h-4 w-4" />
              <span>{pic ? "Change Photo" : "Upload Photo"}</span>
            </button>
            {pic && (
              <button
                type="button"
                onClick={() => setPic("")}
                className="min-h-[40px] rounded-full border border-[#222228] bg-[#0A0A0C] px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Use monogram
              </button>
            )}
          </div>
          <input
            ref={uploadRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
                setPhotoError("Choose an image smaller than 5 MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") setPic(reader.result);
                setPhotoError("");
              };
              reader.readAsDataURL(file);
            }}
          />
          {photoError && <p className="text-xs text-destructive">{photoError}</p>}
        </div>

        <label className="mt-5 block text-xs text-muted-foreground">
          Display name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="mt-1 w-full rounded-xl border border-[#222228] bg-[#0A0A0C] px-3 py-2.5 text-base text-foreground outline-none focus:border-[#FFB800]"
          />
        </label>
        <label className="mt-3 block text-xs text-muted-foreground">
          Handle
          <div className="mt-1 flex rounded-xl border border-[#222228] bg-[#0A0A0C] px-3 focus-within:border-[#FFB800]">
            <span className="py-2.5 text-muted-foreground">@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full bg-transparent py-2.5 text-base text-foreground outline-none"
            />
          </div>
        </label>
        <label className="mt-3 block text-xs text-muted-foreground">
          Bio
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={150}
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-[#222228] bg-[#0A0A0C] px-3 py-2.5 text-base text-foreground outline-none focus:border-[#FFB800]"
          />
          <span className="block text-right tabular-nums">{text.length}/150</span>
        </label>
        {err && <p className="mt-1 text-sm text-destructive">{err}</p>}
      </form>
    </div>
  );
}

function Reels({
  posts,
  startId,
  onClose,
  onLike,
  onComment,
  onShare,
  onSave,
}: {
  posts: Post[];
  startId: string;
  onClose: () => void;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (p: Post) => void;
  onSave: (id: string) => void;
}) {
  const [active, setActive] = useState(startId);
  const [muted, setMuted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    root.querySelector(`[data-id="${startId}"]`)?.scrollIntoView();
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset["id"] ?? "");
        }),
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-id]").forEach((el) => io.observe(el));
    document.body.style.overflow = "hidden";
    return () => {
      io.disconnect();
      document.body.style.overflow = "";
    };
  }, [startId]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C]">
      <div
        ref={box}
        className="no-scrollbar mx-auto h-dvh max-w-xl snap-y snap-mandatory overflow-y-scroll"
      >
        {posts.map((p) => (
          <Reel
            key={p.id}
            post={p}
            active={active === p.id}
            muted={muted}
            onLike={() => onLike(p.id)}
            onComment={() => onComment(p.id)}
            onShare={() => onShare(p)}
            onSave={() => onSave(p.id)}
          />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 mx-auto flex max-w-xl items-center justify-between p-4">
        <button
          type="button"
          aria-label="Close reels"
          onClick={onClose}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C]/65 backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="font-bold">
          Reels<span className="text-[#FFB800]">.</span>
        </span>
        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMuted(!muted)}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C]/65 backdrop-blur"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function Reel({
  post,
  active,
  muted,
  onLike,
  onComment,
  onShare,
  onSave,
}: {
  post: Post;
  active: boolean;
  muted: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && !paused) {
      void v.play().catch(() => {
        v.muted = true;
        void v.play().catch(() => {});
      });
    } else {
      v.pause();
    }
    if (!active) {
      v.currentTime = 0;
      setPaused(false);
    }
  }, [active, paused]);

  const tap = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (!post.liked) onLike();
      setBurst((b) => b + 1);
      setPaused(false);
    } else {
      setTimeout(() => {
        if (Date.now() - lastTap.current >= 280) setPaused((x) => !x);
      }, 300);
    }
    lastTap.current = now;
  };

  return (
    <section
      data-id={post.id}
      className="relative h-dvh w-full snap-start snap-always overflow-hidden bg-[#0A0A0C]"
    >
      {post.mediaIsVideo || post.video ? (
        <video
          ref={ref}
          src={post.video ?? post.media}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          onClick={tap}
          onTimeUpdate={(e) =>
            setProgress((e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100)
          }
          className="h-full w-full object-cover"
        />
      ) : post.media ? (
        <img
          src={post.media}
          alt={post.caption}
          onClick={tap}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          onClick={tap}
          className="flex h-full items-center justify-center bg-[#141418] p-8 text-center text-2xl font-semibold"
        >
          {post.caption}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-transparent to-[#0A0A0C]/35" />
      {paused && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0A0A0C]/65 backdrop-blur">
          <Play className="ml-1 h-9 w-9 fill-foreground" />
        </div>
      )}
      {burst > 0 && (
        <Heart
          key={burst}
          className="animate-burst pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 fill-[#FFB800] text-[#FFB800]"
        />
      )}
      <div className="absolute bottom-24 left-4 right-20 space-y-2 lg:bottom-10">
        <div className="flex items-center gap-2">
          <Avatar
            src={post.user.avatar}
            name={post.user.name}
            handle={post.user.handle}
            size={36}
            ring
          />
          <span className="font-semibold">{post.user.handle}</span>
          {post.user.verified && <BadgeCheck className="h-4 w-4 fill-[#FFB800] text-[#0A0A0C]" />}
        </div>
        <p className="text-sm">
          {post.caption} {post.tag && <span className="text-[#FFB800]">{post.tag}</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Music className="h-4 w-4 text-[#FFB800]" />
          <span className="truncate">{post.track ?? `Original Audio — ${post.user.handle}`}</span>
        </div>
      </div>
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5 lg:bottom-10">
        <button
          type="button"
          aria-label="Like"
          onClick={onLike}
          className="flex flex-col items-center gap-1 text-xs font-medium tabular-nums active:scale-90"
        >
          <Heart className={`h-8 w-8 ${post.liked ? "fill-[#FFB800] text-[#FFB800]" : ""}`} />
          {fmt(post.likes)}
        </button>
        <button
          type="button"
          aria-label="Comments"
          onClick={onComment}
          className="flex flex-col items-center gap-1 text-xs font-medium tabular-nums active:scale-90"
        >
          <MessageCircle className="h-8 w-8" />
          {fmt(post.comments.length)}
        </button>
        <button
          type="button"
          aria-label="Send in"
          onClick={onShare}
          className="flex flex-col items-center gap-1 text-xs font-medium tabular-nums active:scale-90"
        >
          <Send className="h-8 w-8" />
          {fmt(post.shares)}
        </button>
        <button
          type="button"
          aria-label={post.saved ? "Unsave" : "Save"}
          onClick={onSave}
          className="active:scale-90"
        >
          <Bookmark className={`h-7 w-7 ${post.saved ? "fill-[#FFB800] text-[#FFB800]" : ""}`} />
        </button>
        <div
          className={`h-10 w-10 overflow-hidden rounded-full border-4 border-[#141418] ${
            active && !paused ? "animate-spin [animation-duration:4s]" : ""
          }`}
        >
          <Avatar
            src={post.user.avatar}
            name={post.user.name}
            handle={post.user.handle}
            size={32}
          />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/20">
        <div className="h-full bg-[#FFB800]" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
