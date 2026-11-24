import { useMemo, useState } from "react";

export function Avatar({
  src,
  name = "",
  handle = "",
  size = 44,
  ring = false,
  glowRing = false,
  activeDot = false,
}: {
  src: string;
  name?: string;
  handle?: string;
  size?: number;
  ring?: boolean | undefined;
  glowRing?: boolean | undefined;
  activeDot?: boolean | undefined;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasSrc = Boolean(src);
  const isEmoji =
    hasSrc &&
    !src.startsWith("http") &&
    !src.startsWith("/") &&
    !src.startsWith("data") &&
    !src.startsWith("blob");
  const initial = (name.trim() || handle.replace(/^@/, "").trim() || "T").charAt(0).toUpperCase();

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`h-full w-full overflow-hidden rounded-full bg-[#141418] ${
          ring || glowRing ? "ring-2 ring-[#FFB800] ring-offset-2 ring-offset-[#0A0A0C]" : ""
        } ${glowRing ? "shadow-[0_0_16px_rgba(255,184,0,0.45)]" : ""}`}
      >
        {!hasSrc || imgFailed ? (
          <div
            className="flex h-full w-full items-center justify-center border border-[#FFB800]/50 bg-[#0A0A0C] font-bold text-[#FFB800]"
            style={{ fontSize: Math.max(12, Math.round(size * 0.4)) }}
          >
            {initial}
          </div>
        ) : isEmoji ? (
          <div
            className="flex h-full w-full items-center justify-center bg-[#141418]"
            style={{ fontSize: size * 0.52 }}
          >
            {src}
          </div>
        ) : (
          <img
            src={src}
            alt={name || "User avatar"}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {activeDot && (
        <span
          aria-label="Active now"
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0A0A0C] bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
        />
      )}
    </div>
  );
}

export function Waveform({
  playing,
  bars = 36,
  className = "h-10",
  activeColor = "bg-[#FFB800]",
  glow = true,
}: {
  playing: boolean;
  bars?: number;
  className?: string;
  activeColor?: string;
  glow?: boolean;
}) {
  const heights = useMemo(
    () =>
      Array.from({ length: bars }, (_, i) => 25 + Math.abs(Math.sin(i * 1.7) * 60) + (i % 3) * 5),
    [bars],
  );
  return (
    <div className={`flex items-end gap-[3px] ${className}`}>
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${activeColor} ${playing ? "animate-wave" : ""}`}
          style={{
            height: `${h}%`,
            animationDelay: `${(i % 9) * 0.08}s`,
            boxShadow: glow ? "0 0 6px rgba(255, 184, 0, 0.55)" : undefined,
            opacity: playing ? 1 : 0.72,
          }}
        />
      ))}
    </div>
  );
}
