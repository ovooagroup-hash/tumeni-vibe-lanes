import { useCallback, useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Eye,
  Heart,
  ImagePlus,
  Maximize2,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Send,
  Sparkles,
  UserPlus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  LIVE_STREAMS,
  STUDIO_FILTERS,
  computeFilterCss,
  fmt,
  type LiveChatMsg,
  type LiveStreamItem,
  type StudioFilterOption,
  type User,
} from "./data";
import { Avatar, Waveform } from "./SharedUI";
import { claimMediaFocus, releaseMediaFocus } from "./mediaCoordinator";

export type FloatingReaction = {
  id: string;
  emoji: string;
  offsetX: number;
};

const QUICK_REACTIONS = ["🔥", "👑", "💛", "🚀"] as const;

const SIMULATED_VIEWER_LINES = [
  { user: "@sora.wav", text: "Audio sounds super crisp 🔥" },
  { user: "@milo808", text: "Just tapped in! What BPM is this?" },
  { user: "@taya.v", text: "Obsidian vibes all night 💛" },
  { user: "@jae.studio", text: "Locked in from downtown studio 🚀" },
];

export function LiveVibeRoomSheet({
  me,
  isHostBroadcast = false,
  followingIds,
  onToggleFollowHost,
  streamMuted,
  onToggleStreamMute,
  onMinimize,
  onLeave,
}: {
  me: User;
  isHostBroadcast?: boolean | undefined;
  followingIds: string[];
  onToggleFollowHost: (host: User) => void;
  streamMuted: boolean;
  onToggleStreamMute: () => void;
  onMinimize: () => void;
  onLeave: () => void;
}) {
  const [activeStreamIdx, setActiveStreamIdx] = useState(0);
  const currentStream: LiveStreamItem = LIVE_STREAMS[activeStreamIdx] ?? LIVE_STREAMS[0]!;
  const hostUser = isHostBroadcast ? me : currentStream.host;
  const activeTitle = isHostBroadcast ? "Tumeni Studio Broadcast" : currentStream.title;
  const isFollowingHost = followingIds.includes(hostUser.id);

  // Host camera, fallback media & mic state
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [hasHostCam, setHasHostCam] = useState(false);
  const [hostRetryKey, setHostRetryKey] = useState(0);
  const [hostBackdrop, setHostBackdrop] = useState<{
    url: string;
    kind: "video" | "image";
  } | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [activeFilterIdx, setActiveFilterIdx] = useState(0);
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [showFilters, setShowFilters] = useState(false);
  const [liveSwipeBadge, setLiveSwipeBadge] = useState<StudioFilterOption | null>(null);
  const [watchVideoFailed, setWatchVideoFailed] = useState(false);

  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const hostNativeCamRef = useRef<HTMLInputElement>(null);
  const hostGalleryRef = useRef<HTMLInputElement>(null);
  const watchVideoRef = useRef<HTMLVideoElement>(null);
  const watchAudioRef = useRef<HTMLAudioElement>(null);
  const hostStreamRef = useRef<MediaStream | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeBadgeTimerRef = useRef<number | null>(null);

  const activeFilter = STUDIO_FILTERS[activeFilterIdx] ?? STUDIO_FILTERS[0]!;
  const activeCssFilter = computeFilterCss(activeFilter, filterIntensity);

  const selectLiveFilter = useCallback((idx: number, showBadge = false) => {
    const normalized =
      ((idx % STUDIO_FILTERS.length) + STUDIO_FILTERS.length) % STUDIO_FILTERS.length;
    setActiveFilterIdx(normalized);
    if (showBadge) {
      setLiveSwipeBadge(STUDIO_FILTERS[normalized]!);
      if (swipeBadgeTimerRef.current) window.clearTimeout(swipeBadgeTimerRef.current);
      swipeBadgeTimerRef.current = window.setTimeout(() => {
        setLiveSwipeBadge(null);
      }, 1200);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (swipeBadgeTimerRef.current) window.clearTimeout(swipeBadgeTimerRef.current);
    };
  }, []);

  // Live engagement state (viewers, likes, floating hearts, chat)
  const [viewerCount, setViewerCount] = useState(isHostBroadcast ? 1420 : currentStream.viewers);
  const [streamLikes, setStreamLikes] = useState(isHostBroadcast ? 318 : currentStream.likes);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [chatMessages, setChatMessages] = useState<LiveChatMsg[]>(
    isHostBroadcast
      ? [
          {
            id: "host-init-1",
            user: "@nalagold",
            avatar: LIVE_STREAMS[1]!.host.avatar,
            text: "First one in! Let's go 🔴",
          },
          {
            id: "host-init-2",
            user: "@kitobeats",
            avatar: LIVE_STREAMS[0]!.host.avatar,
            text: "Studio broadcast looking clean 🔥",
          },
        ]
      : currentStream.initialChat,
  );
  const [chatDraft, setChatDraft] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Reset chat, counters & fallback flag when switching Watch LIVE creator streams
  useEffect(() => {
    if (isHostBroadcast) return;
    const s = LIVE_STREAMS[activeStreamIdx] ?? LIVE_STREAMS[0]!;
    setViewerCount(s.viewers);
    setStreamLikes(s.likes);
    setChatMessages(s.initialChat);
    setWatchVideoFailed(false);
  }, [activeStreamIdx, isHostBroadcast]);

  // Host Mode: Try live device camera + mic inside strict try/catch; auto-fallback to Tumeni Studio Broadcast
  useEffect(() => {
    if (!isHostBroadcast) {
      hostStreamRef.current?.getTracks().forEach((t) => t.stop());
      hostStreamRef.current = null;
      return;
    }

    let cancelled = false;
    const startBroadcastCam = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setHasHostCam(false);
          return;
        }
        hostStreamRef.current?.getTracks().forEach((t) => t.stop());

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: true,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode },
            audio: false,
          });
          if (!cancelled) {
            setMicMuted(true);
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        hostStreamRef.current = stream;
        setHasHostCam(true);
        if (hostVideoRef.current) {
          hostVideoRef.current.srcObject = stream;
          void hostVideoRef.current.play().catch(() => {});
        }
      } catch {
        if (cancelled) return;
        hostStreamRef.current = null;
        setHasHostCam(false);
      }
    };

    void startBroadcastCam();

    return () => {
      cancelled = true;
      hostStreamRef.current?.getTracks().forEach((t) => t.stop());
      hostStreamRef.current = null;
    };
  }, [isHostBroadcast, facingMode, hostRetryKey]);

  // Dedicated host camera stream attachment effect (prevents blank/black mount race condition)
  useEffect(() => {
    const videoEl = hostVideoRef.current;
    if (isHostBroadcast && hasHostCam && videoEl && hostStreamRef.current) {
      if (videoEl.srcObject !== hostStreamRef.current) {
        videoEl.srcObject = hostStreamRef.current;
      }
      void videoEl.play().catch(() => {});
    }
  }, [isHostBroadcast, hasHostCam, facingMode]);

  // Toggle live microphone track on host MediaStream
  useEffect(() => {
    if (!isHostBroadcast || !hostStreamRef.current) return;
    hostStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !micMuted;
    });
  }, [micMuted, isHostBroadcast]);

  useEffect(() => {
    claimMediaFocus("live-room");
    return () => {
      releaseMediaFocus("live-room");
    };
  }, []);

  // Watcher Mode: Sync creator stream video + optional audio
  useEffect(() => {
    if (isHostBroadcast) return;
    const v = watchVideoRef.current;
    const a = watchAudioRef.current;
    if (v) {
      v.muted = streamMuted || !!currentStream.audioUrl;
      void v.play().catch(() => {});
    }
    if (a) {
      if (currentStream.audioUrl) {
        if (a.src !== currentStream.audioUrl) {
          a.src = currentStream.audioUrl;
        }
        a.muted = streamMuted;
        if (!streamMuted) {
          void a.play().catch(() => {});
        } else {
          a.pause();
        }
      } else {
        a.pause();
        a.removeAttribute("src");
        a.load();
      }
    }
  }, [isHostBroadcast, streamMuted, currentStream]);

  // Dynamic viewer fluctuation & ambient incoming chat/reactions
  useEffect(() => {
    const t = setInterval(() => {
      setViewerCount((v) => Math.max(18, v + Math.floor(Math.random() * 9) - 3));
      if (Math.random() > 0.4) {
        const emoji = QUICK_REACTIONS[Math.floor(Math.random() * QUICK_REACTIONS.length)] ?? "💛";
        spawnReaction(emoji, false);
      }
      if (Math.random() > 0.58) {
        const sample =
          SIMULATED_VIEWER_LINES[Math.floor(Math.random() * SIMULATED_VIEWER_LINES.length)]!;
        setChatMessages((prev) => [
          ...prev.slice(-18),
          {
            id: crypto.randomUUID(),
            user: sample.user,
            avatar: LIVE_STREAMS[0]!.host.avatar,
            text: sample.text,
          },
        ]);
      }
    }, 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatMessages]);

  const spawnReaction = (emoji: string, incrementLike = true) => {
    const id = crypto.randomUUID();
    const offsetX = Math.floor(Math.random() * 52) - 26;
    setReactions((prev) => [...prev.slice(-18), { id, emoji, offsetX }]);
    if (incrementLike) {
      setStreamLikes((l) => l + 1);
    }
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  const sendChatComment = () => {
    const trimmed = chatDraft.trim();
    if (!trimmed) return;
    setChatMessages((prev) => [
      ...prev.slice(-20),
      {
        id: crypto.randomUUID(),
        user: me.handle,
        avatar: me.avatar,
        text: trimmed,
      },
    ]);
    setChatDraft("");
  };

  const handleTryDeviceCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const probe = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        probe.getTracks().forEach((t) => t.stop());
        setHostRetryKey((k) => k + 1);
        toast.success("Live camera connected");
        return;
      } catch {
        // Fallback immediately to native mobile camera capture input
      }
    }
    hostNativeCamRef.current?.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0C]"
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchStartRef.current;
        const t = e.changedTouches[0];
        touchStartRef.current = null;
        if (!start || !t) return;
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (!isHostBroadcast && dy > 90 && Math.abs(dy) > Math.abs(dx)) {
          onLeave();
        } else if (isHostBroadcast && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          selectLiveFilter(activeFilterIdx + (dx < 0 ? 1 : -1), true);
        }
      }}
      onPointerDown={(e) => {
        if (isHostBroadcast && e.pointerType === "mouse") {
          touchStartRef.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onPointerUp={(e) => {
        if (!isHostBroadcast || e.pointerType !== "mouse") return;
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          selectLiveFilter(activeFilterIdx + (dx < 0 ? 1 : -1), true);
        }
      }}
    >
      {!isHostBroadcast && <audio ref={watchAudioRef} loop preload="none" />}
      <input
        ref={hostNativeCamRef}
        type="file"
        accept="video/*,image/*"
        capture={facingMode === "user" ? "user" : "environment"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.currentTarget.value = "";
          if (!f) return;
          const url = URL.createObjectURL(f);
          setHostBackdrop({ url, kind: f.type.startsWith("video/") ? "video" : "image" });
          toast.success("Studio backdrop updated");
        }}
      />
      <input
        ref={hostGalleryRef}
        type="file"
        accept="video/*,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.currentTarget.value = "";
          if (!f) return;
          const url = URL.createObjectURL(f);
          setHostBackdrop({ url, kind: f.type.startsWith("video/") ? "video" : "image" });
          toast.success("Studio backdrop updated");
        }}
      />

      <div className="relative h-dvh w-full max-w-md overflow-hidden bg-[#121218] sm:aspect-[9/16] sm:h-[94dvh] sm:w-auto sm:rounded-3xl sm:border sm:border-[#222228]">
        {/* Full-Screen Vertical Video Stage (Tap anywhere to spawn floating gold/amber hearts) */}
        <div
          onClick={() => spawnReaction("💛", true)}
          className="relative h-full w-full cursor-pointer select-none bg-[#121218]"
        >
          {isHostBroadcast ? (
            hasHostCam ? (
              <video
                ref={hostVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  void e.currentTarget.play().catch(() => {});
                }}
                style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                className={`h-full w-full object-cover transition duration-300 ${
                  facingMode === "user" ? "-scale-x-100" : ""
                }`}
              />
            ) : hostBackdrop ? (
              hostBackdrop.kind === "video" ? (
                <video
                  src={hostBackdrop.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                  className="h-full w-full object-cover transition duration-300"
                />
              ) : (
                <img
                  src={hostBackdrop.url}
                  alt="Live broadcast stage"
                  style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                  className="h-full w-full object-cover transition duration-300"
                />
              )
            ) : (
              /* Tumeni Studio Broadcast Stage (Zero Permission Wall) */
              <div
                style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1A1614] via-[#101016] to-[#141418] px-7 text-center transition duration-300"
              >
                <div className="pointer-events-none absolute h-80 w-80 rounded-full bg-[#FFB800]/18 blur-3xl" />
                <div className="relative flex items-center justify-center">
                  <span className="animate-ring-pulse absolute h-36 w-36 rounded-full border border-[#FFB800]/40" />
                  <span className="animate-ring-pulse absolute h-48 w-48 rounded-full border border-[#FFB800]/20 [animation-delay:0.6s]" />
                  <Avatar src={me.avatar} name={me.name} handle={me.handle} size={96} glowRing />
                </div>

                <div className="mt-5 flex items-center gap-2 rounded-full border border-[#FFB800]/50 bg-[#141418]/90 px-3.5 py-1 text-xs font-bold text-[#FFB800] shadow-[0_0_20px_rgba(255,184,0,0.3)] backdrop-blur-md">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <span>LIVE · Tumeni Studio Broadcast</span>
                </div>

                <p className="mt-2.5 text-lg font-bold text-foreground">{me.name}</p>
                <p className="text-xs text-muted-foreground">{me.handle}</p>

                <div className="mt-5 w-48 rounded-2xl border border-[#222228] bg-[#141418]/80 px-4 py-3 backdrop-blur-md">
                  <Waveform playing={!micMuted} bars={18} className="h-9" />
                </div>
              </div>
            )
          ) : watchVideoFailed ? (
            <div className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#181512] via-[#0A0A0C] to-[#141418] px-6 text-center">
              <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#FFB800]/15 blur-3xl" />
              <Avatar
                src={currentStream.host.avatar}
                name={currentStream.host.name}
                handle={currentStream.host.handle}
                size={92}
                glowRing
              />
              <p className="mt-4 text-lg font-bold text-foreground">{currentStream.title}</p>
              <p className="text-xs text-[#FFB800]">{currentStream.host.handle}</p>
              <div className="mt-4 w-44">
                <Waveform playing={!streamMuted} bars={16} className="h-8" />
              </div>
            </div>
          ) : (
            <video
              ref={watchVideoRef}
              key={currentStream.id}
              src={currentStream.videoUrl}
              autoPlay
              loop
              muted={streamMuted || !!currentStream.audioUrl}
              playsInline
              onError={() => setWatchVideoFailed(true)}
              className="h-full w-full object-cover"
            />
          )}

          {/* Active Live Filter Overlay */}
          {isHostBroadcast && activeFilter.overlay && (
            <div
              style={{ opacity: filterIntensity / 100 }}
              className={`pointer-events-none absolute inset-0 ${activeFilter.overlay}`}
            />
          )}

          {isHostBroadcast && liveSwipeBadge && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FFB800]/50 bg-[#0A0A0C]/80 px-5 py-2 text-sm font-bold text-foreground shadow-[0_0_24px_rgba(255,184,0,0.35)] backdrop-blur-md">
              <span className="mr-1.5">{liveSwipeBadge.emoji}</span>
              <span>{liveSwipeBadge.label}</span>
            </div>
          )}

          {/* Cinematic Edge Scrims */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0A0A0C]/75 via-transparent to-[#0A0A0C]/90" />
        </div>

        {/* Top Bar: Preview Camera Banner (Host Fallback) + Host/Follow Pill + LIVE Viewer Counter + Controls */}
        <header className="absolute inset-x-0 top-0 z-20 space-y-2.5 p-4">
          {isHostBroadcast && !hasHostCam && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleTryDeviceCamera();
                }}
                className="flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-full border border-[#FFB800]/45 bg-[#141418]/90 px-3 text-[11px] font-semibold text-[#FFB800] backdrop-blur-md transition hover:border-[#FFB800]"
              >
                <Camera className="h-3.5 w-3.5 shrink-0" />
                <span>Open Phone Camera</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hostGalleryRef.current?.click();
                }}
                className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-[#222228] bg-[#141418]/90 px-3 text-[11px] font-semibold text-foreground backdrop-blur-md transition hover:border-[#FFB800]"
              >
                <ImagePlus className="h-3.5 w-3.5 shrink-0 text-[#FFB800]" />
                <span>Pick from Gallery</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {/* Creator Handle + Follow Pill */}
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-[#222228] bg-[#0A0A0C]/75 p-1 pr-2.5 backdrop-blur-md">
              <Avatar
                src={hostUser.avatar}
                name={hostUser.name}
                handle={hostUser.handle}
                size={34}
                ring
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs font-bold text-foreground">
                    {hostUser.handle}
                  </span>
                  {hostUser.verified && (
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
                  )}
                </div>
                <p className="truncate text-[10px] text-muted-foreground">{activeTitle}</p>
              </div>
              {!isHostBroadcast && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFollowHost(hostUser);
                  }}
                  className={`ml-1 flex min-h-[30px] shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold transition ${
                    isFollowingHost
                      ? "border border-[#FFB800]/50 bg-[#141418] text-[#FFB800]"
                      : "bg-[#FFB800] text-[#0A0A0C]"
                  }`}
                >
                  {isFollowingHost ? (
                    <>
                      <span>Following</span>
                      <Check className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right Status & Exit Controls */}
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="flex h-8 items-center gap-1.5 rounded-full border border-red-500/50 bg-[#0A0A0C]/80 px-2.5 text-[11px] font-bold text-foreground shadow-[0_0_14px_rgba(239,68,68,0.45)] backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span>LIVE</span>
                <span className="flex items-center gap-0.5 text-muted-foreground tabular-nums">
                  <Eye className="h-3 w-3 text-[#FFB800]" />
                  {fmt(viewerCount)}
                </span>
              </div>

              {!isHostBroadcast && (
                <button
                  type="button"
                  aria-label={streamMuted ? "Unmute live audio" : "Mute live audio"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStreamMute();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#222228] bg-[#0A0A0C]/75 text-foreground backdrop-blur-md hover:text-[#FFB800]"
                >
                  {streamMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-[#FFB800]" />
                  )}
                </button>
              )}

              <button
                type="button"
                aria-label="Minimize live stream"
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimize();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#222228] bg-[#0A0A0C]/75 text-foreground backdrop-blur-md hover:text-[#FFB800]"
              >
                <ChevronDown className="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label={isHostBroadcast ? "End live stream" : "Exit live stream"}
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave();
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#222228] bg-[#0A0A0C]/75 text-muted-foreground backdrop-blur-md hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Watcher Mode: Switch between live creator rooms */}
          {!isHostBroadcast && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {LIVE_STREAMS.map((s, idx) => {
                const active = idx === activeStreamIdx;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveStreamIdx(idx);
                    }}
                    className={`flex min-h-[32px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold backdrop-blur-md transition ${
                      active
                        ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                        : "border-[#222228] bg-[#0A0A0C]/65 text-foreground hover:border-[#FFB800]/50"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span>{s.host.handle}</span>
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* Right-Side Floating Heart & Reaction Burst Rail */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-36 right-6 z-20 flex flex-col items-center"
        >
          {reactions.map((r) => (
            <span
              key={r.id}
              className="animate-float-up absolute bottom-0 flex h-11 w-11 items-center justify-center rounded-full border border-[#FFB800]/50 bg-[#141418]/90 text-xl shadow-[0_0_16px_rgba(255,184,0,0.45)]"
              style={{ transform: `translateX(${r.offsetX}px)` }}
            >
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Bottom Overlay: Flowing Vertical Chat + Quick Reactions + Controls */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 z-20 space-y-3 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/85 to-transparent p-4 pb-safe"
        >
          <div className="flex items-end justify-between gap-3">
            <div
              ref={chatScrollRef}
              className="no-scrollbar max-h-40 flex-1 space-y-1.5 overflow-y-auto pr-2"
            >
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="animate-rise inline-flex max-w-full items-start gap-2 rounded-2xl border border-[#222228]/80 bg-[#141418]/80 px-2.5 py-1.5 text-xs backdrop-blur-md"
                >
                  <Avatar src={msg.avatar} name={msg.user} size={20} />
                  <p className="min-w-0 leading-snug text-foreground">
                    <span className="mr-1.5 font-semibold text-[#FFB800]">{msg.user}</span>
                    <span className="break-words">{msg.text}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Stream Likes Counter + Quick Tap Reactions */}
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <div className="flex items-center gap-1 rounded-full border border-[#222228] bg-[#141418]/85 px-2.5 py-1 text-[11px] font-bold tabular-nums text-[#FFB800] backdrop-blur-md">
                <Heart className="h-3.5 w-3.5 fill-[#FFB800]" />
                <span>{fmt(streamLikes)}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`React ${emoji}`}
                    onClick={() => spawnReaction(emoji, true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222228] bg-[#141418]/90 text-base backdrop-blur-md transition hover:border-[#FFB800] active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Comment Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChatComment();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              maxLength={140}
              placeholder={isHostBroadcast ? "Reply to your viewers..." : "Send a tap-in..."}
              className="min-h-[44px] flex-1 rounded-full border border-[#222228] bg-[#141418]/90 px-4 text-xs text-foreground outline-none backdrop-blur-md placeholder:text-muted-foreground focus:border-[#FFB800]"
            />
            <button
              type="submit"
              aria-label="Send live comment"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C] transition hover:brightness-110 active:scale-90"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Host Filter Swatch Carousel & Intensity Slider */}
          {isHostBroadcast && showFilters && (
            <div className="space-y-2 rounded-2xl border border-[#222228] bg-[#141418]/95 p-3 backdrop-blur-xl">
              {activeFilter.id !== "normal" && (
                <div className="flex items-center gap-2.5 px-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">Strength</span>
                  <input
                    type="range"
                    aria-label="Live filter intensity"
                    min={0}
                    max={100}
                    value={filterIntensity}
                    onChange={(e) => setFilterIntensity(Number(e.target.value))}
                    className="h-1 flex-1 accent-[#FFB800]"
                  />
                  <span className="w-8 text-right text-[10px] font-bold tabular-nums text-[#FFB800]">
                    {filterIntensity}%
                  </span>
                </div>
              )}
              <div className="no-scrollbar flex items-center gap-3 overflow-x-auto py-1">
                {STUDIO_FILTERS.map((f, idx) => {
                  const selected = idx === activeFilterIdx;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => selectLiveFilter(idx)}
                      className="flex shrink-0 flex-col items-center gap-1"
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${f.swatch} text-sm transition ${
                          selected
                            ? "scale-105 ring-2 ring-[#FFB800] ring-offset-2 ring-offset-[#141418]"
                            : "opacity-80 hover:opacity-100"
                        }`}
                      >
                        {f.emoji}
                      </span>
                      <span
                        className={`max-w-[60px] truncate text-[10px] font-semibold ${
                          selected ? "text-[#FFB800]" : "text-muted-foreground"
                        }`}
                      >
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Host Broadcast Controls: Mute Mic, Flip Camera, Filters, End LIVE */}
          {isHostBroadcast && (
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setMicMuted((m) => !m)}
                className={`flex min-h-[44px] items-center justify-center gap-1 rounded-2xl border px-2 text-[11px] font-semibold transition ${
                  micMuted
                    ? "border-[#222228] bg-[#141418] text-muted-foreground"
                    : "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C] glow"
                }`}
              >
                {micMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span>{micMuted ? "Muted" : "Mic"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFacingMode((m) => {
                    const next = m === "user" ? "environment" : "user";
                    toast(next === "user" ? "Front camera" : "Back camera");
                    return next;
                  });
                }}
                className="flex min-h-[44px] items-center justify-center gap-1 rounded-2xl border border-[#222228] bg-[#141418] px-2 text-[11px] font-semibold text-foreground transition hover:border-[#FFB800]"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#FFB800]" />
                <span>Flip</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                className={`flex min-h-[44px] items-center justify-center gap-1 rounded-2xl border px-2 text-[11px] font-semibold transition ${
                  showFilters || activeFilterIdx > 0
                    ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                    : "border-[#222228] bg-[#141418] text-foreground hover:border-[#FFB800]"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#FFB800]" />
                <span className="truncate">
                  {activeFilterIdx > 0 ? activeFilter.label : "Filters"}
                </span>
              </button>

              <button
                type="button"
                onClick={onLeave}
                className="flex min-h-[44px] items-center justify-center gap-1 rounded-2xl border border-red-500/50 bg-red-500/20 px-2 text-[11px] font-bold text-red-300 transition hover:bg-red-500/30"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>End LIVE</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LiveMiniPlayer({
  roomTitle,
  hostHandle,
  hostAvatar,
  hostName,
  listenerCount,
  streamMuted,
  onToggleMute,
  onExpand,
  onLeave,
}: {
  roomTitle?: string | undefined;
  hostHandle?: string | undefined;
  hostAvatar?: string | undefined;
  hostName?: string | undefined;
  listenerCount: number;
  streamMuted: boolean;
  onToggleMute: () => void;
  onExpand: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="fixed bottom-[74px] left-3 right-3 z-40 mx-auto max-w-md lg:bottom-4 lg:left-auto lg:right-6 lg:w-96">
      <div className="flex items-center gap-3 rounded-2xl border border-[#FFB800]/50 bg-[#141418]/95 p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <button
          type="button"
          onClick={onExpand}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="relative">
            <Avatar
              src={hostAvatar ?? LIVE_STREAMS[0]!.host.avatar}
              name={hostName ?? LIVE_STREAMS[0]!.host.name}
              handle={hostHandle ?? LIVE_STREAMS[0]!.host.handle}
              size={40}
              glowRing
            />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 ring-2 ring-[#141418]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-bold text-foreground">
                {roomTitle ?? LIVE_STREAMS[0]!.title}
              </p>
              <Waveform playing={!streamMuted} bars={6} className="h-3" />
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {hostHandle ?? LIVE_STREAMS[0]!.host.handle} · {fmt(listenerCount)} watching
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={streamMuted ? "Unmute live stream" : "Mute live stream"}
            onClick={onToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C] text-[#FFB800] hover:brightness-110"
          >
            {streamMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Expand live stream"
            onClick={onExpand}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C] text-foreground hover:text-[#FFB800]"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Leave live stream"
            onClick={onLeave}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C] text-muted-foreground hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
