import { useState } from "react";
import { Phone, Mail, ArrowLeft } from "lucide-react";
import { LogoMark, Wordmark } from "./Logo";
import { avatar } from "./data";

const G = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

export function Auth({ onLogin }: { onLogin: (id: string) => void }) {
  const [mode, setMode] = useState<"choose" | "phone" | "email">("choose");
  const [value, setValue] = useState("");
  const [leaving, setLeaving] = useState(false);
  const go = (id: string) => { setLeaving(true); setTimeout(() => onLogin(id), 350); };

  return (
    <div className={`flex min-h-dvh flex-col items-center px-7 pb-8 pt-16 transition-all duration-300 ${leaving ? "scale-95 opacity-0" : "animate-rise"}`}>
      <LogoMark className="h-24 w-24" />
      <Wordmark className="mt-2 text-2xl" />
      <h1 className="mt-10 text-center text-4xl font-bold">Find Your Circle<span className="text-primary">.</span></h1>
      <p className="mt-3 text-muted-foreground">Your people are already here.</p>
      <div className="mt-8 flex items-center gap-4">
        <div className="flex -space-x-4">
          {[5, 15, 25, 36, 52].map((n) => (
            <img key={n} src={avatar(n)} alt="" className="h-14 w-14 rounded-full border-2 border-background object-cover" />
          ))}
        </div>
        <div className="text-sm leading-tight"><b>12k+</b><br /><span className="text-muted-foreground">joined today</span></div>
      </div>

      <div className="mt-auto w-full max-w-sm space-y-4 pt-10">
        {mode === "choose" ? (
          <>
            <button onClick={() => go("google:you@gmail.com")} className="flex h-14 w-full items-center justify-center gap-[10px] rounded-full bg-google px-3 text-[15px] font-medium text-google-foreground transition active:scale-[0.98]">
              <G /> Continue with Google
            </button>
            <button onClick={() => setMode("phone")} className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-primary text-[15px] font-medium transition active:scale-[0.98]">
              <Phone className="h-5 w-5 text-primary" /> Continue with Phone Number
            </button>
            <button onClick={() => setMode("email")} className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground glow transition active:scale-[0.98]">
              <Mail className="h-5 w-5" /> Sign up with Email
            </button>
          </>
        ) : (
          <form className="animate-rise space-y-4" onSubmit={(e) => { e.preventDefault(); if (value.trim()) go(`${mode}:${value.trim()}`); }}>
            <button type="button" onClick={() => { setMode("choose"); setValue(""); }} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</button>
            <label className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4">
              {mode === "phone" ? <Phone className="h-5 w-5 text-muted-foreground" /> : <Mail className="h-5 w-5 text-muted-foreground" />}
              <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} type={mode === "phone" ? "tel" : "email"} placeholder={mode === "phone" ? "+1 555 010 2030" : "you@example.com"} className="w-full bg-transparent outline-none placeholder:text-muted-foreground" aria-label={mode === "phone" ? "Phone number" : "Email"} />
            </label>
            <button type="submit" disabled={!value.trim()} className="h-14 w-full rounded-full bg-primary text-lg font-bold tracking-wide text-primary-foreground glow disabled:opacity-40">TAP IN</button>
            <p className="text-center text-xs text-muted-foreground">Test mode — any {mode === "phone" ? "number" : "email"} works.</p>
          </form>
        )}
        <p className="pt-2 text-center text-xs text-muted-foreground">By continuing you agree to <span className="text-primary">Terms</span></p>
      </div>
    </div>
  );
}
