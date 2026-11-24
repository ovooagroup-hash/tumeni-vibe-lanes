import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Hand,
  Headphones,
  Maximize2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { LIVE_ROOM, type User } from "./data";
import { Avatar, Waveform } from "./SharedUI";

export type FloatingReaction = {
  id: string;
  emoji: string;
  offsetX: number;
};

const REACTION_EMOJIS = ["🔥", "💯", "👏", "🎵"] as const;

export function LiveRoomBanner({
  joined,
  listenerCount,
  onOpen,
}: {
  joined: boolean;
  listenerCount: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center justify-between gap-3 border-b border-[#222228] bg-gradient-to-r from-[#141418] via-[#1B170D] to-[#141418] px-4 py-3 text-left transition hover:border-[#FFB800]/60 sm:mx-4 sm:mt-4 sm:w-[calc(100%-2rem)] sm:rounded-2xl sm:border"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <p className="truncate text-xs font-semibold text-foreground sm:text-sm">
          <span className="text-red-400">LIVE:</span> {LIVE_ROOM.title} with{" "}
          <span className="text-[#FFB800]">{LIVE_ROOM.host.handle}</span>{" "}
          <span className="font-normal tabular-nums text-muted-foreground">
            ({listenerCount} listening)
          </span>
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap rounded-full bg-[#FFB800] px-3 py-1 text-[11px] font-bold text-[#0A0A0C] shadow-[0_0_14px_rgba(255,184,0,0.4)] transition group-hover:brightness-110">
        {joined ? "In Room" : "Tap In"}
      </span>
    </button>
  );
}

export function LiveVibeRoomSheet({
  me,
  listenerCount,
  streamMuted,
  micMuted,
  handRaised,
  onStage,
  onToggleStreamMute,
  onToggleMic,
  onToggleHand,
  onMinimize,
  onLeave,
}: {
  me: User;
  listenerCount: number;
  streamMuted: boolean;
  micMuted: boolean;
  handRaised: boolean;
  onStage: boolean;
  onToggleStreamMute: () => void;
  onToggleMic: () => void;
  onToggleHand: () => void;
  onMinimize: () => void;
  onLeave: () => void;
}) {
  const [activeSpeakerIdx, setActiveSpeakerIdx] = useState(0);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const speakers: User[] = onStage ? [...LIVE_ROOM.speakers, me] : LIVE_ROOM.speakers;
  const listeners: User[] = onStage ? LIVE_ROOM.listeners : [me, ...LIVE_ROOM.listeners];

  useEffect(() => {
    const t = setInterval(() => {
      setActiveSpeakerIdx((idx) => (idx + 1) % speakers.length);
    }, 2800);
    return () => clearInterval(t);
  }, [speakers.length]);

  const spawnReaction = (emoji: string) => {
    const id = crypto.randomUUID();
    const offsetX = Math.floor(Math.random() * 44) - 22;
    setReactions((prev) => [...prev.slice(-14), { id, emoji, offsetX }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C]/85 backdrop-blur-md sm:items-center">
      <div className="animate-rise relative flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-[#222228] bg-[#0A0A0C] sm:rounded-3xl">
        {/* Room Header */}
        <header className="flex items-center justify-between gap-3 border-b border-[#222228] bg-[#141418] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-foreground">{LIVE_ROOM.title}</h2>
                <span className="text-xs font-semibold text-[#FFB800]">{LIVE_ROOM.tag}</span>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Hosted by {LIVE_ROOM.host.handle}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-foreground">{listenerCount} listening</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label={streamMuted ? "Unmute room audio" : "Mute room audio"}
              onClick={onToggleStreamMute}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222228] bg-[#0A0A0C] text-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
            >
              {streamMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4 text-[#FFB800]" />
              )}
            </button>
            <button
              type="button"
              aria-label="Minimize live room"
              onClick={onMinimize}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222228] bg-[#0A0A0C] text-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Stage & Listeners */}
        <div className="relative flex-1 space-y-6 overflow-y-auto px-5 py-6">
          {/* Speaker Stage */}
          <section aria-label="Speaker Stage">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#FFB800]" />
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Speaker Stage
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Waveform playing={!streamMuted} bars={12} className="h-4" />
                <span className="text-[11px] font-medium text-[#FFB800]">
                  {streamMuted ? "Audio muted" : "Live audio"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 rounded-3xl border border-[#222228] bg-[#141418] p-5">
              {speakers.map((speaker, idx) => {
                const isMeSpeaker = speaker.id === me.id;
                const speaking = isMeSpeaker ? !micMuted : idx === activeSpeakerIdx;
                const isHost = speaker.id === LIVE_ROOM.host.id;

                return (
                  <div key={speaker.id} className="flex flex-col items-center text-center">
                    <div className="relative flex items-center justify-center">
                      {speaking && (
                        <>
                          <span
                            aria-hidden="true"
                            className="animate-ring-pulse pointer-events-none absolute inset-0 rounded-full border-2 border-[#FFB800]"
                          />
                          <span
                            aria-hidden="true"
                            className="animate-ring-pulse pointer-events-none absolute inset-0 rounded-full border border-[#FFB800]/60 [animation-delay:0.75s]"
                          />
                        </>
                      )}
                      <Avatar
                        src={speaker.avatar}
                        name={speaker.name}
                        handle={speaker.handle}
                        size={68}
                        glowRing={speaking}
                        ring={!speaking}
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#141418] ${
                          isMeSpeaker && micMuted
                            ? "bg-[#222228] text-muted-foreground"
                            : "bg-[#FFB800] text-[#0A0A0C]"
                        }`}
                      >
                        {isMeSpeaker && micMuted ? (
                          <MicOff className="h-3 w-3" />
                        ) : (
                          <Mic className="h-3 w-3" />
                        )}
                      </span>
                    </div>

                    <div className="mt-2.5 flex max-w-full items-center justify-center gap-1">
                      <span className="truncate text-xs font-semibold text-foreground">
                        {isMeSpeaker ? "You" : speaker.name}
                      </span>
                      {speaker.verified && (
                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#FFB800]">
                      {isHost ? "Host" : speaking ? "Speaking" : "Co-host"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Listeners Grid */}
          <section aria-label="Listeners">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-[#FFB800]" />
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Listeners ({listenerCount})
                </h3>
              </div>
              {handRaised && (
                <span className="text-xs font-semibold text-[#FFB800]">Hand raised ✋</span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 rounded-3xl border border-[#222228] bg-[#141418] p-4 sm:grid-cols-5">
              {listeners.map((listener) => {
                const isMeListener = listener.id === me.id;
                return (
                  <div key={listener.id} className="flex flex-col items-center text-center">
                    <div className="relative">
                      <Avatar
                        src={listener.avatar}
                        name={listener.name}
                        handle={listener.handle}
                        size={44}
                        ring={isMeListener && handRaised}
                      />
                      {isMeListener && handRaised && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFB800] text-[10px] text-[#0A0A0C]">
                          ✋
                        </span>
                      )}
                    </div>
                    <span className="mt-1.5 w-full truncate text-[11px] text-muted-foreground">
                      {isMeListener ? "You" : listener.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Floating Animated Reaction Bubbles on the Right Side */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed bottom-36 right-8 z-50 flex flex-col items-center sm:right-[calc(50%-13.5rem)]"
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
        </div>

        {/* Bottom Floating Reactions & Stage Controls */}
        <footer className="space-y-3 border-t border-[#222228] bg-[#141418] p-4 pb-6">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Send live vibe</span>
            <div className="flex items-center gap-2">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-label={`React ${emoji}`}
                  onClick={() => spawnReaction(emoji)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222228] bg-[#0A0A0C] text-lg transition hover:border-[#FFB800] active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onToggleMic}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border px-3 text-xs font-semibold transition ${
                micMuted
                  ? "border-[#222228] bg-[#0A0A0C] text-foreground hover:border-[#FFB800]"
                  : "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C] glow"
              }`}
            >
              {micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              <span>{micMuted ? "Unmute Mic" : "Mic Live"}</span>
            </button>

            <button
              type="button"
              onClick={onToggleHand}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border px-3 text-xs font-semibold transition ${
                handRaised || onStage
                  ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                  : "border-[#222228] bg-[#0A0A0C] text-foreground hover:border-[#FFB800]"
              }`}
            >
              <Hand className="h-4 w-4" />
              <span>{onStage ? "On Stage" : handRaised ? "Hand Up" : "Raise Hand"}</span>
            </button>

            <button
              type="button"
              onClick={onLeave}
              className="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-red-500/35 bg-red-500/15 px-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/25"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave Room</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function LiveMiniPlayer({
  listenerCount,
  streamMuted,
  onToggleMute,
  onExpand,
  onLeave,
}: {
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
              src={LIVE_ROOM.host.avatar}
              name={LIVE_ROOM.host.name}
              handle={LIVE_ROOM.host.handle}
              size={40}
              glowRing
            />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 ring-2 ring-[#141418]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-bold text-foreground">{LIVE_ROOM.title}</p>
              <Waveform playing={!streamMuted} bars={6} className="h-3" />
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {LIVE_ROOM.host.handle} · {listenerCount} listening
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={streamMuted ? "Unmute live room" : "Mute live room"}
            onClick={onToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C] text-[#FFB800] hover:brightness-110"
          >
            {streamMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Expand live room"
            onClick={onExpand}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0C] text-foreground hover:text-[#FFB800]"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Leave live room"
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
