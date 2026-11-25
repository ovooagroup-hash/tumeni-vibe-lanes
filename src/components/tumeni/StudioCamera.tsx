import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpFromLine,
  AtSign,
  Bookmark,
  Camera,
  Check,
  ChevronRight,
  Delete,
  Film,
  Globe,
  Hash,
  ImagePlus,
  Layers,
  Loader2,
  Lock,
  Music,
  Pause,
  Play,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Sun,
  Timer,
  Type,
  Upload,
  Users,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  FEELING_MOODS,
  POST_AUDIENCES,
  SOUND_CATEGORIES,
  STUDIO_FILTERS,
  TRENDING_SOUNDS,
  computeFilterCss,
  searchOnlineSongs,
  type Audience,
  type Kind,
  type SoundCategory,
  type SoundTrack,
  type StudioFilterOption,
  type User,
  type VideoOverlay,
  type VideoSticker,
} from "./data";
import { Avatar } from "./SharedUI";
import { saveMediaBlob } from "./storage";

export type StudioLaunchMode = "camera" | "status" | "gallery";

type RecordMode = "3m" | "60s" | "15s" | "photo";
type StudioStep = "capture" | "edit" | "review" | "status";
type CamStatus = "checking" | "live" | "studio";

type EffectOption = {
  id: string;
  label: string;
};

type ScenePreset = {
  id: string;
  label: string;
  top: string;
  mid: string;
  bot: string;
  glow: string;
};

type RecordedSegment = {
  id: string;
  url: string;
  storageKey?: string | undefined;
  durationSec: number;
};

const STUDIO_EFFECTS: EffectOption[] = [
  { id: "none", label: "Clean" },
  { id: "cinema", label: "Cinema 21:9" },
  { id: "goldframe", label: "Gold Frame" },
  { id: "vignette", label: "Spotlight" },
];

const SCENE_PRESETS: ScenePreset[] = [
  {
    id: "spotlight",
    label: "Spotlight",
    top: "#0A0A0C",
    mid: "#16161D",
    bot: "#0A0A0C",
    glow: "rgba(255, 184, 0, 0.24)",
  },
  {
    id: "sunset",
    label: "Sunset",
    top: "#1C1018",
    mid: "#2B1810",
    bot: "#0A0A0C",
    glow: "rgba(255, 130, 50, 0.28)",
  },
  {
    id: "midnight",
    label: "Midnight",
    top: "#090D16",
    mid: "#101B2E",
    bot: "#0A0A0C",
    glow: "rgba(56, 189, 248, 0.24)",
  },
  {
    id: "emerald",
    label: "Afterhours",
    top: "#091310",
    mid: "#11221B",
    bot: "#0A0A0C",
    glow: "rgba(52, 211, 153, 0.22)",
  },
];

const SPEEDS = [0.5, 1, 2] as const;
const TIMERS = [0, 3, 10] as const;
const QUICK_HASHTAGS = ["#tumeni", "#fyp", "#vibe", "#NightOut", "#Afrobeats", "#StudioVibes"];
const STICKER_PRESETS = ["🔥", "💯", "🎬", "🎧", "✨", "👑", "⚡", "😂", "NEW DROP", "LIVE VIBES"];
const TEXT_COLORS = ["#FFFFFF", "#FFB800", "#0A0A0C", "#EF4444", "#38BDF8"] as const;
const TEXT_STYLES: { id: VideoOverlay["style"]; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "gold", label: "Gold Box" },
  { id: "pill", label: "Dark Pill" },
  { id: "outline", label: "Shadow" },
];
const FALLBACK_SAMPLE_VIDEO = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4";

function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

export function VideoStageDecorations({
  effectId,
  overlays = [],
  stickers = [],
  compact = false,
  onClickOverlay,
  onClickSticker,
}: {
  effectId?: string | undefined;
  overlays?: VideoOverlay[] | undefined;
  stickers?: VideoSticker[] | undefined;
  compact?: boolean | undefined;
  onClickOverlay?: ((o: VideoOverlay) => void) | undefined;
  onClickSticker?: ((s: VideoSticker) => void) | undefined;
}) {
  return (
    <>
      {effectId === "cinema" && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[10%] bg-[#0A0A0C]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[10%] bg-[#0A0A0C]" />
        </>
      )}
      {effectId === "goldframe" && (
        <div className="pointer-events-none absolute inset-2 z-10 rounded-2xl border-2 border-[#FFB800]/75 shadow-[inset_0_0_24px_rgba(255,184,0,0.2)]" />
      )}
      {effectId === "vignette" && (
        <div className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_90px_rgba(0,0,0,0.85)]" />
      )}

      {overlays.map((ov) => {
        const posClass =
          ov.position === "top"
            ? "top-[16%]"
            : ov.position === "bottom"
              ? "bottom-[22%]"
              : "top-1/2 -translate-y-1/2";
        const styleClass =
          ov.style === "gold"
            ? "rounded-xl bg-[#FFB800] px-3 py-1.5 text-[#0A0A0C] shadow-lg"
            : ov.style === "pill"
              ? "rounded-xl bg-[#0A0A0C]/85 px-3.5 py-1.5 backdrop-blur-md border border-[#222228]"
              : ov.style === "outline"
                ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
                : "rounded-lg bg-[#0A0A0C]/45 px-2.5 py-1 backdrop-blur-[2px]";
        return (
          <div
            key={ov.id}
            className={`absolute inset-x-4 z-20 flex justify-center ${posClass} ${
              onClickOverlay ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            {onClickOverlay ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClickOverlay(ov);
                }}
                style={{ color: ov.style === "gold" ? "#0A0A0C" : ov.color }}
                className={`max-w-[90%] break-words text-center font-bold leading-snug transition active:scale-95 ${
                  compact ? "text-[11px]" : "text-lg"
                } ${styleClass}`}
              >
                {ov.text}
              </button>
            ) : (
              <span
                style={{ color: ov.style === "gold" ? "#0A0A0C" : ov.color }}
                className={`max-w-[90%] break-words text-center font-bold leading-snug ${
                  compact ? "text-[11px]" : "text-lg"
                } ${styleClass}`}
              >
                {ov.text}
              </span>
            )}
          </div>
        );
      })}

      {stickers.map((st) => (
        <div
          key={st.id}
          style={{ left: `${st.x}%`, top: `${st.y}%` }}
          className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 ${
            onClickSticker ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          {onClickSticker ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClickSticker(st);
              }}
              title="Tap to remove sticker"
              className={`rounded-full font-extrabold transition hover:scale-110 active:scale-90 ${
                st.label.length <= 2
                  ? compact
                    ? "text-xl"
                    : "text-4xl drop-shadow-lg"
                  : compact
                    ? "bg-[#FFB800] px-2 py-0.5 text-[9px] text-[#0A0A0C]"
                    : "border border-[#FFB800] bg-[#141418]/90 px-3 py-1 text-xs text-[#FFB800] shadow-lg backdrop-blur"
              }`}
            >
              {st.label}
            </button>
          ) : (
            <span
              className={`inline-block font-extrabold ${
                st.label.length <= 2
                  ? compact
                    ? "text-xl"
                    : "text-4xl drop-shadow-lg"
                  : compact
                    ? "rounded-full bg-[#FFB800] px-2 py-0.5 text-[9px] text-[#0A0A0C]"
                    : "rounded-full border border-[#FFB800] bg-[#141418]/90 px-3 py-1 text-xs text-[#FFB800] shadow-lg backdrop-blur"
              }`}
            >
              {st.label}
            </span>
          )}
        </div>
      ))}
    </>
  );
}

export function StudioCameraModal({
  launchMode = "camera",
  me,
  onClose,
  onPublish,
}: {
  launchMode?: StudioLaunchMode;
  me: User;
  onClose: () => void;
  onPublish: (p: {
    kind: Kind;
    audience: Audience;
    caption: string;
    tag?: string | undefined;
    track?: string | undefined;
    soundUrl?: string | undefined;
    soundYoutubeId?: string | undefined;
    media?: string | undefined;
    mediaStorageKey?: string | undefined;
    isVideo?: boolean | undefined;
    filterClass?: string | undefined;
    filterCss?: string | undefined;
    effectId?: string | undefined;
    playbackSpeed?: number | undefined;
    overlays?: VideoOverlay[] | undefined;
    stickers?: VideoSticker[] | undefined;
    mood?: string | undefined;
  }) => void;
}) {
  const [step, setStep] = useState<StudioStep>(launchMode === "status" ? "status" : "capture");
  const [recordMode, setRecordMode] = useState<RecordMode>("15s");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [camStatus, setCamStatus] = useState<CamStatus>("checking");
  const [camRetryKey, setCamRetryKey] = useState(0);
  const [micWarning, setMicWarning] = useState<string>("");
  const [showStageStarter, setShowStageStarter] = useState(true);

  // Creative TikTok Studio tools
  const [activeFilter, setActiveFilter] = useState<StudioFilterOption>(STUDIO_FILTERS[0]!);
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [swipeBadge, setSwipeBadge] = useState<StudioFilterOption | null>(null);
  const [activeEffect, setActiveEffect] = useState<EffectOption>(STUDIO_EFFECTS[0]!);
  const [activeScene, setActiveScene] = useState<ScenePreset>(SCENE_PRESETS[0]!);
  const [openToolPanel, setOpenToolPanel] = useState<
    null | "filters" | "effects" | "speed" | "scenes" | "stickers" | "mixer"
  >(null);
  const [countdownSec, setCountdownSec] = useState<(typeof TIMERS)[number]>(0);
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [flashOn, setFlashOn] = useState(false);

  // Text overlays & Stickers on the video
  const [overlays, setOverlays] = useState<VideoOverlay[]>([]);
  const [stickers, setStickers] = useState<VideoSticker[]>([]);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const [draftOverlayText, setDraftOverlayText] = useState("");
  const [draftOverlayStyle, setDraftOverlayStyle] = useState<VideoOverlay["style"]>("gold");
  const [draftOverlayColor, setDraftOverlayColor] = useState<string>("#FFFFFF");
  const [draftOverlayPos, setDraftOverlayPos] = useState<VideoOverlay["position"]>("center");

  // Real online Sound selector state (YouTube Music + Deezer + iTunes + Audius + Local Upload)
  const [soundDrawerOpen, setSoundDrawerOpen] = useState(false);
  const [soundCategory, setSoundCategory] = useState<SoundCategory>("Trending");
  const [soundQuery, setSoundQuery] = useState("");
  const [onlineTracks, setOnlineTracks] = useState<SoundTrack[]>([]);
  const [loadingSounds, setLoadingSounds] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundTrack | null>(null);
  const [previewSoundId, setPreviewSoundId] = useState<string | null>(null);
  const [originalVolume, setOriginalVolume] = useState(100);
  const [musicVolume, setMusicVolume] = useState(100);
  const soundAudioRef = useRef<HTMLAudioElement>(null);
  const reviewSoundRef = useRef<HTMLAudioElement>(null);
  const localAudioInputRef = useRef<HTMLInputElement>(null);

  // Recording / multi-clip / captured media state
  const [isRecording, setIsRecording] = useState(false);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [segments, setSegments] = useState<RecordedSegment[]>([]);
  const [capturedUrl, setCapturedUrl] = useState<string | undefined>();
  const [capturedStorageKey, setCapturedStorageKey] = useState<string | undefined>();
  const [capturedKind, setCapturedKind] = useState<"video" | "photo">("video");
  const [editPaused, setEditPaused] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [fullPreviewOpen, setFullPreviewOpen] = useState(false);

  // TikTok Post / Review details
  const [caption, setCaption] = useState("");
  const [hashtag, setHashtag] = useState("#tumeni #vibe");
  const [audience, setAudience] = useState<Audience>("public");
  const [selectedMood, setSelectedMood] = useState<string>("");

  const camVideoRef = useRef<HTMLVideoElement>(null);
  const studioCanvasRef = useRef<HTMLCanvasElement>(null);
  const editVideoRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const fullPreviewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const simRecordingRef = useRef(false);
  const recordStartSecRef = useRef(0);
  const nativeCamInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const swipeBadgeTimerRef = useRef<number | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const maxSeconds = recordMode === "3m" ? 180 : recordMode === "60s" ? 60 : 15;
  const hasLiveCam = camStatus === "live";
  const segmentsDuration = segments.reduce((acc, s) => acc + s.durationSec, 0);
  const totalElapsed = Math.min(maxSeconds, segmentsDuration + (isRecording ? recordElapsed : 0));
  const activeCssFilter = computeFilterCss(activeFilter, filterIntensity);

  // Keep latest creative overlays & filter in refs for live Studio Canvas recording
  const overlaysRef = useRef(overlays);
  const stickersRef = useRef(stickers);
  const sceneRef = useRef(activeScene);
  const effectRef = useRef(activeEffect);
  const filterCssRef = useRef(activeCssFilter);
  overlaysRef.current = overlays;
  stickersRef.current = stickers;
  sceneRef.current = activeScene;
  effectRef.current = activeEffect;
  filterCssRef.current = activeCssFilter;

  const selectFilter = useCallback((next: StudioFilterOption, showToastBadge = false) => {
    setActiveFilter(next);
    if (showToastBadge) {
      setSwipeBadge(next);
      if (swipeBadgeTimerRef.current) window.clearTimeout(swipeBadgeTimerRef.current);
      swipeBadgeTimerRef.current = window.setTimeout(() => {
        setSwipeBadge(null);
      }, 1200);
    }
  }, []);

  const cycleFilter = useCallback(
    (delta: 1 | -1) => {
      const idx = STUDIO_FILTERS.findIndex((f) => f.id === activeFilter.id);
      const nextIdx = ((idx < 0 ? 0 : idx) + delta + STUDIO_FILTERS.length) % STUDIO_FILTERS.length;
      selectFilter(STUDIO_FILTERS[nextIdx]!, true);
    },
    [activeFilter.id, selectFilter],
  );

  useEffect(() => {
    return () => {
      if (swipeBadgeTimerRef.current) window.clearTimeout(swipeBadgeTimerRef.current);
    };
  }, []);

  // Smart webcam request wrapped in strict try/catch
  useEffect(() => {
    if (step !== "capture") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }

    let cancelled = false;
    const initCamera = async () => {
      if (!streamRef.current) {
        setCamStatus("checking");
      }
      setMicWarning("");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCamStatus("studio");
          return;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());

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
            setMicWarning("Mic muted — video only");
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCamStatus("live");
        setShowStageStarter(false);
        if (camVideoRef.current) {
          camVideoRef.current.srcObject = stream;
          void camVideoRef.current.play().catch(() => {});
        }
      } catch {
        if (cancelled) return;
        streamRef.current = null;
        setCamStatus("studio");
      }
    };
    void initCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [step, facingMode, camRetryKey]);

  // Dedicated camera stream attachment effect (prevents blank/black mount race condition)
  useEffect(() => {
    const videoEl = camVideoRef.current;
    if (step === "capture" && camStatus === "live" && videoEl && streamRef.current) {
      if (videoEl.srcObject !== streamRef.current) {
        videoEl.srcObject = streamRef.current;
      }
      void videoEl.play().catch(() => {});
    }
  }, [step, camStatus, facingMode]);

  // Cinematic Video Studio Canvas (Zero audio visualizer bars — pure 9:16 Video Creator Stage)
  useEffect(() => {
    if (step !== "capture" || hasLiveCam) return;
    const canvas = studioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const scene = sceneRef.current;

      ctx.save();
      ctx.filter = filterCssRef.current;

      // Smooth cinematic gradient backdrop
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, scene.top);
      bg.addColorStop(0.5, scene.mid);
      bg.addColorStop(1, scene.bot);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Ambient cinema key-light sweep
      const orbX = w * (0.5 + Math.sin(t * 0.55) * 0.22);
      const orbY = h * (0.36 + Math.cos(t * 0.4) * 0.12);
      const orb = ctx.createRadialGradient(orbX, orbY, 16, orbX, orbY, w * 0.75);
      orb.addColorStop(0, scene.glow);
      orb.addColorStop(0.55, "rgba(255, 184, 0, 0.05)");
      orb.addColorStop(1, "rgba(10, 10, 12, 0)");
      ctx.fillStyle = orb;
      ctx.fillRect(0, 0, w, h);

      // Subtle camera rule-of-thirds viewfinder framing guides
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 3, 90);
      ctx.lineTo(w / 3, h - 180);
      ctx.moveTo((w * 2) / 3, 90);
      ctx.lineTo((w * 2) / 3, h - 180);
      ctx.moveTo(24, h * 0.34);
      ctx.lineTo(w - 24, h * 0.34);
      ctx.moveTo(24, h * 0.66);
      ctx.lineTo(w - 24, h * 0.66);
      ctx.stroke();

      // Viewfinder corner brackets
      ctx.strokeStyle = "rgba(255, 184, 0, 0.35)";
      ctx.lineWidth = 2;
      const b = 26;
      const m = 28;
      // top-left
      ctx.beginPath();
      ctx.moveTo(m, m + 70 + b);
      ctx.lineTo(m, m + 70);
      ctx.lineTo(m + b, m + 70);
      // top-right
      ctx.moveTo(w - m - b, m + 70);
      ctx.lineTo(w - m, m + 70);
      ctx.lineTo(w - m, m + 70 + b);
      // bottom-left
      ctx.moveTo(m, h - 190 - b);
      ctx.lineTo(m, h - 190);
      ctx.lineTo(m + b, h - 190);
      // bottom-right
      ctx.moveTo(w - m - b, h - 190);
      ctx.lineTo(w - m, h - 190);
      ctx.lineTo(w - m, h - 190 - b);
      ctx.stroke();

      // Bake visual effects into recorded stream when recording
      const fx = effectRef.current;
      if (fx.id === "cinema") {
        ctx.fillStyle = "#0A0A0C";
        ctx.fillRect(0, 0, w, h * 0.1);
        ctx.fillRect(0, h * 0.9, w, h * 0.1);
      } else if (fx.id === "goldframe") {
        ctx.strokeStyle = "rgba(255, 184, 0, 0.8)";
        ctx.lineWidth = 4;
        ctx.strokeRect(14, 14, w - 28, h - 28);
      }

      // Bake pinned text & stickers into canvas stream when recording on Studio Canvas
      if (isRecording) {
        for (const ov of overlaysRef.current) {
          const y =
            ov.position === "top" ? h * 0.2 : ov.position === "bottom" ? h * 0.74 : h * 0.48;
          ctx.font = "700 28px Outfit, system-ui, sans-serif";
          ctx.textAlign = "center";
          if (ov.style === "gold") {
            const tw = Math.min(w - 60, ctx.measureText(ov.text).width + 36);
            ctx.fillStyle = "#FFB800";
            ctx.beginPath();
            ctx.roundRect((w - tw) / 2, y - 26, tw, 44, 12);
            ctx.fill();
            ctx.fillStyle = "#0A0A0C";
          } else {
            ctx.fillStyle = ov.color;
          }
          ctx.fillText(ov.text, w / 2, y + 4);
        }
        for (const st of stickersRef.current) {
          ctx.font =
            st.label.length <= 2
              ? "700 44px Outfit, system-ui, sans-serif"
              : "700 18px Outfit, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#FFB800";
          ctx.fillText(st.label, (st.x / 100) * w, (st.y / 100) * h);
        }
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [step, hasLiveCam, isRecording]);

  // Apply rear torch constraint if supported
  useEffect(() => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack || facingMode !== "environment") return;
    try {
      void videoTrack.applyConstraints({
        advanced: [{ torch: flashOn } as MediaTrackConstraintSet],
      });
    } catch {
      /* Torch unsupported */
    }
  }, [flashOn, facingMode]);

  // Open gallery picker automatically if launched in gallery mode
  useEffect(() => {
    if (launchMode === "gallery") {
      const t = setTimeout(() => galleryInputRef.current?.click(), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [launchMode]);

  // Live multi-source song search (YouTube Music + Deezer + iTunes + Audius)
  useEffect(() => {
    if (!soundDrawerOpen) return;
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setLoadingSounds(true);
        void searchOnlineSongs(soundQuery, soundCategory, controller.signal)
          .then((tracks) => {
            if (!controller.signal.aborted) {
              setOnlineTracks(tracks);
            }
          })
          .finally(() => {
            if (!controller.signal.aborted) {
              setLoadingSounds(false);
            }
          });
      },
      soundQuery.trim() ? 300 : 50,
    );

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [soundDrawerOpen, soundQuery, soundCategory]);

  // Preview audio inside Sound Drawer (supports direct streams + YouTube Music fallback)
  useEffect(() => {
    const a = soundAudioRef.current;
    if (!a) return;
    const allTracks = [...onlineTracks, ...TRENDING_SOUNDS];
    const track = allTracks.find((s) => s.id === previewSoundId);
    if (!track || !track.url) {
      a.pause();
      return;
    }
    a.src = track.url;
    void a.play().catch(() => {});
  }, [previewSoundId, onlineTracks]);

  // Sync playback speed, volume mixer & selected song across Edit / Review / Full Preview
  useEffect(() => {
    const v =
      step === "edit"
        ? editVideoRef.current
        : fullPreviewOpen
          ? fullPreviewVideoRef.current
          : reviewVideoRef.current;
    const sa = reviewSoundRef.current;
    const isEditingOrReviewing = step === "edit" || step === "review";

    if (v) {
      v.playbackRate = speed;
      const shouldMuteVideo =
        previewMuted ||
        editPaused ||
        originalVolume === 0 ||
        (!!selectedSound && musicVolume > 70 && originalVolume < 30);
      v.muted = shouldMuteVideo;
      if (!shouldMuteVideo) {
        v.volume = Math.max(0, Math.min(1, originalVolume / 100));
      }
      if (step === "edit") {
        if (editPaused) v.pause();
        else void v.play().catch(() => {});
      }
    }

    if (
      sa &&
      isEditingOrReviewing &&
      (capturedKind === "video" || fullPreviewOpen || step === "edit") &&
      selectedSound?.url
    ) {
      if (sa.src !== selectedSound.url) sa.src = selectedSound.url;
      sa.muted = previewMuted || editPaused || musicVolume === 0;
      sa.volume = Math.max(0, Math.min(1, musicVolume / 100));
      if (!previewMuted && !editPaused && musicVolume > 0) {
        void sa.play().catch(() => {});
      } else {
        sa.pause();
      }
    } else if (sa) {
      sa.pause();
    }
  }, [
    speed,
    previewMuted,
    capturedUrl,
    step,
    capturedKind,
    selectedSound,
    fullPreviewOpen,
    editPaused,
    originalVolume,
    musicVolume,
  ]);

  const capturePhotoNow = useCallback(() => {
    const sourceEl: HTMLVideoElement | HTMLCanvasElement | null =
      hasLiveCam && camVideoRef.current && camVideoRef.current.videoWidth > 0
        ? camVideoRef.current
        : studioCanvasRef.current;

    if (!sourceEl) {
      nativeCamInputRef.current?.click();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width =
      sourceEl instanceof HTMLVideoElement ? sourceEl.videoWidth : sourceEl.width || 540;
    canvas.height =
      sourceEl instanceof HTMLVideoElement ? sourceEl.videoHeight : sourceEl.height || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    if (activeCssFilter !== "none") {
      ctx.filter = activeCssFilter;
    }
    if (sourceEl instanceof HTMLVideoElement && facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sourceEl, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        void saveMediaBlob(blob).then(({ url, storageKey }) => {
          setCapturedUrl(url);
          setCapturedStorageKey(storageKey);
          setCapturedKind("photo");
          setEditPaused(false);
          setStep("edit");
        });
      },
      "image/jpeg",
      0.92,
    );
  }, [hasLiveCam, activeCssFilter, facingMode]);

  const finishSegmentToCaptured = useCallback((seg: RecordedSegment) => {
    setCapturedUrl(seg.url);
    setCapturedStorageKey(seg.storageKey);
    setCapturedKind("video");
  }, []);

  const stopRecording = useCallback(
    (autoAdvance = false) => {
      setIsRecording(false);
      const elapsedSec = Math.max(0.5, Number(recordElapsed.toFixed(1)));
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: rec.mimeType || "video/webm",
          });
          if (blob.size === 0) {
            const fallbackSeg: RecordedSegment = {
              id: crypto.randomUUID(),
              url: FALLBACK_SAMPLE_VIDEO,
              durationSec: elapsedSec,
            };
            setSegments((prev) => [...prev, fallbackSeg]);
            finishSegmentToCaptured(fallbackSeg);
            if (autoAdvance) setStep("edit");
            return;
          }
          void saveMediaBlob(blob).then(({ url, storageKey }) => {
            const seg: RecordedSegment = {
              id: crypto.randomUUID(),
              url,
              storageKey,
              durationSec: elapsedSec,
            };
            setSegments((prev) => [...prev, seg]);
            finishSegmentToCaptured(seg);
            if (autoAdvance) {
              setEditPaused(false);
              setStep("edit");
            } else {
              toast.success("Clip added — tap ✓ to edit or record another");
            }
          });
        };
        rec.stop();
        recorderRef.current = null;
        return;
      }
      if (simRecordingRef.current) {
        simRecordingRef.current = false;
        const seg: RecordedSegment = {
          id: crypto.randomUUID(),
          url: FALLBACK_SAMPLE_VIDEO,
          durationSec: elapsedSec,
        };
        setSegments((prev) => [...prev, seg]);
        finishSegmentToCaptured(seg);
        if (autoAdvance) {
          setEditPaused(false);
          setStep("edit");
        } else {
          toast.success("Clip added — tap ✓ to edit");
        }
      }
    },
    [recordElapsed, finishSegmentToCaptured],
  );

  const beginRecordingNow = useCallback(() => {
    if (recordMode === "photo") {
      capturePhotoNow();
      return;
    }

    setShowStageStarter(false);
    setOpenToolPanel(null);

    let recordStream: MediaStream | null = hasLiveCam ? streamRef.current : null;
    if (!recordStream && studioCanvasRef.current) {
      const canvasEl = studioCanvasRef.current as HTMLCanvasElement & {
        captureStream?: (fps?: number) => MediaStream;
      };
      if (typeof canvasEl.captureStream === "function") {
        recordStream = canvasEl.captureStream(30);
      }
    }

    setRecordElapsed(0);
    recordStartSecRef.current = segmentsDuration;
    setIsRecording(true);
    chunksRef.current = [];

    if (!recordStream || typeof MediaRecorder === "undefined") {
      simRecordingRef.current = true;
      return;
    }

    try {
      const mimeType = pickRecorderMimeType();
      const rec = mimeType
        ? new MediaRecorder(recordStream, { mimeType })
        : new MediaRecorder(recordStream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = rec;
      rec.start(200);
    } catch {
      simRecordingRef.current = true;
    }
  }, [recordMode, capturePhotoNow, hasLiveCam, segmentsDuration]);

  // Recording elapsed progress
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordElapsed((prev) => {
        const next = Number((prev + 0.1).toFixed(1));
        if (recordStartSecRef.current + next >= maxSeconds) {
          stopRecording(true);
          return maxSeconds - recordStartSecRef.current;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording, maxSeconds, stopRecording]);

  // Countdown before recording
  useEffect(() => {
    if (countdownLeft === null) return;
    if (countdownLeft <= 0) {
      setCountdownLeft(null);
      beginRecordingNow();
      return;
    }
    const t = setTimeout(() => setCountdownLeft((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdownLeft, beginRecordingNow]);

  const handleRecordButton = () => {
    if (isRecording) {
      stopRecording(false);
      return;
    }
    if (countdownSec > 0 && recordMode !== "photo") {
      setCountdownLeft(countdownSec);
      return;
    }
    beginRecordingNow();
  };

  const handleUndoLastSegment = () => {
    if (segments.length === 0) return;
    const next = segments.slice(0, -1);
    setSegments(next);
    const last = next[next.length - 1];
    if (last) {
      finishSegmentToCaptured(last);
    } else {
      setCapturedUrl(undefined);
      setCapturedStorageKey(undefined);
    }
    toast("Removed last clip");
  };

  const handleFileSelected = (file: File) => {
    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");
    if (!isVid && !isImg) {
      toast.error("Select a video or photo from your device.");
      return;
    }
    void saveMediaBlob(file).then(({ url, storageKey }) => {
      setCapturedUrl(url);
      setCapturedStorageKey(storageKey);
      setCapturedKind(isVid ? "video" : "photo");
      setSegments(isVid ? [{ id: crypto.randomUUID(), url, storageKey, durationSec: 5 }] : []);
      setEditPaused(false);
      setStep("edit");
    });
  };

  const handleLocalAudioSelected = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an MP3, M4A, or WAV audio file.");
      return;
    }
    void saveMediaBlob(file).then(({ url }) => {
      const cleanName = file.name.replace(/\.[^.]+$/, "");
      const track: SoundTrack = {
        id: `local-${crypto.randomUUID()}`,
        title: cleanName || "Custom Beat",
        artist: me.name,
        category: "Trending",
        duration: "Custom",
        cover: TRENDING_SOUNDS[0]!.cover,
        url,
        source: "Device Audio",
      };
      setSelectedSound(track);
      setPreviewSoundId(null);
      setSoundDrawerOpen(false);
      toast.success(`Added audio: ${track.title}`);
    });
  };

  const openTextEditor = (existing?: VideoOverlay) => {
    if (existing) {
      setEditingOverlayId(existing.id);
      setDraftOverlayText(existing.text);
      setDraftOverlayStyle(existing.style);
      setDraftOverlayColor(existing.color);
      setDraftOverlayPos(existing.position);
    } else {
      setEditingOverlayId(null);
      setDraftOverlayText("");
      setDraftOverlayStyle("gold");
      setDraftOverlayColor("#FFFFFF");
      setDraftOverlayPos("center");
    }
    setTextModalOpen(true);
  };

  const saveOverlayText = () => {
    const trimmed = draftOverlayText.trim();
    if (!trimmed) {
      if (editingOverlayId) {
        setOverlays((prev) => prev.filter((o) => o.id !== editingOverlayId));
      }
      setTextModalOpen(false);
      return;
    }
    if (editingOverlayId) {
      setOverlays((prev) =>
        prev.map((o) =>
          o.id === editingOverlayId
            ? {
                ...o,
                text: trimmed,
                style: draftOverlayStyle,
                color: draftOverlayColor,
                position: draftOverlayPos,
              }
            : o,
        ),
      );
    } else {
      setOverlays((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: trimmed,
          style: draftOverlayStyle,
          color: draftOverlayColor,
          position: draftOverlayPos,
        },
      ]);
    }
    setTextModalOpen(false);
  };

  const addSticker = (label: string) => {
    const offset = (stickers.length % 4) * 7;
    setStickers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label,
        x: 32 + offset,
        y: 30 + ((stickers.length * 13) % 35),
      },
    ]);
    setOpenToolPanel(null);
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

  const publishCaptured = (targetAudience: Audience = audience) => {
    if (!capturedUrl) {
      toast.error("Record or upload a clip first");
      return;
    }
    const cleanedTag = hashtag
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");

    onPublish({
      kind: capturedKind,
      audience: targetAudience,
      caption: caption.trim() || (capturedKind === "video" ? "Fresh studio cut" : "Studio moment"),
      tag: cleanedTag || undefined,
      track: selectedSound
        ? `${selectedSound.title} — ${selectedSound.artist}`
        : capturedKind === "video"
          ? `Original Audio — ${me.handle}`
          : undefined,
      soundUrl: selectedSound?.url || undefined,
      soundYoutubeId: selectedSound?.youtubeId || undefined,
      media: capturedUrl,
      mediaStorageKey: capturedStorageKey,
      isVideo: capturedKind === "video" ? true : undefined,
      filterClass: filterIntensity >= 50 && activeFilter.css ? activeFilter.css : undefined,
      filterCss: activeCssFilter !== "none" ? activeCssFilter : undefined,
      effectId: activeEffect.id !== "none" ? activeEffect.id : undefined,
      playbackSpeed: speed !== 1 ? speed : undefined,
      overlays: overlays.length > 0 ? overlays : undefined,
      stickers: stickers.length > 0 ? stickers : undefined,
    });
  };

  const publishStatus = () => {
    if (!caption.trim() && !selectedMood) {
      toast.error("Write a thought or pick a mood first");
      return;
    }
    const cleanedTag = hashtag
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`))
      .join(" ");

    onPublish({
      kind: "text",
      audience,
      caption: caption.trim() || `Feeling ${selectedMood}`,
      tag: cleanedTag || undefined,
      mood: selectedMood || undefined,
    });
  };

  const progressPct = Math.min(100, (totalElapsed / maxSeconds) * 100);
  const ringCircumference = 2 * Math.PI * 36;

  // Combine live multi-source online songs with curated fallback real songs
  const soundNeedle = soundQuery.trim().toLowerCase();
  const curatedFallback = TRENDING_SOUNDS.filter((s) => {
    const matchesCat = soundNeedle ? true : s.category === soundCategory;
    const matchesQuery =
      !soundNeedle ||
      s.title.toLowerCase().includes(soundNeedle) ||
      s.artist.toLowerCase().includes(soundNeedle);
    return matchesCat && matchesQuery;
  });
  const displayTracks = onlineTracks.length > 0 ? onlineTracks : curatedFallback;

  const previewingTrack = [...onlineTracks, ...TRENDING_SOUNDS].find(
    (s) => s.id === previewSoundId,
  );
  const activeYoutubePreviewId =
    soundDrawerOpen && previewingTrack && !previewingTrack.url
      ? previewingTrack.youtubeId
      : undefined;
  const activeYoutubeEditId =
    (step === "edit" || step === "review") &&
    !previewMuted &&
    !editPaused &&
    musicVolume > 0 &&
    !selectedSound?.url
      ? selectedSound?.youtubeId
      : undefined;

  const nativeCameraInput = (
    <input
      ref={nativeCamInputRef}
      type="file"
      accept="video/*,image/*"
      capture={facingMode === "user" ? "user" : "environment"}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.currentTarget.value = "";
        if (f) handleFileSelected(f);
      }}
    />
  );

  const galleryPickerInput = (
    <input
      ref={galleryInputRef}
      type="file"
      accept="video/*,image/*"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.currentTarget.value = "";
        if (f) handleFileSelected(f);
      }}
    />
  );

  const localAudioInput = (
    <input
      ref={localAudioInputRef}
      type="file"
      accept="audio/*"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.currentTarget.value = "";
        if (f) handleLocalAudioSelected(f);
      }}
    />
  );

  // Inline TikTok Text Overlay Modal (usable in Capture & Edit)
  const textEditorModal = textModalOpen && (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-between bg-[#0A0A0C]/85 p-5 backdrop-blur-md"
      onClick={() => setTextModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex w-full max-w-md items-center justify-between"
      >
        {editingOverlayId ? (
          <button
            type="button"
            onClick={() => {
              setOverlays((prev) => prev.filter((o) => o.id !== editingOverlayId));
              setTextModalOpen(false);
            }}
            className="min-h-[40px] rounded-full border border-red-500/40 bg-red-500/15 px-4 text-xs font-semibold text-red-400"
          >
            Delete
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setTextModalOpen(false)}
            className="min-h-[40px] px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        )}

        <div className="flex items-center gap-1.5 rounded-full border border-[#222228] bg-[#141418] p-1">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setDraftOverlayPos(pos)}
              className={`min-h-[30px] rounded-full px-3 text-xs font-semibold capitalize transition ${
                draftOverlayPos === pos
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={saveOverlayText}
          className="min-h-[40px] rounded-full bg-[#FFB800] px-5 text-xs font-bold text-[#0A0A0C]"
        >
          Done
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4"
      >
        <input
          value={draftOverlayText}
          onChange={(e) => setDraftOverlayText(e.target.value)}
          maxLength={70}
          autoFocus
          placeholder="Type text for your video..."
          style={{ color: draftOverlayStyle === "gold" ? "#0A0A0C" : draftOverlayColor }}
          className={`w-full max-w-xs text-center text-2xl font-bold outline-none placeholder:text-muted-foreground ${
            draftOverlayStyle === "gold"
              ? "rounded-2xl bg-[#FFB800] px-4 py-2.5"
              : draftOverlayStyle === "pill"
                ? "rounded-2xl border border-[#222228] bg-[#141418] px-4 py-2.5"
                : "bg-transparent"
          }`}
        />
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto w-full max-w-md space-y-3 pb-safe"
      >
        <div className="flex justify-center gap-2">
          {TEXT_STYLES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setDraftOverlayStyle(st.id)}
              className={`min-h-[34px] rounded-full border px-3 text-xs font-semibold transition ${
                draftOverlayStyle === st.id
                  ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                  : "border-[#222228] bg-[#141418] text-foreground"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-3">
          {TEXT_COLORS.map((col) => (
            <button
              key={col}
              type="button"
              aria-label={`Color ${col}`}
              onClick={() => setDraftOverlayColor(col)}
              style={{ backgroundColor: col }}
              className={`h-8 w-8 rounded-full border-2 transition ${
                draftOverlayColor === col ? "scale-110 border-[#FFB800]" : "border-[#222228]"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Reusable Real Multi-Source Online Sound Picker Drawer (YouTube Music + Deezer + iTunes + Audius + Upload)
  const soundDrawer = soundDrawerOpen && (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-[#0A0A0C]/80 backdrop-blur-sm"
      onClick={() => {
        setPreviewSoundId(null);
        setSoundDrawerOpen(false);
      }}
    >
      {localAudioInput}
      {activeYoutubePreviewId && (
        <iframe
          key={activeYoutubePreviewId}
          title="YouTube Music Audio Preview"
          src={`https://www.youtube-nocookie.com/embed/${activeYoutubePreviewId}?autoplay=1&loop=1&playlist=${activeYoutubePreviewId}&controls=0`}
          allow="autoplay; encrypted-media"
          className="pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0"
        />
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-rise flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-[#222228] bg-[#141418] p-5 pb-safe"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground">Sounds</h3>
            <p className="text-[11px] text-muted-foreground">
              Search YouTube Music, global artists, or upload audio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => localAudioInputRef.current?.click()}
              className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#222228] bg-[#0A0A0C] px-3 text-xs font-semibold text-[#FFB800] transition hover:border-[#FFB800]"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>My Audio</span>
            </button>
            {selectedSound && (
              <button
                type="button"
                onClick={() => setSelectedSound(null)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              aria-label="Close sounds"
              onClick={() => {
                setPreviewSoundId(null);
                setSoundDrawerOpen(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <label className="mb-3 flex h-11 items-center gap-2 rounded-xl border border-[#222228] bg-[#0A0A0C] px-3 focus-within:border-[#FFB800]">
          <Search className="h-4 w-4 shrink-0 text-[#FFB800]" />
          <input
            value={soundQuery}
            onChange={(e) => setSoundQuery(e.target.value)}
            placeholder="Search any song or YouTube Music track..."
            className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          {soundQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSoundQuery("")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {loadingSounds && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#FFB800]" />}
        </label>

        <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {SOUND_CATEGORIES.map((cat) => {
            const active = soundCategory === cat && !soundNeedle;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSoundQuery("");
                  setSoundCategory(cat);
                }}
                className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition ${
                  active
                    ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                    : "border-[#222228] bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {displayTracks.length === 0 && !loadingSounds ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground">
                No matching songs found. Try another artist or upload your own audio file.
              </p>
              <button
                type="button"
                onClick={() => localAudioInputRef.current?.click()}
                className="mt-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[#FFB800]/50 bg-[#FFB800]/10 px-4 text-xs font-semibold text-[#FFB800]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Audio from Device</span>
              </button>
            </div>
          ) : (
            displayTracks.map((track) => {
              const isPreviewing = previewSoundId === track.id;
              const isSelected = selectedSound?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 transition ${
                    isSelected
                      ? "border-[#FFB800] bg-[#FFB800]/10"
                      : "border-[#222228] bg-[#0A0A0C]"
                  }`}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#222228] bg-[#141418]">
                    <img
                      src={track.cover || TRENDING_SOUNDS[0]!.cover}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={isPreviewing ? `Pause ${track.title}` : `Play ${track.title}`}
                      onClick={() =>
                        setPreviewSoundId((curr) => (curr === track.id ? null : track.id))
                      }
                      className="absolute inset-0 flex items-center justify-center bg-[#0A0A0C]/45 text-[#FFB800] transition hover:bg-[#0A0A0C]/65"
                    >
                      {isPreviewing ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="ml-0.5 h-5 w-5 fill-current" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSound(track);
                      setPreviewSoundId(null);
                      setSoundDrawerOpen(false);
                      toast.success(`Added sound: ${track.title} — ${track.artist}`);
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">{track.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artist} · <span className="tabular-nums">{track.duration}</span>
                      {track.source ? ` · ${track.source}` : ""}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSound(track);
                      setPreviewSoundId(null);
                      setSoundDrawerOpen(false);
                      toast.success(`Added sound: ${track.title} — ${track.artist}`);
                    }}
                    className={`flex min-h-[38px] shrink-0 items-center gap-1 rounded-full px-3.5 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-[#FFB800] text-[#0A0A0C]"
                        : "bg-[#FFB800]/15 text-[#FFB800] hover:bg-[#FFB800] hover:text-[#0A0A0C]"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                    <span>{isSelected ? "Added" : "Use"}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  // Step: Status / Feeling Drop Sheet
  if (step === "status") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C]/85 backdrop-blur-md sm:items-center"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="animate-rise w-full max-w-lg rounded-t-3xl border border-[#222228] bg-[#141418] p-5 pb-safe sm:rounded-3xl sm:pb-6"
        >
          {nativeCameraInput}
          {galleryPickerInput}

          <div className="mb-4 flex items-center justify-between border-b border-[#222228] pb-3">
            <h2 className="text-base font-bold text-foreground">Create Drop</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <Avatar src={me.avatar} name={me.name} handle={me.handle} size={44} ring />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {me.name}
                {selectedMood && (
                  <span className="ml-1.5 font-normal text-[#FFB800]">
                    — feeling {selectedMood}
                  </span>
                )}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                {POST_AUDIENCES.slice(0, 2).map((opt) => {
                  const Icon = opt.id === "friends" ? Users : Globe;
                  const active = audience === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAudience(opt.id)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
                        active
                          ? "border-[#FFB800]/60 bg-[#FFB800]/15 text-[#FFB800]"
                          : "border-[#222228] bg-[#0A0A0C] text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            maxLength={280}
            autoFocus
            placeholder={`What's on your mind, ${me.name.split(" ")[0] || me.name}?`}
            className="w-full resize-none rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[#FFB800]"
          />

          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Feeling / Vibe</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {FEELING_MOODS.map((m) => {
                const val = `${m.emoji} ${m.label}`;
                const active = selectedMood === val;
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setSelectedMood((curr) => (curr === val ? "" : val))}
                    className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition ${
                      active
                        ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                        : "border-[#222228] bg-[#0A0A0C] text-foreground hover:border-[#FFB800]/50"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStep("capture")}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[#222228] bg-[#0A0A0C] text-xs font-semibold text-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
            >
              <Video className="h-4 w-4 text-[#FFB800]" />
              <span>Video Studio</span>
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[#222228] bg-[#0A0A0C] text-xs font-semibold text-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
            >
              <ImagePlus className="h-4 w-4 text-[#FFB800]" />
              <span>Upload Media</span>
            </button>
          </div>

          <button
            type="button"
            onClick={publishStatus}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-[#FFB800] text-sm font-bold text-[#0A0A0C] glow transition hover:brightness-110"
          >
            Post Drop
          </button>
        </div>
      </div>
    );
  }

  // Step 2: TikTok Full-Screen Video Editor (Text Overlays, Stickers, Filters, Effects, Speed, Volume Mix)
  if (step === "edit") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0C]">
        <audio ref={soundAudioRef} loop preload="none" />
        <audio ref={reviewSoundRef} loop preload="none" />
        {nativeCameraInput}
        {galleryPickerInput}
        {activeYoutubeEditId && (
          <iframe
            key={activeYoutubeEditId}
            title="YouTube Music Edit Playback"
            src={`https://www.youtube-nocookie.com/embed/${activeYoutubeEditId}?autoplay=1&loop=1&playlist=${activeYoutubeEditId}&controls=0`}
            allow="autoplay; encrypted-media"
            className="pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0"
          />
        )}

        <div className="relative h-dvh w-full max-w-md overflow-hidden bg-[#121218] sm:aspect-[9/16] sm:h-[94dvh] sm:w-auto sm:rounded-3xl sm:border sm:border-[#222228]">
          {/* Video / Photo Canvas Preview (Swipe left/right to cycle filters) */}
          <div
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) swipeStartRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = swipeStartRef.current;
              const t = e.changedTouches[0];
              swipeStartRef.current = null;
              if (!start || !t) return;
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
                cycleFilter(dx < 0 ? 1 : -1);
              }
            }}
            onPointerDown={(e) => {
              if (e.pointerType === "mouse") {
                swipeStartRef.current = { x: e.clientX, y: e.clientY };
              }
            }}
            onPointerUp={(e) => {
              if (e.pointerType !== "mouse") return;
              const start = swipeStartRef.current;
              swipeStartRef.current = null;
              if (!start) return;
              const dx = e.clientX - start.x;
              const dy = e.clientY - start.y;
              if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
                cycleFilter(dx < 0 ? 1 : -1);
              }
            }}
            onClick={() => {
              setOpenToolPanel(null);
              if (capturedKind === "video") setEditPaused((p) => !p);
            }}
            className="relative h-full w-full cursor-pointer select-none"
          >
            {capturedKind === "video" && capturedUrl ? (
              <video
                ref={editVideoRef}
                src={capturedUrl}
                autoPlay
                loop
                playsInline
                style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                className="h-full w-full object-cover"
              />
            ) : capturedUrl ? (
              <img
                src={capturedUrl}
                alt="Edited drop"
                style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                className="h-full w-full object-cover"
              />
            ) : null}

            {activeFilter.overlay && (
              <div
                style={{ opacity: filterIntensity / 100 }}
                className={`pointer-events-none absolute inset-0 ${activeFilter.overlay}`}
              />
            )}

            <VideoStageDecorations
              effectId={activeEffect.id}
              overlays={overlays}
              stickers={stickers}
              onClickOverlay={openTextEditor}
              onClickSticker={(s) => {
                setStickers((prev) => prev.filter((item) => item.id !== s.id));
                toast("Sticker removed");
              }}
            />

            {swipeBadge && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FFB800]/50 bg-[#0A0A0C]/80 px-5 py-2 text-sm font-bold text-foreground shadow-[0_0_24px_rgba(255,184,0,0.35)] backdrop-blur-md">
                <span className="mr-1.5">{swipeBadge.emoji}</span>
                <span>{swipeBadge.label}</span>
              </div>
            )}

            {editPaused && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0A0A0C]/70 backdrop-blur-md">
                <Play className="ml-1 h-8 w-8 fill-foreground text-foreground" />
              </div>
            )}
          </div>

          {/* Top Bar: Back | Add Sound Pill | Volume Mix */}
          <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-4">
            <button
              type="button"
              aria-label="Back to camera"
              onClick={() => setStep("capture")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A0A0C]/65 text-foreground backdrop-blur-md transition hover:text-[#FFB800]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setSoundDrawerOpen(true)}
              className="flex h-10 max-w-[58%] items-center gap-2 overflow-hidden rounded-full border border-[#222228] bg-[#141418]/85 px-3.5 text-xs font-semibold text-foreground backdrop-blur-md transition hover:border-[#FFB800]"
            >
              <Music className="h-3.5 w-3.5 shrink-0 text-[#FFB800]" />
              <span className="truncate">
                {selectedSound ? `${selectedSound.title} · ${selectedSound.artist}` : "Add sound"}
              </span>
            </button>

            <button
              type="button"
              aria-label="Volume mixer"
              onClick={() => setOpenToolPanel((p) => (p === "mixer" ? null : "mixer"))}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full backdrop-blur-md transition ${
                openToolPanel === "mixer"
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "bg-[#0A0A0C]/65 text-foreground hover:text-[#FFB800]"
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </header>

          {/* Right-Side TikTok Editor Tool Rail */}
          <aside className="absolute right-3 top-20 z-30 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => openTextEditor()}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-foreground"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                  overlays.length > 0
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C]/70 text-foreground hover:text-[#FFB800]"
                }`}
              >
                <Type className="h-4 w-4" />
              </span>
              <span>Text</span>
            </button>

            <button
              type="button"
              onClick={() => setOpenToolPanel((p) => (p === "stickers" ? null : "stickers"))}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-foreground"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                  openToolPanel === "stickers" || stickers.length > 0
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C]/70 text-foreground hover:text-[#FFB800]"
                }`}
              >
                <Smile className="h-4 w-4" />
              </span>
              <span>Stickers</span>
            </button>

            <button
              type="button"
              onClick={() => setOpenToolPanel((p) => (p === "filters" ? null : "filters"))}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-foreground"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                  openToolPanel === "filters" || activeFilter.id !== "normal"
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C]/70 text-foreground hover:text-[#FFB800]"
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </span>
              <span>Filters</span>
            </button>

            <button
              type="button"
              onClick={() => setOpenToolPanel((p) => (p === "effects" ? null : "effects"))}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-foreground"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                  openToolPanel === "effects" || activeEffect.id !== "none"
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C]/70 text-foreground hover:text-[#FFB800]"
                }`}
              >
                <Layers className="h-4 w-4" />
              </span>
              <span>Effects</span>
            </button>

            <button
              type="button"
              onClick={() => setOpenToolPanel((p) => (p === "speed" ? null : "speed"))}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-foreground"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                  openToolPanel === "speed" || speed !== 1
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C]/70 text-foreground hover:text-[#FFB800]"
                }`}
              >
                <Zap className="h-4 w-4" />
              </span>
              <span>{speed === 1 ? "Speed" : `${speed}x`}</span>
            </button>
          </aside>

          {/* Contextual Editor Popovers */}
          {openToolPanel === "stickers" && (
            <div className="no-scrollbar absolute inset-x-4 bottom-24 z-30 flex gap-2 overflow-x-auto rounded-2xl border border-[#222228] bg-[#141418]/95 p-2.5 backdrop-blur-xl">
              {STICKER_PRESETS.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => addSticker(st)}
                  className="min-h-[40px] shrink-0 whitespace-nowrap rounded-xl border border-[#222228] bg-[#0A0A0C] px-3 text-sm font-semibold text-foreground transition hover:border-[#FFB800]"
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {openToolPanel === "filters" && (
            <div className="absolute inset-x-4 bottom-24 z-30 space-y-2.5 rounded-2xl border border-[#222228] bg-[#141418]/95 p-3 backdrop-blur-xl">
              {activeFilter.id !== "normal" && (
                <div className="flex items-center gap-3 px-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">Intensity</span>
                  <input
                    type="range"
                    aria-label="Filter intensity"
                    min={0}
                    max={100}
                    value={filterIntensity}
                    onChange={(e) => setFilterIntensity(Number(e.target.value))}
                    className="h-1.5 flex-1 accent-[#FFB800]"
                  />
                  <span className="w-9 text-right text-[11px] font-bold tabular-nums text-[#FFB800]">
                    {filterIntensity}%
                  </span>
                </div>
              )}
              <div className="no-scrollbar flex gap-3 overflow-x-auto py-1">
                {STUDIO_FILTERS.map((f) => {
                  const selected = activeFilter.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => selectFilter(f)}
                      className="flex shrink-0 flex-col items-center gap-1"
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${f.swatch} text-base transition ${
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

          {openToolPanel === "effects" && (
            <div className="no-scrollbar absolute inset-x-4 bottom-24 z-30 flex gap-2 overflow-x-auto rounded-2xl border border-[#222228] bg-[#141418]/95 p-2.5 backdrop-blur-xl">
              {STUDIO_EFFECTS.map((fx) => (
                <button
                  key={fx.id}
                  type="button"
                  onClick={() => setActiveEffect(fx)}
                  className={`min-h-[38px] shrink-0 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition ${
                    activeEffect.id === fx.id
                      ? "bg-[#FFB800] text-[#0A0A0C]"
                      : "bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fx.label}
                </button>
              ))}
            </div>
          )}

          {openToolPanel === "speed" && (
            <div className="absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#222228] bg-[#141418]/95 p-1.5 backdrop-blur-xl">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSpeed(s);
                    setOpenToolPanel(null);
                  }}
                  className={`min-h-[36px] rounded-full px-3.5 text-xs font-semibold transition ${
                    speed === s
                      ? "bg-[#FFB800] text-[#0A0A0C]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}

          {openToolPanel === "mixer" && (
            <div className="absolute inset-x-4 bottom-24 z-30 space-y-3 rounded-2xl border border-[#222228] bg-[#141418]/95 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Original Sound</span>
                <span className="tabular-nums text-[#FFB800]">{originalVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={originalVolume}
                onChange={(e) => setOriginalVolume(Number(e.target.value))}
                className="w-full accent-[#FFB800]"
              />
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Added Song</span>
                <span className="tabular-nums text-[#FFB800]">{musicVolume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="w-full accent-[#FFB800]"
              />
            </div>
          )}

          {/* Bottom TikTok Editor Bar: Replace | Next -> */}
          <div className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/90 to-transparent px-4 pb-safe pt-6">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#222228] bg-[#141418]/90 text-xs font-semibold text-foreground backdrop-blur transition hover:border-[#FFB800]"
            >
              <ImagePlus className="h-4 w-4 text-[#FFB800]" />
              <span>Change clip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenToolPanel(null);
                setStep("review");
              }}
              className="flex h-12 flex-[1.3] items-center justify-center gap-2 rounded-xl bg-[#FFB800] text-sm font-bold text-[#0A0A0C] glow transition hover:brightness-110 active:scale-[0.98]"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {textEditorModal}
        {soundDrawer}
      </div>
    );
  }

  // Step 3: TikTok-Style Post / Upload Screen
  if (step === "review") {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C] sm:items-center sm:bg-[#0A0A0C]/90 sm:backdrop-blur-md">
        <audio ref={soundAudioRef} loop preload="none" />
        <audio ref={reviewSoundRef} loop preload="none" />
        {nativeCameraInput}
        {galleryPickerInput}
        {activeYoutubeEditId && (
          <iframe
            key={activeYoutubeEditId}
            title="YouTube Music Post Playback"
            src={`https://www.youtube-nocookie.com/embed/${activeYoutubeEditId}?autoplay=1&loop=1&playlist=${activeYoutubeEditId}&controls=0`}
            allow="autoplay; encrypted-media"
            className="pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0"
          />
        )}

        <div className="animate-rise flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#0A0A0C] sm:h-[92dvh] sm:rounded-3xl sm:border sm:border-[#222228] sm:bg-[#141418]">
          <header className="flex items-center justify-between border-b border-[#222228] px-4 py-3">
            <button
              type="button"
              aria-label="Back to video editor"
              onClick={() => setStep("edit")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-[#141418] hover:text-[#FFB800]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-base font-bold text-foreground">Post</h2>
            <button
              type="button"
              aria-label="Close studio"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-[#141418] hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto">
            {/* Signature TikTok Split Row: Left Caption/Tags + Right 9:16 Video Cover */}
            <div className="flex gap-3 p-4">
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  maxLength={280}
                  placeholder="Describe your video, add hashtags, or tag friends..."
                  className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleQuickTag("#tumeni")}
                    className="inline-flex min-h-[30px] items-center gap-1 rounded-md border border-[#222228] bg-[#141418] px-2.5 text-xs font-semibold text-foreground hover:border-[#FFB800]"
                  >
                    <Hash className="h-3 w-3 text-[#FFB800]" />
                    <span>Hashtags</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCaption((c) => (c.includes("@") ? c : `${c}${c ? " " : ""}@`))
                    }
                    className="inline-flex min-h-[30px] items-center gap-1 rounded-md border border-[#222228] bg-[#141418] px-2.5 text-xs font-semibold text-foreground hover:border-[#FFB800]"
                  >
                    <AtSign className="h-3 w-3 text-[#FFB800]" />
                    <span>Mention</span>
                  </button>
                </div>
              </div>

              {/* Right 9:16 Preview Thumbnail */}
              <div className="relative aspect-[9/16] w-28 shrink-0 overflow-hidden rounded-xl border border-[#222228] bg-[#141418]">
                <button
                  type="button"
                  onClick={() => setFullPreviewOpen(true)}
                  aria-label="Preview full video"
                  className="relative h-full w-full"
                >
                  {capturedKind === "video" && capturedUrl ? (
                    <video
                      ref={reviewVideoRef}
                      src={capturedUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                      className="h-full w-full object-cover"
                    />
                  ) : capturedUrl ? (
                    <img
                      src={capturedUrl}
                      alt="Post preview"
                      style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  {activeFilter.overlay && (
                    <div
                      style={{ opacity: filterIntensity / 100 }}
                      className={`pointer-events-none absolute inset-0 ${activeFilter.overlay}`}
                    />
                  )}
                  <VideoStageDecorations
                    effectId={activeEffect.id}
                    overlays={overlays}
                    stickers={stickers}
                    compact
                  />
                  <span className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-1 bg-[#0A0A0C]/75 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur-sm">
                    <Play className="h-3 w-3 fill-[#FFB800] text-[#FFB800]" />
                    <span>Preview</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Hashtag Input + Quick Chips */}
            <div className="space-y-2 px-4 pb-4">
              <label className="flex items-center gap-2 rounded-xl border border-[#222228] bg-[#141418] px-3 focus-within:border-[#FFB800] sm:bg-[#0A0A0C]">
                <Hash className="h-4 w-4 shrink-0 text-[#FFB800]" />
                <input
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="Add hashtags (#tumeni #vibe)"
                  className="min-h-[40px] w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
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
                      className={`min-h-[30px] shrink-0 whitespace-nowrap rounded-full border px-3 text-[11px] font-medium transition ${
                        active
                          ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                          : "border-[#222228] bg-[#141418] text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clean TikTok Settings Rows */}
            <div className="divide-y divide-[#222228] border-y border-[#222228]">
              <button
                type="button"
                onClick={() => setSoundDrawerOpen(true)}
                className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#141418]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {selectedSound ? (
                    <img
                      src={selectedSound.cover || TRENDING_SOUNDS[0]!.cover}
                      alt={selectedSound.title}
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 shrink-0 rounded-lg border border-[#222228] object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#222228] bg-[#141418] text-[#FFB800]">
                      <Music className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedSound ? selectedSound.title : "Add sound"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedSound
                        ? `${selectedSound.artist} · Sound attached`
                        : "Search YouTube Music or global songs"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => setStep("edit")}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#141418]"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-[#FFB800]" />
                  <span className="text-sm font-medium text-foreground">
                    Edit text, stickers &amp; effects
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="space-y-2.5 px-4 py-3.5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Globe className="h-4 w-4 text-[#FFB800]" />
                  <span>Who can view this post</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {POST_AUDIENCES.map((opt) => {
                    const Icon = opt.id === "private" ? Lock : opt.id === "friends" ? Users : Globe;
                    const active = audience === opt.id;
                    const label =
                      opt.id === "public"
                        ? "Everyone"
                        : opt.id === "friends"
                          ? "Friends"
                          : "Only you";
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAudience(opt.id)}
                        className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition ${
                          active
                            ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                            : "border-[#222228] bg-[#141418] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1.4fr] gap-2.5 border-t border-[#222228] bg-[#0A0A0C] p-4 pb-safe sm:bg-[#141418] sm:pb-5">
            <button
              type="button"
              onClick={() => publishCaptured("private")}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#222228] bg-[#141418] text-sm font-semibold text-foreground transition hover:border-[#FFB800] sm:bg-[#0A0A0C]"
            >
              <Bookmark className="h-4 w-4 text-[#FFB800]" />
              <span>Drafts</span>
            </button>
            <button
              type="button"
              onClick={() => publishCaptured(audience)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#FFB800] text-sm font-bold text-[#0A0A0C] glow transition hover:brightness-110 active:scale-[0.98]"
            >
              <ArrowUpFromLine className="h-4 w-4" />
              <span>Post</span>
            </button>
          </div>
        </div>

        {/* Full-Screen 9:16 Video Preview Modal */}
        {fullPreviewOpen && (
          <div
            className="fixed inset-0 z-[55] flex items-center justify-center bg-[#0A0A0C]/95 p-4"
            onClick={() => setFullPreviewOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative aspect-[9/16] h-[86dvh] max-w-md overflow-hidden rounded-3xl border border-[#222228] bg-[#0A0A0C]"
            >
              {capturedKind === "video" && capturedUrl ? (
                <video
                  ref={fullPreviewVideoRef}
                  src={capturedUrl}
                  autoPlay
                  loop
                  muted={previewMuted || !!selectedSound}
                  playsInline
                  style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                  className="h-full w-full object-cover"
                />
              ) : capturedUrl ? (
                <img
                  src={capturedUrl}
                  alt="Full preview"
                  style={{ filter: activeCssFilter !== "none" ? activeCssFilter : undefined }}
                  className="h-full w-full object-cover"
                />
              ) : null}
              {activeFilter.overlay && (
                <div
                  style={{ opacity: filterIntensity / 100 }}
                  className={`pointer-events-none absolute inset-0 ${activeFilter.overlay}`}
                />
              )}
              <VideoStageDecorations
                effectId={activeEffect.id}
                overlays={overlays}
                stickers={stickers}
              />
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
                <button
                  type="button"
                  onClick={() => setFullPreviewOpen(false)}
                  aria-label="Close preview"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C]/75 text-foreground backdrop-blur-md"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMuted((m) => !m)}
                  aria-label={previewMuted ? "Unmute" : "Mute"}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C]/75 text-foreground backdrop-blur-md"
                >
                  {previewMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-[#FFB800]" />
                  )}
                </button>
              </div>
              {selectedSound && (
                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 rounded-full bg-[#0A0A0C]/80 px-3.5 py-2 text-xs text-foreground backdrop-blur-md">
                  <Music className="h-4 w-4 shrink-0 text-[#FFB800]" />
                  <span className="truncate">
                    {selectedSound.title} — {selectedSound.artist}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {soundDrawer}
      </div>
    );
  }

  // Step 1: Full-Bleed TikTok Video Camera & Creator Studio (Zero Audio Visualizer Bars)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0C]">
      <audio ref={soundAudioRef} loop preload="none" />
      {nativeCameraInput}
      {galleryPickerInput}

      <div
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (t) swipeStartRef.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = swipeStartRef.current;
          const t = e.changedTouches[0];
          swipeStartRef.current = null;
          if (!start || !t) return;
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            cycleFilter(dx < 0 ? 1 : -1);
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") {
            swipeStartRef.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") return;
          const start = swipeStartRef.current;
          swipeStartRef.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            cycleFilter(dx < 0 ? 1 : -1);
          }
        }}
        className="relative h-dvh w-full max-w-md select-none overflow-hidden bg-[#121218] sm:aspect-[9/16] sm:h-[94dvh] sm:w-auto sm:rounded-3xl sm:border sm:border-[#222228]"
      >
        {/* Full-Screen Live Camera OR Video Creator Studio Canvas */}
        {hasLiveCam ? (
          <video
            ref={camVideoRef}
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
        ) : (
          <canvas
            ref={studioCanvasRef}
            width={540}
            height={960}
            className="h-full w-full object-cover"
          />
        )}

        {activeFilter.overlay && (
          <div
            style={{ opacity: filterIntensity / 100 }}
            className={`pointer-events-none absolute inset-0 ${activeFilter.overlay}`}
          />
        )}

        <VideoStageDecorations
          effectId={activeEffect.id}
          overlays={overlays}
          stickers={stickers}
          onClickOverlay={openTextEditor}
          onClickSticker={(s) => setStickers((prev) => prev.filter((item) => item.id !== s.id))}
        />

        {swipeBadge && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#FFB800]/50 bg-[#0A0A0C]/80 px-5 py-2 text-sm font-bold text-foreground shadow-[0_0_24px_rgba(255,184,0,0.35)] backdrop-blur-md">
            <span className="mr-1.5">{swipeBadge.emoji}</span>
            <span>{swipeBadge.label}</span>
          </div>
        )}

        {flashOn && (
          <div className="pointer-events-none absolute inset-0 z-20 border-[14px] border-[#FFF3D1]/75 bg-[#FFF8E6]/15 shadow-[inset_0_0_95px_rgba(255,235,175,0.6)]" />
        )}

        {/* TikTok Multi-Clip Segmented Progress Bar */}
        <div className="absolute inset-x-3 top-2 z-30 flex h-1.5 gap-1 overflow-hidden rounded-full bg-white/20">
          {segments.map((seg) => (
            <div
              key={seg.id}
              style={{ width: `${Math.min(100, (seg.durationSec / maxSeconds) * 100)}%` }}
              className="h-full bg-[#FFB800]"
            />
          ))}
          {isRecording && (
            <div
              style={{ width: `${Math.min(100, (recordElapsed / maxSeconds) * 100)}%` }}
              className="h-full bg-red-500"
            />
          )}
        </div>

        {/* Camera Fallback Quick-Start Overlay (Clear Video Creation Options, Non-Blocking) */}
        {!hasLiveCam &&
          camStatus !== "checking" &&
          showStageStarter &&
          !isRecording &&
          segments.length === 0 && (
            <div className="pointer-events-none absolute inset-x-12 bottom-64 top-20 z-20 flex items-center justify-center">
              <div className="pointer-events-auto w-full rounded-3xl border border-[#222228] bg-[#141418]/90 p-4 text-center shadow-2xl backdrop-blur-xl">
                <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFB800]/15 text-[#FFB800]">
                  <Video className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Create Your Video</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Shoot with your phone camera, pick from gallery, or record on this studio stage.
                </p>
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => nativeCamInputRef.current?.click()}
                    className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#FFB800] text-xs font-bold text-[#0A0A0C] transition hover:brightness-110"
                  >
                    <Camera className="h-4 w-4" />
                    <span>Open Phone Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-[#222228] bg-[#0A0A0C] text-xs font-semibold text-foreground transition hover:border-[#FFB800]"
                  >
                    <ImagePlus className="h-4 w-4 text-[#FFB800]" />
                    <span>Pick from Gallery</span>
                  </button>
                  <div className="flex items-center justify-center gap-3 pt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCamRetryKey((k) => k + 1)}
                      className="font-medium text-[#FFB800] hover:underline"
                    >
                      Retry Webcam
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => setShowStageStarter(false)}
                      className="font-medium text-muted-foreground hover:text-foreground"
                    >
                      Use Studio Stage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {hasLiveCam && micWarning && (
          <div className="pointer-events-none absolute inset-x-16 top-16 z-20 rounded-full border border-[#FFB800]/30 bg-[#141418]/85 px-3 py-1 text-center text-[11px] text-[#FFB800] backdrop-blur-md">
            {micWarning}
          </div>
        )}

        {countdownLeft !== null && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#0A0A0C]/45 backdrop-blur-[2px]">
            <span className="animate-bounce text-8xl font-extrabold text-[#FFB800] drop-shadow-[0_0_24px_rgba(255,184,0,0.7)]">
              {countdownLeft}
            </span>
          </div>
        )}

        {/* TikTok Top Bar */}
        <header className="absolute inset-x-0 top-3 z-20 flex items-center justify-between gap-2 px-4 pt-2">
          <button
            type="button"
            aria-label="Close studio"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A0A0C]/65 text-foreground backdrop-blur-md transition hover:text-[#FFB800]"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setSoundDrawerOpen(true)}
            className="flex h-10 max-w-[56%] items-center gap-2 overflow-hidden rounded-full border border-[#222228] bg-[#141418]/85 px-4 text-xs font-semibold text-foreground backdrop-blur-md transition hover:border-[#FFB800]"
          >
            <Music className="h-3.5 w-3.5 shrink-0 text-[#FFB800]" />
            <span className="truncate">
              {selectedSound ? `${selectedSound.title} · ${selectedSound.artist}` : "Add sound"}
            </span>
          </button>

          <button
            type="button"
            aria-label="Open phone camera"
            onClick={() => nativeCamInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0A0A0C]/65 text-[#FFB800] backdrop-blur-md transition hover:bg-[#141418]"
          >
            <Camera className="h-5 w-5" />
          </button>
        </header>

        {isRecording && (
          <div className="absolute left-1/2 top-16 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-red-500/40 bg-[#0A0A0C]/80 px-3 py-1 text-xs font-semibold tabular-nums text-foreground backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            <span>
              {totalElapsed.toFixed(1)}s / {maxSeconds === 180 ? "3m" : `${maxSeconds}s`}
            </span>
          </div>
        )}

        {/* Right-Side TikTok Tool Rail */}
        <aside className="absolute right-3 top-20 z-20 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setFacingMode((m) => {
                const next = m === "user" ? "environment" : "user";
                toast(next === "user" ? "Front camera" : "Back camera");
                return next;
              });
            }}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-foreground"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A0A0C]/65 backdrop-blur-md transition hover:text-[#FFB800]">
              <RefreshCw className="h-4 w-4" />
            </span>
            <span>Flip</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenToolPanel((p) => (p === "speed" ? null : "speed"))}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-foreground"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                speed !== 1 || openToolPanel === "speed"
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "bg-[#0A0A0C]/65 text-foreground hover:text-[#FFB800]"
              }`}
            >
              <Zap className="h-4 w-4" />
            </span>
            <span>Speed</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenToolPanel((p) => (p === "filters" ? null : "filters"))}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-foreground"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                activeFilter.id !== "normal" || openToolPanel === "filters"
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "bg-[#0A0A0C]/65 text-foreground hover:text-[#FFB800]"
              }`}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={() => setOpenToolPanel((p) => (p === "effects" ? null : "effects"))}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-foreground"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                activeEffect.id !== "none" || openToolPanel === "effects"
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "bg-[#0A0A0C]/65 text-foreground hover:text-[#FFB800]"
              }`}
            >
              <Layers className="h-4 w-4" />
            </span>
            <span>Effects</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowStageStarter(false);
              openTextEditor();
            }}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-foreground"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                overlays.length > 0
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "bg-[#0A0A0C]/65 text-foreground hover:text-[#FFB800]"
              }`}
            >
              <Type className="h-4 w-4" />
            </span>
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextIdx = (TIMERS.indexOf(countdownSec) + 1) % TIMERS.length;
              const next = TIMERS[nextIdx] ?? 0;
              setCountdownSec(next);
              toast(next === 0 ? "Timer off" : `Timer ${next}s`);
            }}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-foreground"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                countdownSec > 0
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "bg-[#0A0A0C]/65 text-foreground hover:text-[#FFB800]"
              }`}
            >
              <Timer className="h-4 w-4" />
            </span>
            <span>{countdownSec > 0 ? `${countdownSec}s` : "Timer"}</span>
          </button>

          <button
            type="button"
            onClick={() => setFlashOn((f) => !f)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-foreground"
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                flashOn
                  ? "bg-[#FFB800] text-[#0A0A0C]"
                  : "bg-[#0A0A0C]/65 text-foreground hover:text-[#FFB800]"
              }`}
            >
              <Sun className="h-4 w-4" />
            </span>
            <span>Flash</span>
          </button>
        </aside>

        {/* Contextual Capture Tool Drawers */}
        {openToolPanel === "speed" && (
          <div className="absolute bottom-60 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#222228] bg-[#141418]/90 p-1.5 backdrop-blur-xl">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSpeed(s);
                  setOpenToolPanel(null);
                }}
                className={`min-h-[36px] rounded-full px-3.5 text-xs font-semibold transition ${
                  speed === s
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}

        {openToolPanel === "effects" && (
          <div className="no-scrollbar absolute inset-x-4 bottom-60 z-20 flex gap-2 overflow-x-auto rounded-2xl border border-[#222228] bg-[#141418]/90 p-2 backdrop-blur-xl">
            {STUDIO_EFFECTS.map((fx) => (
              <button
                key={fx.id}
                type="button"
                onClick={() => setActiveEffect(fx)}
                className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition ${
                  activeEffect.id === fx.id
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                }`}
              >
                {fx.label}
              </button>
            ))}
          </div>
        )}

        {openToolPanel === "scenes" && (
          <div className="no-scrollbar absolute inset-x-4 bottom-60 z-20 flex gap-2 overflow-x-auto rounded-2xl border border-[#222228] bg-[#141418]/90 p-2 backdrop-blur-xl">
            {SCENE_PRESETS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setActiveScene(sc);
                  setShowStageStarter(false);
                }}
                className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-xl px-3.5 text-xs font-semibold transition ${
                  activeScene.id === sc.id
                    ? "bg-[#FFB800] text-[#0A0A0C]"
                    : "bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                }`}
              >
                {sc.label}
              </button>
            ))}
          </div>
        )}

        {/* TikTok Bottom Shutter Deck with Circular Filter Carousel & Intensity Slider */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/85 to-transparent px-4 pb-safe pt-6">
          {!isRecording && (
            <div className="mb-3 space-y-2">
              {(activeFilter.id !== "normal" || openToolPanel === "filters") && (
                <div className="mx-auto flex max-w-xs items-center gap-2.5 rounded-full border border-[#222228] bg-[#141418]/85 px-3 py-1.5 backdrop-blur-md">
                  <span className="text-[10px] font-semibold text-muted-foreground">Strength</span>
                  <input
                    type="range"
                    aria-label="Filter intensity"
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

              <div className="no-scrollbar flex items-center gap-3 overflow-x-auto px-1 py-1">
                {STUDIO_FILTERS.map((f) => {
                  const selected = activeFilter.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => selectFilter(f)}
                      className="flex shrink-0 flex-col items-center gap-1"
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${f.swatch} text-sm transition ${
                          selected
                            ? "scale-105 ring-2 ring-[#FFB800] ring-offset-2 ring-offset-[#0A0A0C]"
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

          <div className="mb-3 flex items-center justify-center gap-2">
            {(
              [
                ["3m", "3m"],
                ["60s", "60s"],
                ["15s", "15s"],
                ["photo", "Photo"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                disabled={isRecording}
                onClick={() => setRecordMode(id)}
                className={`min-h-[32px] rounded-full px-3 text-xs font-semibold transition ${
                  recordMode === id
                    ? "bg-foreground text-[#0A0A0C]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-around gap-3">
            {/* Left: Scene Backdrop or Undo Last Clip */}
            {segments.length > 0 && !isRecording ? (
              <button
                type="button"
                onClick={handleUndoLastSegment}
                className="flex min-w-[60px] flex-col items-center gap-1 text-[11px] font-medium text-foreground"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#222228] bg-[#141418]/90 text-foreground backdrop-blur-md transition hover:border-[#FFB800]">
                  <Delete className="h-5 w-5" />
                </span>
                <span>Undo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpenToolPanel((p) => (p === "scenes" ? null : "scenes"))}
                className="flex min-w-[60px] flex-col items-center gap-1 text-[11px] font-medium text-foreground"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#222228] bg-[#141418]/90 text-[#FFB800] backdrop-blur-md transition hover:border-[#FFB800]">
                  <Film className="h-5 w-5" />
                </span>
                <span>Backdrop</span>
              </button>
            )}

            {/* Center: Iconic TikTok Record Shutter */}
            <button
              type="button"
              aria-label={
                recordMode === "photo"
                  ? "Snap photo"
                  : isRecording
                    ? "Stop recording"
                    : "Start recording"
              }
              onClick={handleRecordButton}
              className="relative flex h-20 w-20 items-center justify-center rounded-full"
            >
              <svg className="absolute inset-0 h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="4"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#FFB800"
                  strokeWidth="4"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference - (progressPct / 100) * ringCircumference}
                  strokeLinecap="round"
                />
              </svg>
              <span
                className={`flex items-center justify-center transition-all ${
                  isRecording
                    ? "h-8 w-8 animate-pulse rounded-lg bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                    : recordMode === "photo"
                      ? "h-14 w-14 rounded-full bg-white text-[#0A0A0C]"
                      : "h-14 w-14 rounded-full bg-gradient-to-br from-[#FFB800] to-red-500 text-[#0A0A0C] glow"
                }`}
              >
                {recordMode === "photo" && <Camera className="h-6 w-6" />}
              </span>
            </button>

            {/* Right: Checkmark to Edit (when clips recorded) OR Upload Thumbnail */}
            {segments.length > 0 && !isRecording ? (
              <button
                type="button"
                onClick={() => {
                  setEditPaused(false);
                  setStep("edit");
                }}
                className="flex min-w-[60px] flex-col items-center gap-1 text-[11px] font-semibold text-[#FFB800]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C] glow transition hover:brightness-110">
                  <Check className="h-5 w-5 stroke-[2.75]" />
                </span>
                <span>Edit ({segments.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex min-w-[60px] flex-col items-center gap-1 text-[11px] font-medium text-foreground"
              >
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-[#222228] bg-[#141418]/90 text-[#FFB800] backdrop-blur-md transition hover:border-[#FFB800]">
                  {capturedUrl && capturedKind === "photo" ? (
                    <img src={capturedUrl} alt="Upload" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                </span>
                <span>Upload</span>
              </button>
            )}
          </div>
        </div>

        {textEditorModal}
        {soundDrawer}
      </div>
    </div>
  );
}
