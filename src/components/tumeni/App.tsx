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
  Image as ImageIcon,
  AudioLines,
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
  Camera,
  ThumbsUp,
  Smile,
  Disc3,
  Loader2,
  MapPin,
} from "lucide-react";
import { LogoMark } from "./Logo";
import {
  FEED_CATEGORIES,
  SEED_POSTS,
  SEED_CHATS,
  PROFILES,
  GRID,
  SUGGESTED_PEOPLE,
  FRIEND_REQUESTS,
  CREWS,
  POST_AUDIENCES,
  LIVE_STREAMS,
  getVisiblePosts,
  fmt,
  type Audience,
  type Comment,
  type Kind,
  type Lane,
  type Post,
  type Chat,
  type User,
  type GridItem,
  type Crew,
  type SuggestedPerson,
} from "./data";
import {
  POPULAR_CITIES,
  compressAvatarFile,
  normalizeCity,
  toggleSelection,
  profileError,
  type SetupProfile,
} from "./onboarding";
import {
  fetchCloudPosts,
  listDirectoryProfiles,
  publishCloudPost,
  toggleCloudFollow,
} from "@/lib/tumeni-db";
import { StoriesBar } from "./Stories";
import { Avatar, Waveform } from "./SharedUI";
import { CircleRadarCarousel, CircleRadarHub, type RadarFilter } from "./CircleRadar";
import { MessagesList, CrewChatRoom } from "./CrewChat";
import { LiveMiniPlayer, LiveVibeRoomSheet } from "./LiveVibeRoom";
import { StudioCameraModal, VideoStageDecorations, type StudioLaunchMode } from "./StudioCamera";
import {
  claimMediaFocus,
  getActiveMediaFocus,
  releaseMediaFocus,
  subscribeMediaFocus,
} from "./mediaCoordinator";
import {
  loadAllAccounts,
  loadPersistedUserPosts,
  saveUserPosts,
  loadAccountEngagement,
  saveAccountEngagement,
  toggleAccountFollow,
  type AccountRecord,
} from "./storage";

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

function FacebookActions({
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
  return (
    <div className="mt-3 grid grid-cols-4 gap-1 border-t border-[#222228] px-2 pt-2 sm:px-0">
      <button
        type="button"
        onClick={onLike}
        aria-label="Like"
        className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold tabular-nums transition active:scale-95 ${
          post.liked
            ? "bg-[#FFB800]/10 text-[#FFB800]"
            : "text-muted-foreground hover:bg-[#0A0A0C] hover:text-foreground"
        }`}
      >
        <ThumbsUp
          className={`h-4 w-4 shrink-0 ${post.liked ? "fill-[#FFB800] text-[#FFB800]" : ""}`}
        />
        <span>{fmt(post.likes)}</span>
      </button>

      <button
        type="button"
        onClick={onComment}
        aria-label="Comments"
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold tabular-nums text-muted-foreground transition hover:bg-[#0A0A0C] hover:text-foreground active:scale-95"
      >
        <MessageCircle className="h-4 w-4 shrink-0" />
        <span>{fmt(post.comments.length)}</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        aria-label="Share to crew"
        className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold tabular-nums text-muted-foreground transition hover:bg-[#0A0A0C] hover:text-foreground active:scale-95"
      >
        <Send className="h-4 w-4 shrink-0" />
        <span>{fmt(post.shares)}</span>
      </button>

      <button
        type="button"
        onClick={onSave}
        aria-label={post.saved ? "Remove from saved" : "Save drop"}
        className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition active:scale-95 ${
          post.saved
            ? "text-[#FFB800]"
            : "text-muted-foreground hover:bg-[#0A0A0C] hover:text-foreground"
        }`}
      >
        <Bookmark className={`h-4 w-4 shrink-0 ${post.saved ? "fill-[#FFB800]" : ""}`} />
        <span>{post.saved ? "Saved" : "Save"}</span>
      </button>
    </div>
  );
}

function PostCard({
  post,
  muted,
  onToggleMute,
  onForceMute,
  pauseExternal,
  onLike,
  onComment,
  onShare,
  onSave,
  onOpen,
}: {
  post: Post;
  muted: boolean;
  onToggleMute: () => void;
  onForceMute: () => void;
  pauseExternal: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onOpen?: (() => void) | undefined;
}) {
  const playerId = `feed-${post.id}`;
  const [playing, setPlaying] = useState(false);
  const [nearView, setNearView] = useState(false);
  const [inFocus, setInFocus] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const mediaBoxRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const soundAudioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const prevInFocusRef = useRef(false);
  const prevPauseExternalRef = useRef(pauseExternal);
  const prevNearViewRef = useRef(false);
  const onForceMuteRef = useRef(onForceMute);
  onForceMuteRef.current = onForceMute;

  const videoSrc = post.video ?? post.media;
  const shouldMountVideo = nearView || playing;

  // Stop immediately whenever another video, reel, story, live room, or voice note claims focus
  useEffect(() => {
    return subscribeMediaFocus((activeId) => {
      if (activeId !== playerId) {
        setPlaying(false);
      }
    });
  }, [playerId]);

  // Mount video/audio decoders only when card is near viewport (prevents browser decoder starvation)
  useEffect(() => {
    const el = cardRef.current;
    if (!el || (post.kind !== "video" && post.kind !== "audio")) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setNearView(entry.isIntersecting);
      },
      { rootMargin: "650px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [post.kind]);

  // Auto-play active video card smoothly when centered in viewport, and auto-pause when scrolled past
  useEffect(() => {
    const el = mediaBoxRef.current;
    if (!el || post.kind !== "video") return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.6;
        setInFocus(visible);
        if (!visible) {
          userPausedRef.current = false;
        }
      },
      { threshold: [0, 0.3, 0.6, 0.85] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [post.kind]);

  useEffect(() => {
    const wasInFocus = prevInFocusRef.current;
    const wasPausedExternal = prevPauseExternalRef.current;
    const wasNearView = prevNearViewRef.current;
    prevInFocusRef.current = inFocus;
    prevPauseExternalRef.current = pauseExternal;
    prevNearViewRef.current = nearView;

    if (pauseExternal) {
      setPlaying(false);
      releaseMediaFocus(playerId);
      return;
    }

    if (post.kind === "video") {
      if (inFocus && (!wasInFocus || wasPausedExternal) && !userPausedRef.current) {
        claimMediaFocus(playerId);
        setPlaying(true);
      } else if ((!inFocus && wasInFocus) || (!nearView && wasNearView)) {
        setPlaying(false);
        releaseMediaFocus(playerId);
      }
    } else if (!nearView && wasNearView) {
      setPlaying(false);
      releaseMediaFocus(playerId);
    }
  }, [inFocus, nearView, pauseExternal, post.kind, playerId]);

  const togglePlayManual = () => {
    setPlaying((prev) => {
      const next = !prev;
      if (next) {
        userPausedRef.current = false;
        claimMediaFocus(playerId);
      } else {
        userPausedRef.current = true;
        releaseMediaFocus(playerId);
      }
      return next;
    });
  };

  // Sync play/pause lifecycle cleanly without restarting on mute toggles
  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      if (playing) {
        if (a.paused) void a.play().catch(() => {});
      } else if (!a.paused) {
        a.pause();
      }
    }
  }, [playing]);

  useEffect(() => {
    const sa = soundAudioRef.current;
    if (!sa) return;
    if (playing && !muted) {
      if (sa.paused) void sa.play().catch(() => {});
    } else if (!sa.paused) {
      sa.pause();
    }
  }, [playing, muted, post.soundUrl, shouldMountVideo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      if (v.paused) {
        void v.play().catch(() => {
          v.muted = true;
          onForceMuteRef.current();
          void v.play().catch(() => {});
        });
      }
    } else {
      if (!v.paused) v.pause();
      setBuffering(false);
    }
  }, [playing, shouldMountVideo]);

  // Update mute & playback speed independently so toggling mute never kicks/stutters video
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.playbackRate = post.playbackSpeed ?? 1;
      v.muted = post.soundUrl || post.soundYoutubeId ? true : muted;
    }
    const sa = soundAudioRef.current;
    if (sa) {
      sa.muted = muted;
    }
  }, [muted, post.soundUrl, post.soundYoutubeId, post.playbackSpeed, shouldMountVideo]);

  useEffect(() => {
    return () => {
      releaseMediaFocus(playerId);
    };
  }, [playerId]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!playing || post.kind !== "audio" || post.audio) return;
    const t = setInterval(() => setElapsed((e) => (e >= 42 ? 0 : e + 1)), 1000);
    return () => clearInterval(t);
  }, [playing, post.kind, post.audio]);

  return (
    <article
      ref={cardRef}
      className="animate-rise border-b border-[#222228] bg-[#141418] py-3 sm:rounded-3xl sm:border sm:p-4"
    >
      <header className="flex items-center gap-3 px-4 py-1.5 sm:px-0">
        <Avatar src={post.user.avatar} name={post.user.name} handle={post.user.handle} ring />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 font-medium text-foreground">
            <span className="truncate">{post.user.name}</span>
            {post.user.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
            )}
            {post.mood && (
              <span className="text-xs font-normal text-muted-foreground">
                is feeling <span className="font-medium text-[#FFB800]">{post.mood}</span>
              </span>
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

      {/* Clean Caption ABOVE Media for all post formats */}
      {post.kind !== "text" && (post.caption || post.tag) && (
        <p className="mt-2 px-4 text-sm leading-relaxed text-foreground sm:px-0">
          {post.caption}{" "}
          {post.tag && <span className="font-medium text-[#FFB800]">{post.tag}</span>}
        </p>
      )}

      {post.kind === "video" && (
        <div
          ref={mediaBoxRef}
          className="relative mt-3 overflow-hidden bg-[#0A0A0C] sm:rounded-2xl sm:border sm:border-[#222228]"
        >
          {shouldMountVideo && post.soundUrl && (
            <audio
              ref={soundAudioRef}
              src={post.soundUrl}
              loop
              preload={playing || inFocus ? "auto" : "metadata"}
            />
          )}
          {!post.soundUrl && post.soundYoutubeId && playing && !muted && (
            <iframe
              key={post.soundYoutubeId}
              title={`Track ${post.track ?? "YouTube Music"}`}
              src={`https://www.youtube-nocookie.com/embed/${post.soundYoutubeId}?autoplay=1&loop=1&playlist=${post.soundYoutubeId}&controls=0`}
              allow="autoplay; encrypted-media"
              className="pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0"
            />
          )}
          {videoSrc ? (
            shouldMountVideo ? (
              <video
                ref={videoRef}
                src={videoSrc}
                style={post.filterCss ? { filter: post.filterCss } : undefined}
                className={`aspect-[4/5] w-full bg-[#0A0A0C] object-cover ${
                  post.filterCss ? "" : (post.filterClass ?? "")
                }`}
                loop
                muted={muted || !!post.soundUrl || !!post.soundYoutubeId}
                playsInline
                preload={playing || inFocus ? "auto" : "metadata"}
                onWaiting={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                onCanPlay={() => setBuffering(false)}
                onClick={togglePlayManual}
              />
            ) : (
              <div
                onClick={togglePlayManual}
                className="flex aspect-[4/5] w-full items-center justify-center bg-[#0A0A0C]"
              >
                <Play className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center bg-[#0A0A0C] text-sm text-muted-foreground">
              Video unavailable
            </div>
          )}
          <VideoStageDecorations
            effectId={post.effectId}
            overlays={post.overlays}
            stickers={post.stickers}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/85 via-transparent to-[#0A0A0C]/25" />

          {playing && buffering && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0A0A0C]/70 p-3 backdrop-blur">
              <Loader2 className="h-6 w-6 animate-spin text-[#FFB800]" />
            </div>
          )}

          <button
            type="button"
            aria-label={playing ? "Pause video" : "Play video"}
            onClick={togglePlayManual}
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
            <span className="flex items-center gap-1 rounded-full bg-[#0A0A0C]/75 px-2.5 py-1 text-xs tabular-nums backdrop-blur">
              <Eye className="h-3.5 w-3.5 text-[#FFB800]" /> {fmt(post.views ?? 0)}
            </span>
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <button
              type="button"
              aria-label={muted ? "Unmute video" : "Mute video"}
              onClick={onToggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C]/75 text-foreground backdrop-blur transition hover:text-[#FFB800]"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            {onOpen && (
              <button
                type="button"
                aria-label="Open in Reels"
                onClick={onOpen}
                className="flex h-9 items-center gap-1 rounded-full bg-[#0A0A0C]/75 px-3 text-xs font-medium text-foreground backdrop-blur transition hover:text-[#FFB800]"
              >
                <Clapperboard className="h-3.5 w-3.5 text-[#FFB800]" />
                <span>Reels</span>
              </button>
            )}
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#0A0A0C]/65 px-3 py-1.5 backdrop-blur">
              <Music className="h-3.5 w-3.5 shrink-0 text-[#FFB800]" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <div
                  className={`flex w-max whitespace-nowrap text-xs font-medium text-foreground/95 ${
                    playing ? "animate-marquee" : ""
                  }`}
                >
                  <span className="pr-8">
                    🎵 {post.track ?? `Original Audio — ${post.user.handle}`}
                  </span>
                  {playing && (
                    <span aria-hidden="true" className="pr-8">
                      🎵 {post.track ?? `Original Audio — ${post.user.handle}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#222228] bg-[#141418] text-[#FFB800] shadow-md ${
                playing ? "animate-spin [animation-duration:4s]" : ""
              }`}
            >
              <Disc3 className="h-5 w-5" />
            </div>
          </div>

          {playing && (
            <div className="animate-progress absolute bottom-0 left-0 h-1 bg-[#FFB800]" />
          )}
        </div>
      )}

      {post.kind === "photo" && post.media && (
        <div className="mt-3 overflow-hidden bg-[#0A0A0C] sm:rounded-2xl sm:border sm:border-[#222228]">
          <img
            src={post.media}
            alt={post.caption || "Photo drop"}
            referrerPolicy="no-referrer"
            style={post.filterCss ? { filter: post.filterCss } : undefined}
            className={`aspect-[4/5] w-full bg-[#0A0A0C] object-cover ${
              post.filterCss ? "" : (post.filterClass ?? "")
            }`}
          />
        </div>
      )}

      {post.kind === "text" && (
        <div className="mt-3 px-4 sm:px-0">
          <div className="rounded-2xl border border-[#222228] bg-[#0A0A0C] p-5">
            <p className="text-lg font-medium leading-relaxed text-foreground">{post.caption}</p>
            {post.tag && <p className="mt-3 text-xs font-medium text-[#FFB800]">{post.tag}</p>}
          </div>
        </div>
      )}

      {post.kind === "audio" && (
        <div className="mt-3 px-4 sm:px-0">
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
              onClick={togglePlayManual}
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
      )}

      {/* Facebook-Style Bottom Action Bar */}
      <FacebookActions
        post={post}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onSave={onSave}
      />
    </article>
  );
}

function ComposerBox({
  me,
  onOpenStudio,
  onGoLive,
}: {
  me: User;
  onOpenStudio: (mode: StudioLaunchMode) => void;
  onGoLive: () => void;
}) {
  const firstName = me.name.split(" ")[0] || me.name;

  return (
    <section
      aria-label="Create a post"
      className="border-b border-[#222228] bg-[#141418] p-4 sm:mx-4 sm:mt-4 sm:rounded-3xl sm:border"
    >
      <div className="flex items-center gap-3">
        <Avatar src={me.avatar} name={me.name} handle={me.handle} size={44} ring />
        <button
          type="button"
          onClick={() => onOpenStudio("status")}
          className="min-h-[44px] flex-1 truncate rounded-full border border-[#222228] bg-[#0A0A0C] px-4 py-2.5 text-left text-sm text-muted-foreground transition hover:border-[#FFB800]/60 hover:text-foreground"
        >
          What&apos;s on your mind, {firstName}?
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-[#222228] pt-3">
        <button
          type="button"
          onClick={() => onOpenStudio("camera")}
          className="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-medium text-foreground transition hover:bg-[#0A0A0C] hover:text-[#FFB800]"
        >
          <Camera className="h-4 w-4 shrink-0 text-[#FFB800]" />
          <span>Photo/Video</span>
        </button>

        <button
          type="button"
          onClick={onGoLive}
          className="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-medium text-foreground transition hover:bg-[#0A0A0C] hover:text-red-400"
        >
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
          <span>Go Live</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenStudio("status")}
          className="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-xs font-medium text-foreground transition hover:bg-[#0A0A0C] hover:text-[#FFB800]"
        >
          <Smile className="h-4 w-4 shrink-0 text-[#FFB800]" />
          <span>Feeling/Status</span>
        </button>
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
  const [feedCategory, setFeedCategory] = useState<"all" | Lane>("all");
  const [feedMuted, setFeedMuted] = useState(false);
  const [radarFilter, setRadarFilter] = useState<RadarFilter>("suggestions");
  const [posts, setPosts] = useState<Post[]>(SEED_POSTS);
  const [chats, setChats] = useState<Chat[]>(SEED_CHATS);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<Post | null>(null);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [studioLaunch, setStudioLaunch] = useState<StudioLaunchMode | null>(null);
  const [profileIdx, setProfileIdx] = useState(0);
  const [switcher, setSwitcher] = useState(false);
  const [notif, setNotif] = useState(true);
  const [reelAt, setReelAt] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [requests, setRequests] = useState<SuggestedPerson[]>(FRIEND_REQUESTS);
  const [joinedCrews, setJoinedCrews] = useState<string[]>([]);

  // Persisted posts & account/cloud directory hydration
  const [postsHydrated, setPostsHydrated] = useState(false);
  const [accountsList, setAccountsList] = useState<AccountRecord[]>(() => loadAllAccounts());
  const [cloudDirectory, setCloudDirectory] = useState<SuggestedPerson[]>([]);

  // Live Vibe Room state
  const [liveJoined, setLiveJoined] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [liveIsBroadcast, setLiveIsBroadcast] = useState(false);
  const [liveStreamMuted, setLiveStreamMuted] = useState(false);

  const reelPosts = posts.filter((p) => p.kind === "video" || p.video || p.mediaIsVideo);
  const pauseFeedMedia = Boolean(reelAt || liveOpen || studioLaunch !== null || tab !== "home");

  // Auto-mute Live mini-player whenever another video, reel, story, or voice note claims audio focus
  useEffect(() => {
    return subscribeMediaFocus((activeId) => {
      if (activeId && activeId !== "live-room" && liveJoined && !liveOpen) {
        setLiveStreamMuted(true);
      }
    });
  }, [liveJoined, liveOpen]);

  // Stop any playing feed video/audio immediately when leaving Home tab
  useEffect(() => {
    if (tab !== "home") {
      const current = getActiveMediaFocus();
      if (current?.startsWith("feed-")) {
        releaseMediaFocus(current);
      }
    }
  }, [tab]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab, openChat]);

  useEffect(() => {
    setAccountsList(loadAllAccounts());
  }, [account, setup]);

  useEffect(() => {
    let cancelled = false;
    void listDirectoryProfiles(setup.location).then((items) => {
      if (!cancelled) setCloudDirectory(items);
    });
    return () => {
      cancelled = true;
    };
  }, [account, setup.location]);

  useEffect(() => {
    let cancelled = false;
    setPostsHydrated(false);
    const hydrate = async () => {
      const [persistedUserPosts, cloudPosts] = await Promise.all([
        loadPersistedUserPosts(),
        fetchCloudPosts(account),
      ]);
      if (cancelled) return;
      const engagement = loadAccountEngagement(account);
      const likedSet = new Set(engagement.likedIds);
      const savedSet = new Set(engagement.savedIds);

      const hydratePost = (p: Post, isSeed: boolean): Post => {
        const isLiked = likedSet.has(p.id);
        const isSaved = savedSet.has(p.id);
        const extraComments = engagement.commentsByPostId[p.id] ?? [];
        const existingIds = new Set(p.comments.map((c) => c.id));
        const mergedComments = [
          ...p.comments,
          ...extraComments.filter((c) => !existingIds.has(c.id)),
        ];
        const shareBoost = isSeed ? (engagement.shareCounts[p.id] ?? 0) : 0;
        return {
          ...p,
          liked: isLiked,
          saved: isSaved,
          likes: isSeed ? p.likes + (isLiked ? 1 : 0) : p.likes,
          shares: p.shares + shareBoost,
          comments: mergedComments,
        };
      };

      const seenPostIds = new Set<string>();
      const userAndCloudPosts: Post[] = [];
      for (const p of [...persistedUserPosts, ...cloudPosts]) {
        if (seenPostIds.has(p.id)) continue;
        seenPostIds.add(p.id);
        userAndCloudPosts.push(hydratePost(p, false));
      }

      const merged: Post[] = [
        ...userAndCloudPosts,
        ...SEED_POSTS.filter((p) => !seenPostIds.has(p.id)).map((p) => hydratePost(p, true)),
      ];
      setPosts(merged);
      setPostsHydrated(true);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [account]);

  useEffect(() => {
    if (!postsHydrated) return;
    saveUserPosts(posts);
  }, [posts, postsHydrated]);

  const persistAccountEngagementFromPosts = (nextPosts: Post[]) => {
    const likedIds = nextPosts.filter((p) => p.liked).map((p) => p.id);
    const savedIds = nextPosts.filter((p) => p.saved).map((p) => p.id);
    const commentsByPostId: Record<string, Comment[]> = {};
    const shareCounts: Record<string, number> = {};

    for (const p of nextPosts) {
      const seed = SEED_POSTS.find((s) => s.id === p.id);
      if (seed) {
        const seedIds = new Set(seed.comments.map((c) => c.id));
        const added = p.comments.filter((c) => !seedIds.has(c.id));
        if (added.length > 0) commentsByPostId[p.id] = added;
        const shareDelta = p.shares - seed.shares;
        if (shareDelta > 0) shareCounts[p.id] = shareDelta;
      } else {
        if (p.comments.length > 0) commentsByPostId[p.id] = p.comments;
      }
    }
    saveAccountEngagement(account, { likedIds, savedIds, commentsByPostId, shareCounts });
  };

  const myUser: User = {
    id: account,
    name: setup.name,
    handle: setup.handle,
    avatar: setup.avatar,
  };
  const profiles: User[] = [myUser, ...PROFILES];
  const profile = profiles[profileIdx] ?? myUser;
  const isMe = profileIdx === 0;
  const me: User = {
    id: isMe ? account : profile.id,
    name: profile.name,
    handle: profile.handle,
    avatar: profile.avatar,
  };

  const tappedIds = setup.friends;
  const liveListenerCount = (LIVE_STREAMS[0]?.viewers ?? 1420) + (liveJoined ? 1 : 0);

  const openReels = (startId?: string) => {
    const firstId = startId ?? reelPosts[0]?.id;
    if (firstId) {
      setReelAt(firstId);
    } else {
      toast("Drop a video first to launch Reels");
    }
  };

  const handleTapIn = (id: string, name: string) => {
    if (id === account) return;
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
    if (accountsList.some((r) => r.accountId === id)) {
      setAccountsList(toggleAccountFollow(account, id));
    }
    if (cloudDirectory.some((p) => p.user.id === id)) {
      setCloudDirectory((prev) =>
        prev.map((p) =>
          p.user.id === id
            ? { ...p, followers: Math.max(0, p.followers + (alreadyTapped ? -1 : 1)) }
            : p,
        ),
      );
      void toggleCloudFollow(account, id, !alreadyTapped);
    }
    toast.success(alreadyTapped ? `Removed ${name} from friends` : `Friend Added: ${name} ✓`);
  };

  const handleConfirmRequest = (person: SuggestedPerson) => {
    const { id, name } = person.user;
    if (!setup.friends.includes(id)) {
      onSetupChange({
        ...setup,
        friends: [...setup.friends, id],
        following: setup.following.includes(id) ? setup.following : [...setup.following, id],
      });
    }
    setRequests((prev) => prev.filter((r) => r.user.id !== id));
    toast.success(`You and ${name} are now friends ✓`);
  };

  const handleDismissRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.user.id !== id));
    toast("Friend request removed");
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
    setLiveIsBroadcast(false);
    setLiveJoined(true);
    setLiveOpen(true);
    setLiveStreamMuted(false);
  };

  const handleStartBroadcast = () => {
    setLiveIsBroadcast(true);
    setLiveJoined(true);
    setLiveOpen(true);
    setLiveStreamMuted(false);
    toast.success("You're LIVE now 🔴");
  };

  const handleLeaveLiveRoom = () => {
    const wasBroadcast = liveIsBroadcast;
    setLiveJoined(false);
    setLiveOpen(false);
    setLiveIsBroadcast(false);
    toast(wasBroadcast ? "Ended your live stream" : "Left live stream");
  };

  const registeredPeople: SuggestedPerson[] = accountsList.map((rec) => {
    const firstInterest = rec.profile.interests[0]?.replace(/[^a-zA-Z0-9]/g, "") || "Creator";
    const { cityLower: myCityLower } = normalizeCity(setup.location ?? "");
    const recCity = rec.profile.location || rec.profile.city;
    const { cityLower: recCityLower } = normalizeCity(recCity ?? "");
    return {
      user: {
        id: rec.accountId,
        name: rec.profile.name,
        handle: rec.profile.handle,
        avatar: rec.profile.avatar,
      },
      bio: rec.profile.bio || "Creator on tumeni.",
      vibeTag: `#${firstInterest}`,
      location: recCity,
      city: rec.profile.city,
      mutuals: 0,
      followers: rec.followers.length,
      nearYou: Boolean(myCityLower && recCityLower && myCityLower === recCityLower),
      sharedWith: [],
    };
  });

  const seenPersonIds = new Set<string>();
  const allPeople: SuggestedPerson[] = [
    ...cloudDirectory,
    ...registeredPeople,
    ...SUGGESTED_PEOPLE,
    ...FRIEND_REQUESTS,
  ].filter((p) => {
    if (seenPersonIds.has(p.user.id)) return false;
    seenPersonIds.add(p.user.id);
    return true;
  });

  const { cityLower: myCityLower } = normalizeCity(setup.location ?? "");
  const visibleSuggestions = allPeople
    .filter((p) => p.user.id !== account && !dismissedIds.includes(p.user.id))
    .sort((a, b) => {
      const aMatch = myCityLower
        ? normalizeCity(a.city ?? a.location ?? "").cityLower === myCityLower
        : Boolean(a.nearYou);
      const bMatch = myCityLower
        ? normalizeCity(b.city ?? b.location ?? "").cityLower === myCityLower
        : Boolean(b.nearYou);
      return Number(bMatch) - Number(aMatch);
    });

  const visibleFeed = getVisiblePosts(posts, account, setup.friends);
  const feed =
    feedCategory === "all" ? visibleFeed : visibleFeed.filter((p) => p.lane === feedCategory);
  const myPosts = posts.filter(
    (p) => p.authorAccountId === account || p.user.id === account || p.user.id === "me",
  );
  const activeProfilePosts = isMe ? myPosts : posts.filter((p) => p.user.id === me.id);
  const myFollowersCount =
    cloudDirectory.find((p) => p.user.id === account)?.followers ??
    accountsList.find((r) => r.accountId === account)?.followers.length ??
    0;

  const like = (id: string) =>
    setPosts((ps) => {
      const next = ps.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
      );
      persistAccountEngagementFromPosts(next);
      return next;
    });

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
    setPosts((ps) => {
      const next = ps.map((p) => (p.id === post.id ? { ...p, shares: p.shares + 1 } : p));
      persistAccountEngagementFromPosts(next);
      return next;
    });
    toast.success(`Sent into ${chats.find((c) => c.id === chatId)?.name}`);
  };

  const save = (id: string) => {
    const target = posts.find((p) => p.id === id);
    setPosts((ps) => {
      const next = ps.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p));
      persistAccountEngagementFromPosts(next);
      return next;
    });
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
            ["explore", Users, "Friends"],
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
          className="flex min-h-[44px] items-center gap-4 rounded-2xl px-3 py-3 text-base text-foreground transition hover:bg-[#141418]"
        >
          <Radio className="h-5 w-5 text-red-400" />
          <span>LIVE</span>
        </button>
        <button
          type="button"
          onClick={() => setStudioLaunch("camera")}
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Join LIVE rooms"
                  onClick={handleJoinLiveRoom}
                  className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-red-500/45 bg-red-500/15 px-3 text-xs font-bold text-foreground transition hover:border-red-400 hover:bg-red-500/25"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span>LIVE</span>
                </button>
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

            <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-[#222228] bg-[#0A0A0C]/95 px-4 py-2.5">
              {FEED_CATEGORIES.map((cat) => {
                const active = feedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFeedCategory(cat.id)}
                    className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold transition ${
                      active
                        ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C] shadow-[0_0_12px_rgba(255,184,0,0.3)]"
                        : "border-[#222228] bg-[#141418] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="border-b border-[#222228] bg-[#141418] sm:mx-4 sm:mt-4 sm:rounded-3xl sm:border">
              <StoriesBar me={myUser} />
            </div>

            <ComposerBox
              me={myUser}
              onOpenStudio={(mode) => setStudioLaunch(mode)}
              onGoLive={handleStartBroadcast}
            />

            <div className="sm:space-y-4 sm:px-4 sm:pt-4">
              {feed.map((p, idx) => (
                <div key={p.id} className="space-y-4">
                  <PostCard
                    post={p}
                    muted={feedMuted}
                    onToggleMute={() => setFeedMuted((m) => !m)}
                    onForceMute={() => setFeedMuted(true)}
                    pauseExternal={pauseFeedMedia}
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
                      userLocation={setup.location}
                      onEditLocation={() => {
                        setProfileIdx(0);
                        setTab("profile");
                      }}
                      onTapIn={handleTapIn}
                      onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
                      onSeeAll={() => {
                        setRadarFilter(setup.location ? "nearby" : "suggestions");
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
                  userLocation={setup.location}
                  onEditLocation={() => {
                    setProfileIdx(0);
                    setTab("profile");
                  }}
                  onTapIn={handleTapIn}
                  onDismiss={(id) => setDismissedIds((prev) => [...prev, id])}
                  onSeeAll={() => {
                    setRadarFilter(setup.location ? "nearby" : "suggestions");
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
            suggestions={visibleSuggestions}
            requests={requests}
            allPeople={allPeople}
            currentAccountId={account}
            userLocation={setup.location}
            tappedIds={tappedIds}
            joinedCrews={joinedCrews}
            onAddFriend={handleTapIn}
            onConfirmRequest={handleConfirmRequest}
            onDismissSuggestion={(id) => setDismissedIds((prev) => [...prev, id])}
            onDismissRequest={handleDismissRequest}
            onSendDm={openDmForUser}
            onJoinCrew={handleJoinCrew}
            onOpenCrewChat={() => {
              setTab("messages");
              setOpenChat("crew");
            }}
            onOpenMyProfile={() => {
              setProfileIdx(0);
              setTab("profile");
            }}
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
            userLocation={isMe ? setup.location : undefined}
            interests={isMe ? setup.interests : []}
            account={account}
            myPosts={activeProfilePosts}
            saved={posts.filter((p) => p.saved)}
            followersCount={
              isMe
                ? myFollowersCount
                : (SUGGESTED_PEOPLE.find((p) => p.user.id === me.id)?.followers ?? 0)
            }
            followingCount={isMe ? setup.following.length : 0}
            editable={isMe}
            onEdit={(v) => {
              const { location, city } = normalizeCity(v.location);
              onSetupChange({ ...setup, ...v, location, city });
              setPosts((ps) =>
                ps.map((p) =>
                  p.authorAccountId === account || p.user.id === account
                    ? {
                        ...p,
                        user: {
                          ...p.user,
                          name: v.name,
                          handle: v.handle,
                          avatar: v.avatar,
                        },
                      }
                    : p,
                ),
              );
            }}
            onOpen={(id) => openReels(id)}
            onCreateDrop={() => setStudioLaunch("camera")}
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
                ["explore", Users, "Friends"],
              ] as const
            ).map(([t, I, label]) => (
              <NavBtn key={t} active={tab === t} onClick={() => setTab(t)} label={label}>
                <I className="h-6 w-6" />
              </NavBtn>
            ))}
            <button
              type="button"
              aria-label="Create drop"
              onClick={() => setStudioLaunch("camera")}
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
            <h3 className="font-semibold text-foreground">People you may know</h3>
            <button
              type="button"
              onClick={() => {
                setRadarFilter("suggestions");
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
                setRadarFilter("suggestions");
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
                    {joined ? "Joined ✓" : "Join"}
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
          initialCategory={feedCategory}
          suspended={liveOpen || studioLaunch !== null}
          followingIds={setup.friends}
          onToggleFollow={handleTapIn}
          liveListenerCount={liveListenerCount}
          onClose={() => setReelAt(null)}
          onOpenLive={handleJoinLiveRoom}
          onGoLive={handleStartBroadcast}
          onLike={like}
          onComment={setCommentsFor}
          onShare={setShareFor}
          onSave={save}
        />
      )}

      {liveJoined && liveOpen && (
        <LiveVibeRoomSheet
          me={myUser}
          isHostBroadcast={liveIsBroadcast}
          followingIds={setup.following}
          onToggleFollowHost={(host) => handleTapIn(host.id, host.name)}
          streamMuted={liveStreamMuted}
          onToggleStreamMute={() => setLiveStreamMuted((m) => !m)}
          onMinimize={() => setLiveOpen(false)}
          onLeave={handleLeaveLiveRoom}
        />
      )}

      {liveJoined && !liveOpen && (
        <LiveMiniPlayer
          roomTitle={liveIsBroadcast ? `${myUser.name}'s Live Room` : undefined}
          hostHandle={liveIsBroadcast ? myUser.handle : undefined}
          hostAvatar={liveIsBroadcast ? myUser.avatar : undefined}
          hostName={liveIsBroadcast ? myUser.name : undefined}
          listenerCount={liveListenerCount}
          streamMuted={liveStreamMuted}
          onToggleMute={() => {
            setLiveStreamMuted((m) => {
              const next = !m;
              if (!next) claimMediaFocus("live-room");
              return next;
            });
          }}
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
              setPosts((ps) => {
                const next = ps.map((p) =>
                  p.id === commentPost.id
                    ? {
                        ...p,
                        comments: [...p.comments, { id: crypto.randomUUID(), user: me, text }],
                      }
                    : p,
                );
                persistAccountEngagementFromPosts(next);
                return next;
              })
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

      {studioLaunch !== null && (
        <StudioCameraModal
          launchMode={studioLaunch}
          me={myUser}
          onClose={() => setStudioLaunch(null)}
          onPublish={({
            kind,
            lane,
            audience,
            caption,
            tag,
            track,
            soundUrl,
            soundYoutubeId,
            media,
            mediaStorageKey,
            isVideo,
            filterClass,
            filterCss,
            effectId,
            playbackSpeed,
            overlays,
            stickers,
            mood,
          }) => {
            const post: Post = {
              id: crypto.randomUUID(),
              user: myUser,
              authorAccountId: account,
              lane: lane ?? "circle",
              kind,
              audience,
              time: "just now",
              caption,
              tag,
              likes: 0,
              shares: 0,
              comments: [],
              media: kind === "text" || kind === "audio" ? undefined : media,
              mediaStorageKey,
              video: kind === "video" ? media : undefined,
              audio: kind === "audio" ? media : undefined,
              soundUrl,
              soundYoutubeId,
              mediaIsVideo: isVideo,
              views: kind === "video" ? 1 : undefined,
              track: track ?? (kind === "audio" ? `${setup.name} — new sound` : undefined),
              duration: kind === "audio" ? "0:30" : undefined,
              filterClass,
              filterCss,
              effectId,
              playbackSpeed,
              overlays,
              stickers,
              mood,
            };
            setPosts((ps) => [post, ...ps]);
            void publishCloudPost(account, post).catch(() => {});
            setTab("home");
            setStudioLaunch(null);
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
  userLocation,
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
  userLocation?: string | undefined;
  interests: string[];
  account: string;
  myPosts: Post[];
  saved: Post[];
  followersCount: number;
  followingCount: number;
  editable: boolean;
  onEdit: (v: {
    name: string;
    handle: string;
    bio: string;
    location: string;
    avatar: string;
  }) => void;
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
        {userLocation && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#FFB800]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{userLocation}</span>
          </p>
        )}
        {editable && !userLocation && account.includes(":") && (
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
          userLocation={userLocation}
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
  userLocation,
  onClose,
  onSave,
}: {
  me: User;
  bio: string;
  userLocation?: string | undefined;
  onClose: () => void;
  onSave: (v: {
    name: string;
    handle: string;
    bio: string;
    location: string;
    avatar: string;
  }) => void;
}) {
  const [name, setName] = useState(me.name);
  const [handle, setHandle] = useState(me.handle.replace(/^@/, ""));
  const [text, setText] = useState(bio);
  const [cityInput, setCityInput] = useState(userLocation ?? "");
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
              location: cityInput.trim(),
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
              void compressAvatarFile(file)
                .then((dataUrl) => {
                  setPic(dataUrl);
                  setPhotoError("");
                })
                .catch(() => {
                  setPhotoError("This photo could not be opened. Try another.");
                });
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
        <div className="mt-3 space-y-2">
          <label className="block text-xs text-muted-foreground">
            City / Vibe Zone
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#222228] bg-[#0A0A0C] px-3 focus-within:border-[#FFB800]">
              <MapPin className="h-4 w-4 shrink-0 text-[#FFB800]" />
              <input
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                maxLength={80}
                placeholder="e.g. Johannesburg, NYC, London..."
                className="w-full bg-transparent py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
          </label>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
            {POPULAR_CITIES.map((city) => {
              const active = cityInput.trim().toLowerCase() === city.toLowerCase();
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setCityInput(city)}
                  className={`min-h-[30px] shrink-0 whitespace-nowrap rounded-full border px-3 text-[11px] font-medium transition ${
                    active
                      ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                      : "border-[#222228] bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
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
  initialCategory = "all",
  suspended = false,
  followingIds,
  onToggleFollow,
  liveListenerCount,
  onClose,
  onOpenLive,
  onGoLive,
  onLike,
  onComment,
  onShare,
  onSave,
}: {
  posts: Post[];
  startId: string;
  initialCategory?: "all" | Lane | undefined;
  suspended?: boolean | undefined;
  followingIds: string[];
  onToggleFollow: (id: string, name: string) => void;
  liveListenerCount: number;
  onClose: () => void;
  onOpenLive: () => void;
  onGoLive: () => void;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (p: Post) => void;
  onSave: (id: string) => void;
}) {
  const [category, setCategory] = useState<"all" | Lane>(initialCategory);
  const filtered = category === "all" ? posts : posts.filter((p) => p.lane === category);
  const displayPosts = filtered.length > 0 ? filtered : posts;
  const [active, setActive] = useState(() =>
    displayPosts.some((p) => p.id === startId) ? startId : (displayPosts[0]?.id ?? startId),
  );
  const [muted, setMuted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const rawIdx = displayPosts.findIndex((p) => p.id === active);
  const activeIndex = rawIdx >= 0 ? rawIdx : 0;
  const displayPostIdsKey = displayPosts.map((p) => p.id).join("|");
  const prevCategoryRef = useRef(category);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    if (!suspended) {
      claimMediaFocus("reels");
    }
    return () => {
      releaseMediaFocus("reels");
    };
  }, [suspended]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const root = box.current;
    if (!root) return;
    if (!didInitialScrollRef.current || prevCategoryRef.current === category) {
      if (!didInitialScrollRef.current) {
        didInitialScrollRef.current = true;
        root.querySelector(`[data-id="${startId}"]`)?.scrollIntoView();
      }
    } else {
      root.scrollTo({ top: 0 });
    }
    prevCategoryRef.current = category;
  }, [startId, category]);

  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset["id"] ?? "");
        }),
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-id]").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
    };
  }, [displayPostIdsKey]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0C]">
      <div
        ref={box}
        className="no-scrollbar mx-auto h-dvh max-w-xl snap-y snap-mandatory overflow-y-scroll"
      >
        {displayPosts.map((p, idx) => (
          <Reel
            key={p.id}
            post={p}
            active={!suspended && active === p.id}
            shouldMountMedia={Math.abs(idx - activeIndex) <= 1}
            isNext={idx === activeIndex + 1}
            muted={muted}
            onForceMute={() => setMuted(true)}
            following={followingIds.includes(p.user.id)}
            onToggleFollow={() => onToggleFollow(p.user.id, p.user.name)}
            onLike={() => onLike(p.id)}
            onComment={() => onComment(p.id)}
            onShare={() => onShare(p)}
            onSave={() => onSave(p.id)}
          />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-0 mx-auto max-w-xl space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Close reels"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C]/70 text-foreground backdrop-blur transition hover:text-[#FFB800]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onOpenLive}
              aria-label={`Open live room (${liveListenerCount} listening)`}
              className="flex min-h-[38px] items-center gap-2 rounded-full border border-red-500/60 bg-[#0A0A0C]/80 px-3 text-xs font-bold text-foreground shadow-[0_0_16px_rgba(239,68,68,0.45)] backdrop-blur transition hover:border-red-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="tabular-nums">LIVE ({liveListenerCount})</span>
            </button>
            <span className="hidden rounded-full bg-[#0A0A0C]/65 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground backdrop-blur sm:inline-flex">
              {activeIndex + 1}/{displayPosts.length}
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onGoLive}
              className="flex min-h-[38px] items-center gap-1.5 rounded-full bg-[#FFB800] px-3.5 text-xs font-bold text-[#0A0A0C] shadow-[0_0_14px_rgba(255,184,0,0.4)] transition hover:brightness-110 active:scale-95"
            >
              <Radio className="h-3.5 w-3.5" />
              <span>Go LIVE</span>
            </button>
            <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted(!muted)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C]/70 text-foreground backdrop-blur transition hover:text-[#FFB800]"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="pointer-events-auto no-scrollbar flex gap-1.5 overflow-x-auto">
          {FEED_CATEGORIES.map((cat) => {
            const selected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  const nextList =
                    cat.id === "all" ? posts : posts.filter((p) => p.lane === cat.id);
                  const first = (nextList.length > 0 ? nextList : posts)[0];
                  if (first) setActive(first.id);
                }}
                className={`min-h-[30px] shrink-0 whitespace-nowrap rounded-full px-3 text-[11px] font-semibold backdrop-blur transition ${
                  selected
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C]/65 text-foreground/85 hover:text-[#FFB800]"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Reel({
  post,
  active,
  shouldMountMedia,
  isNext,
  muted,
  onForceMute,
  following,
  onToggleFollow,
  onLike,
  onComment,
  onShare,
  onSave,
}: {
  post: Post;
  active: boolean;
  shouldMountMedia: boolean;
  isNext: boolean;
  muted: boolean;
  onForceMute: () => void;
  following: boolean;
  onToggleFollow: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const soundAudioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const onForceMuteRef = useRef(onForceMute);
  onForceMuteRef.current = onForceMute;

  // Play/pause lifecycle decoupled from mute updates so muting never kicks playback
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && !paused) {
      if (v.paused) {
        void v.play().catch(() => {
          v.muted = true;
          onForceMuteRef.current();
          void v.play().catch(() => {});
        });
      }
    } else {
      if (!v.paused) v.pause();
      setBuffering(false);
    }
    if (!active) {
      if (v.currentTime > 0) v.currentTime = 0;
      if (progressBarRef.current) progressBarRef.current.style.width = "0%";
      setPaused(false);
    }
  }, [active, paused, shouldMountMedia]);

  useEffect(() => {
    const sa = soundAudioRef.current;
    if (!sa) return;
    if (active && !paused && !muted) {
      if (sa.paused) void sa.play().catch(() => {});
    } else if (!sa.paused) {
      sa.pause();
    }
    if (!active && sa.currentTime > 0) {
      sa.currentTime = 0;
    }
  }, [active, paused, muted, post.soundUrl, shouldMountMedia]);

  useEffect(() => {
    const v = ref.current;
    if (v) {
      v.playbackRate = post.playbackSpeed ?? 1;
      v.muted = muted || !!post.soundUrl || !!post.soundYoutubeId;
    }
    const sa = soundAudioRef.current;
    if (sa) {
      sa.muted = muted;
    }
  }, [muted, post.soundUrl, post.soundYoutubeId, post.playbackSpeed, shouldMountMedia]);

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
      {shouldMountMedia && post.soundUrl && (
        <audio
          ref={soundAudioRef}
          src={post.soundUrl}
          loop
          preload={active ? "auto" : "metadata"}
        />
      )}
      {!post.soundUrl && post.soundYoutubeId && active && !paused && !muted && (
        <iframe
          key={post.soundYoutubeId}
          title={`Reel Track ${post.track ?? "YouTube Music"}`}
          src={`https://www.youtube-nocookie.com/embed/${post.soundYoutubeId}?autoplay=1&loop=1&playlist=${post.soundYoutubeId}&controls=0`}
          allow="autoplay; encrypted-media"
          className="pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0"
        />
      )}
      {post.mediaIsVideo || post.video ? (
        shouldMountMedia ? (
          <video
            ref={ref}
            src={post.video ?? post.media}
            muted={muted || !!post.soundUrl || !!post.soundYoutubeId}
            loop
            playsInline
            preload={active || isNext ? "auto" : "metadata"}
            onClick={tap}
            onWaiting={() => setBuffering(true)}
            onPlaying={() => setBuffering(false)}
            onCanPlay={() => setBuffering(false)}
            onTimeUpdate={(e) => {
              if (progressBarRef.current) {
                const pct = (e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100;
                progressBarRef.current.style.width = `${pct}%`;
              }
            }}
            style={post.filterCss ? { filter: post.filterCss } : undefined}
            className={`h-full w-full object-cover ${post.filterCss ? "" : (post.filterClass ?? "")}`}
          />
        ) : (
          <div onClick={tap} className="h-full w-full bg-[#0A0A0C]" />
        )
      ) : post.media ? (
        <img
          src={post.media}
          alt={post.caption}
          onClick={tap}
          referrerPolicy="no-referrer"
          style={post.filterCss ? { filter: post.filterCss } : undefined}
          className={`h-full w-full object-cover ${post.filterCss ? "" : (post.filterClass ?? "")}`}
        />
      ) : (
        <div
          onClick={tap}
          className="flex h-full items-center justify-center bg-[#141418] p-8 text-center text-2xl font-semibold"
        >
          {post.caption}
        </div>
      )}
      <VideoStageDecorations
        effectId={post.effectId}
        overlays={post.overlays}
        stickers={post.stickers}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-transparent to-[#0A0A0C]/35" />
      {active && !paused && buffering && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0A0A0C]/65 p-3 backdrop-blur">
          <Loader2 className="h-7 w-7 animate-spin text-[#FFB800]" />
        </div>
      )}
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow();
            }}
            className={`ml-1 rounded-full px-3 py-1 text-xs font-semibold transition active:scale-95 ${
              following
                ? "border border-[#222228] bg-[#141418]/80 text-foreground/90 backdrop-blur"
                : "bg-[#FFB800] text-[#0A0A0C] hover:brightness-110"
            }`}
          >
            {following ? "Following ✓" : "Follow"}
          </button>
        </div>
        <p className="text-sm">
          {post.caption} {post.tag && <span className="text-[#FFB800]">{post.tag}</span>}
        </p>
        <div className="flex max-w-xs items-center gap-2 rounded-full bg-[#0A0A0C]/55 px-3 py-1 text-xs text-foreground/90 backdrop-blur">
          <Music className="h-3.5 w-3.5 shrink-0 text-[#FFB800]" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div
              className={`flex w-max whitespace-nowrap ${active && !paused ? "animate-marquee" : ""}`}
            >
              <span className="pr-8">
                🎵 {post.track ?? `Original Audio — ${post.user.handle}`}
              </span>
              {active && !paused && (
                <span aria-hidden="true" className="pr-8">
                  🎵 {post.track ?? `Original Audio — ${post.user.handle}`}
                </span>
              )}
            </div>
          </div>
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
        <div ref={progressBarRef} className="h-full bg-[#FFB800]" style={{ width: "0%" }} />
      </div>
    </section>
  );
}
