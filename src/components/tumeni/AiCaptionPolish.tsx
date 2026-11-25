import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

type CaptionTone = "hype" | "chill" | "deep" | "witty";

const TONES: { id: CaptionTone; emoji: string; label: string }[] = [
  { id: "hype", emoji: "⚡", label: "Hype" },
  { id: "chill", emoji: "🌙", label: "Chill" },
  { id: "deep", emoji: "🧠", label: "Deep" },
  { id: "witty", emoji: "🔥", label: "Witty" },
];

export function AiCaptionPolish({
  roughIdea,
  mediaType,
  category,
  onApply,
}: {
  roughIdea: string;
  mediaType: "video" | "photo" | "text" | "audio";
  category?: string | undefined;
  onApply: (captionText: string, extractedHashtags: string) => void;
}) {
  const [tone, setTone] = useState<CaptionTone>("hype");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [appliedIdx, setAppliedIdx] = useState<number | null>(null);

  const generate = async () => {
    const draft = roughIdea.trim();
    if (!draft) {
      setError('Write a quick rough idea above first (e.g. "late night studio coffee vibes").');
      return;
    }

    setLoading(true);
    setError("");
    setAppliedIdx(null);

    try {
      const res = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roughIdea: draft,
          tone,
          mediaType,
          category: category ?? "general",
        }),
      });
      const data = (await res.json()) as { captions?: string[]; error?: string };
      if (!res.ok || !Array.isArray(data.captions) || data.captions.length === 0) {
        setError(data.error || "Could not generate captions right now.");
        setSuggestions([]);
      } else {
        setSuggestions(data.captions);
      }
    } catch {
      setError("Network error contacting AI caption service.");
    } finally {
      setLoading(false);
    }
  };

  const applyOption = (fullText: string, idx: number) => {
    const tags = fullText.match(/#[a-zA-Z0-9_]+/g) ?? [];
    const bodyWithoutTags = fullText
      .replace(/#[a-zA-Z0-9_]+/g, "")
      .replace(/\s+/g, " ")
      .trim();
    setAppliedIdx(idx);
    onApply(bodyWithoutTags || fullText, tags.join(" "));
  };

  return (
    <div className="rounded-2xl border border-[#222228] bg-[#0A0A0C] p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[#FFB800]" />
          <span>Tumeni AI Caption Polish</span>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void generate()}
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full bg-[#FFB800] px-3 text-[11px] font-bold text-[#0A0A0C] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Polishing…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              <span>Polish</span>
            </>
          )}
        </button>
      </div>

      <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
        {TONES.map((t) => {
          const active = tone === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={`min-h-[30px] shrink-0 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-semibold transition ${
                active
                  ? "border-[#FFB800] bg-[#FFB800]/15 text-[#FFB800]"
                  : "border-[#222228] bg-[#141418] text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="mt-2.5 space-y-2">
          {suggestions.map((opt, idx) => {
            const applied = appliedIdx === idx;
            return (
              <div
                key={`${idx}-${opt.slice(0, 16)}`}
                className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 transition ${
                  applied ? "border-[#FFB800] bg-[#FFB800]/10" : "border-[#222228] bg-[#141418]"
                }`}
              >
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-foreground">{opt}</p>
                <button
                  type="button"
                  onClick={() => applyOption(opt, idx)}
                  className={`inline-flex min-h-[28px] shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold transition ${
                    applied
                      ? "bg-[#FFB800] text-[#0A0A0C]"
                      : "border border-[#FFB800]/40 bg-[#0A0A0C] text-[#FFB800] hover:bg-[#FFB800] hover:text-[#0A0A0C]"
                  }`}
                >
                  {applied ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Applied</span>
                    </>
                  ) : (
                    <span>Apply</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
