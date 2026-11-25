import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCheck,
  Mic,
  MicOff,
  Music,
  Paperclip,
  Pause,
  Phone,
  PhoneOff,
  Play,
  Send,
  SlidersHorizontal,
  SmilePlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUser,
  USERS,
  type Chat,
  type ChatAttachment,
  type Msg,
  type Post,
  type VoiceNote,
} from "./data";
import { Avatar, Waveform } from "./SharedUI";
import { claimMediaFocus, releaseMediaFocus, subscribeMediaFocus } from "./mediaCoordinator";

const QUICK_REACTIONS = ["🔥", "👑", "😂", "💛"] as const;
const ROOM_MOODS = [
  "Studio Mode 🎧",
  "Late Night Mix 🌙",
  "Beat Critique 🔥",
  "Chilling ✨",
] as const;

export function MessagesList({ chats, onOpen }: { chats: Chat[]; onOpen: (id: string) => void }) {
  return (
    <div className="px-4 pt-5 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Crew Chat<span className="text-[#FFB800]">.</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Direct lines, voice notes, and studio drop rooms
          </p>
        </div>
        <span className="text-xs font-medium text-emerald-400">
          {chats.filter((c) => c.online).length} active now
        </span>
      </div>

      <div className="space-y-2.5">
        {chats.map((c) => {
          const last = c.messages.at(-1);
          const preview = last?.post
            ? "Shared a media drop"
            : last?.voiceNote
              ? `Voice note · ${last.voiceNote.duration}`
              : last?.media
                ? last.media.kind === "video"
                  ? "Sent a video"
                  : "Sent a photo"
                : (last?.text ?? "Start the conversation");

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpen(c.id)}
              className="flex min-h-[72px] w-full items-center gap-3.5 rounded-3xl border border-[#222228] bg-[#141418] p-3.5 text-left transition hover:border-[#FFB800]/50"
            >
              <Avatar
                src={c.avatar}
                name={c.name}
                size={50}
                glowRing={Boolean(c.group)}
                activeDot={Boolean(c.online)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-foreground">{c.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{last?.time}</span>
                </div>
                {(c.roster || c.statusText) && (
                  <p className="truncate text-[11px] font-medium text-[#FFB800]">
                    {c.roster ?? c.statusText}
                  </p>
                )}
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{preview}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VoiceNoteBubble({ note, mine }: { note: VoiceNote; mine: boolean }) {
  const voiceId = `chat-voice-${useId()}`;
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return subscribeMediaFocus((activeId) => {
      if (activeId !== voiceId) {
        setPlaying(false);
      }
    });
  }, [voiceId]);

  useEffect(() => {
    const a = audioRef.current;
    if (playing) {
      claimMediaFocus(voiceId);
      if (a) void a.play().catch(() => {});
    } else {
      releaseMediaFocus(voiceId);
      if (a) a.pause();
    }
    return () => {
      releaseMediaFocus(voiceId);
    };
  }, [playing, voiceId]);

  useEffect(() => {
    if (!playing || note.src) return;
    const t = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= note.durationSec) {
          setPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, note.src, note.durationSec]);

  return (
    <div className="flex min-w-[215px] items-center gap-3 py-0.5">
      {note.src && (
        <audio
          ref={audioRef}
          src={note.src}
          preload="none"
          onTimeUpdate={(e) => setElapsed(Math.floor(e.currentTarget.currentTime))}
          onEnded={() => {
            setPlaying(false);
            setElapsed(0);
          }}
        />
      )}
      <button
        type="button"
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        onClick={() => setPlaying((p) => !p)}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
          mine
            ? "bg-[#0A0A0C] text-[#FFB800]"
            : "bg-[#FFB800] text-[#0A0A0C] shadow-[0_0_12px_rgba(255,184,0,0.4)]"
        }`}
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <Waveform
          playing={playing}
          bars={22}
          className="h-6"
          activeColor={mine ? "bg-[#0A0A0C]" : "bg-[#FFB800]"}
          glow={!mine}
        />
        <p
          className={`mt-1 text-[11px] font-medium tabular-nums ${
            mine ? "text-[#0A0A0C]/80" : "text-muted-foreground"
          }`}
        >
          0:{String(elapsed).padStart(2, "0")} / {note.duration}
        </p>
      </div>
    </div>
  );
}

function EmbeddedDropCard({
  post,
  mine,
  onOpenPost,
}: {
  post: Post;
  mine: boolean;
  onOpenPost: (p: Post) => void;
}) {
  const videoSrc = post.video ?? (post.mediaIsVideo ? post.media : undefined);
  return (
    <div
      className={`w-56 overflow-hidden rounded-2xl border ${
        mine
          ? "border-[#0A0A0C]/20 bg-[#0A0A0C]/90 text-foreground"
          : "border-[#222228] bg-[#0A0A0C]"
      }`}
    >
      <div className="relative">
        {videoSrc ? (
          <video
            src={videoSrc}
            muted
            playsInline
            preload="metadata"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : post.media ? (
          <img
            src={post.media}
            alt={post.caption}
            referrerPolicy="no-referrer"
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-[#141418] p-3 text-center">
            {post.kind === "audio" ? (
              <>
                <Music className="h-6 w-6 text-[#FFB800]" />
                <p className="line-clamp-2 text-xs font-medium text-foreground">{post.track}</p>
              </>
            ) : (
              <p className="line-clamp-3 text-xs text-foreground">{post.caption}</p>
            )}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/80 via-transparent to-transparent" />
        <button
          type="button"
          aria-label={`Play drop by ${post.user.handle}`}
          onClick={() => onOpenPost(post)}
          className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C] shadow-[0_0_18px_rgba(255,184,0,0.55)] transition hover:scale-105"
        >
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </button>
        <span className="absolute bottom-2 left-2.5 text-[11px] font-semibold text-foreground">
          {post.user.handle}
        </span>
      </div>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs text-foreground/90">{post.caption}</p>
      </div>
    </div>
  );
}

export function CrewChatRoom({
  chat,
  onBack,
  onSendMessage,
  onReact,
  onUpdateChat,
  onOpenPost,
}: {
  chat: Chat;
  onBack: () => void;
  onSendMessage: (payload: {
    text?: string;
    voiceNote?: VoiceNote;
    media?: ChatAttachment;
  }) => void;
  onReact: (messageId: string, emoji: string) => void;
  onUpdateChat: (patch: Partial<Chat>) => void;
  onOpenPost: (post: Post) => void;
}) {
  const [text, setText] = useState("");
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callMuted, setCallMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  // Voice note recording state
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages.length]);

  useEffect(() => {
    if (!inCall) {
      setCallSeconds(0);
      return;
    }
    const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  useEffect(() => {
    if (!recording) {
      setRecordSeconds(0);
      return;
    }
    const t = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const startRecording = async () => {
    setRecording(true);
    setRecordSeconds(0);
    chunksRef.current = [];
    try {
      if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        rec.onstop = () => {
          stream.getTracks().forEach((tr) => tr.stop());
        };
        mediaRecorderRef.current = rec;
        rec.start();
      }
    } catch {
      // Graceful fallback when microphone permission is unavailable in browser preview
      mediaRecorderRef.current = null;
    }
  };

  const cancelRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      // ignore
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
  };

  const finishAndSendRecording = () => {
    const secs = Math.max(2, recordSeconds);
    const duration = `0:${String(secs).padStart(2, "0")}`;
    const rec = mediaRecorderRef.current;

    if (rec && rec.state !== "inactive") {
      rec.onstop = () => {
        rec.stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const src = blob.size > 0 ? URL.createObjectURL(blob) : undefined;
        onSendMessage({ voiceNote: { duration, durationSec: secs, src } });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
      };
      rec.stop();
    } else {
      onSendMessage({ voiceNote: { duration, durationSec: secs } });
    }
    setRecording(false);
  };

  const handleAttachFile = (file: File) => {
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("video/")) {
      onSendMessage({ media: { url, kind: "video", name: file.name } });
      return;
    }
    if (file.type.startsWith("image/")) {
      onSendMessage({ media: { url, kind: "image", name: file.name } });
      return;
    }
    toast.error("Choose a photo or video file to send");
  };

  const subtitle = chat.group
    ? `${chat.roster ?? "Zuri, Dre, Kito +2"} · ${chat.statusText ?? "Studio Mode 🎧"}`
    : chat.online
      ? `Active now · ${chat.statusText ?? "Studio Mode 🎧"}`
      : (chat.roster ?? "Direct message");

  return (
    <div className="flex min-h-dvh flex-col bg-[#0A0A0C]">
      {/* Luxury Chat Header */}
      <header className="sticky top-0 z-30 border-b border-[#222228] bg-[#0A0A0C]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
          <button
            type="button"
            aria-label="Back to messages"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-[#141418]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Avatar
            src={chat.avatar}
            name={chat.name}
            size={42}
            glowRing={Boolean(chat.group)}
            activeDot={Boolean(chat.online)}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-foreground">{chat.name}</p>
              {chat.muted && <span className="text-[11px] text-muted-foreground">(Muted)</span>}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {chat.online && (
                <span className="mr-1.5 font-medium text-emerald-400">Active now</span>
              )}
              <span aria-hidden="true">·</span> {subtitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={inCall ? "End audio call" : "Start audio call"}
              onClick={() => {
                setInCall((prev) => {
                  const next = !prev;
                  toast.success(next ? `Audio call connected in ${chat.name}` : "Audio call ended");
                  return next;
                });
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                inCall
                  ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-400"
                  : "border-[#222228] bg-[#141418] text-foreground hover:border-[#FFB800] hover:text-[#FFB800]"
              }`}
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Room settings"
              onClick={() => setSettingsOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222228] bg-[#141418] text-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active Audio Call Banner */}
        {inCall && (
          <div className="flex items-center justify-between border-t border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-semibold text-emerald-300">
                Crew Audio Call · 0:{String(callSeconds).padStart(2, "0")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={callMuted ? "Unmute call mic" : "Mute call mic"}
                onClick={() => setCallMuted((m) => !m)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#141418] text-foreground hover:text-[#FFB800]"
              >
                {callMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                aria-label="Hang up"
                onClick={() => setInCall(false)}
                className="flex h-8 items-center gap-1 rounded-full bg-red-500/90 px-3 font-semibold text-white hover:bg-red-500"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                <span>End</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Message Stream */}
      <div
        className="flex-1 space-y-4 p-4 pb-32"
        onClick={() => {
          if (pickerFor) setPickerFor(null);
        }}
      >
        {chat.messages.map((m: Msg) => {
          const mine = m.from === "me";
          const u = getUser(m.from);
          const reactions = m.reactions ?? [];

          return (
            <div key={m.id} className={`flex items-end gap-2.5 ${mine ? "justify-end" : ""}`}>
              {!mine && u && <Avatar src={u.avatar} name={u.name} handle={u.handle} size={30} />}

              <div
                className={`group relative max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}
              >
                {/* Hover/Tap Reaction Trigger & Floating Reaction Picker */}
                <div
                  className={`relative rounded-3xl px-4 py-2.5 text-sm shadow-sm ${
                    mine
                      ? "rounded-br-md bg-gradient-to-br from-[#FFD043] via-[#FFB800] to-[#E59A00] font-medium text-[#0A0A0C] shadow-[0_6px_22px_rgba(255,184,0,0.22)]"
                      : "rounded-bl-md border border-[#222228] bg-[#141418] text-foreground"
                  }`}
                >
                  {chat.group && !mine && u && (
                    <p className="mb-1 text-xs font-semibold text-[#FFB800]">{u.name}</p>
                  )}

                  {m.media && (
                    <div className="mb-1.5 overflow-hidden rounded-2xl border border-[#222228]/50 bg-[#0A0A0C]">
                      {m.media.kind === "video" ? (
                        <video
                          src={m.media.url}
                          controls
                          playsInline
                          className="max-h-60 w-full object-cover"
                        />
                      ) : (
                        <img
                          src={m.media.url}
                          alt={m.media.name ?? "Attachment"}
                          className="max-h-60 w-full object-cover"
                        />
                      )}
                    </div>
                  )}

                  {m.voiceNote && <VoiceNoteBubble note={m.voiceNote} mine={mine} />}

                  {m.post && <EmbeddedDropCard post={m.post} mine={mine} onOpenPost={onOpenPost} />}

                  {m.text && <p className="leading-relaxed">{m.text}</p>}

                  {/* Timestamp & Read Receipts */}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] tabular-nums ${
                      mine ? "text-[#0A0A0C]/70" : "text-muted-foreground"
                    }`}
                  >
                    <span>{m.time}</span>
                    {mine && (
                      <CheckCheck aria-label={m.read ? "Read" : "Sent"} className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Mini Reaction Badges at Bottom Corner */}
                  {reactions.length > 0 && (
                    <div
                      className={`absolute -bottom-3 flex items-center gap-0.5 rounded-full border border-[#222228] bg-[#0A0A0C] px-1.5 py-0.5 text-xs shadow ${
                        mine ? "right-2" : "left-2"
                      }`}
                    >
                      {reactions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onReact(m.id, emoji);
                          }}
                          className="transition hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Reaction Trigger & Popover */}
                <div
                  className={`mt-1 flex items-center gap-1 ${reactions.length > 0 ? "pt-2" : ""}`}
                >
                  <button
                    type="button"
                    aria-label="React to message"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickerFor((curr) => (curr === m.id ? null : m.id));
                    }}
                    className="flex h-7 items-center gap-1 rounded-full px-2 text-[11px] text-muted-foreground opacity-80 transition hover:bg-[#141418] hover:text-[#FFB800] sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <SmilePlus className="h-3.5 w-3.5" />
                    <span>React</span>
                  </button>
                  {pickerFor === m.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 rounded-full border border-[#222228] bg-[#141418] px-2 py-1 shadow-lg"
                    >
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            onReact(m.id, emoji);
                            setPickerFor(null);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:scale-125 hover:bg-[#222228]"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Bottom Floating Messenger Bar */}
      <div className="sticky bottom-3 z-20 px-3 sm:px-4">
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAttachFile(file);
            e.target.value = "";
          }}
        />

        {recording ? (
          <div className="flex items-center gap-3 rounded-full border border-[#FFB800] bg-[#141418]/95 p-2 shadow-[0_0_24px_rgba(255,184,0,0.2)] backdrop-blur-xl">
            <button
              type="button"
              aria-label="Cancel voice recording"
              onClick={cancelRecording}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
            <span className="shrink-0 text-xs font-semibold tabular-nums text-[#FFB800]">
              0:{String(recordSeconds).padStart(2, "0")}
            </span>
            <Waveform playing bars={24} className="h-7 flex-1 justify-center" />
            <button
              type="button"
              aria-label="Send voice note"
              onClick={finishAndSendRecording}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C] glow transition hover:brightness-110"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) {
                onSendMessage({ text: text.trim() });
                setText("");
              }
            }}
            className="flex items-center gap-1.5 rounded-full border border-[#222228] bg-[#141418]/95 p-1.5 shadow-xl backdrop-blur-xl focus-within:border-[#FFB800]/60"
          >
            <button
              type="button"
              aria-label="Attach photo or video"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-[#0A0A0C] hover:text-[#FFB800]"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Record voice note"
              onClick={startRecording}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-[#0A0A0C] hover:text-[#FFB800]"
            >
              <Mic className="h-5 w-5" />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                chat.group ? "Say something into The Crew..." : `Message ${chat.name}...`
              }
              className="min-h-[44px] min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFB800] text-[#0A0A0C] glow transition hover:brightness-110 active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>

      {/* Room Settings Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0A0A0C]/80 backdrop-blur-sm sm:items-center"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-rise w-full max-w-md rounded-t-3xl border border-[#222228] bg-[#141418] p-5 pb-8 sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Room Settings</h2>
              <button
                type="button"
                aria-label="Close room settings"
                onClick={() => setSettingsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-[#222228] hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">Mute room alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Silence notifications for this room
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateChat({ muted: !chat.muted });
                    toast(chat.muted ? "Room unmuted" : "Room muted");
                  }}
                  className={`min-h-[36px] rounded-full px-4 text-xs font-semibold transition ${
                    chat.muted
                      ? "bg-[#FFB800] text-[#0A0A0C]"
                      : "border border-[#222228] bg-[#141418] text-foreground"
                  }`}
                >
                  {chat.muted ? "Muted" : "Active"}
                </button>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Room Mood</p>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_MOODS.map((mood) => {
                    const active = chat.statusText === mood;
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => {
                          onUpdateChat({ statusText: mood });
                          toast.success(`Room mood: ${mood}`);
                        }}
                        className={`min-h-[40px] rounded-xl border px-3 text-xs font-medium transition ${
                          active
                            ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                            : "border-[#222228] bg-[#0A0A0C] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mood}
                      </button>
                    );
                  })}
                </div>
              </div>

              {chat.group && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-[#FFB800]" />
                    <span>Crew Roster</span>
                  </p>
                  <div className="space-y-2">
                    {[USERS.kito, USERS.zuri, USERS.dre, USERS.nala].map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-2xl border border-[#222228] bg-[#0A0A0C] p-2.5"
                      >
                        <Avatar
                          src={member.avatar}
                          name={member.name}
                          handle={member.handle}
                          size={36}
                          activeDot
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{member.handle}</p>
                        </div>
                        <span className="text-[11px] font-medium text-[#FFB800]">In room</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
