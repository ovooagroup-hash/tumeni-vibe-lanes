import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Eye, EyeOff, Flame, Gamepad2, Laugh, Music, Camera, Trophy, UserPlus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark, Wordmark } from "./Logo";
import { USERS } from "./data";
import { INTERESTS, profileError, testIdentity, toggleSelection, type SetupProfile } from "./onboarding";
import artist from "@/assets/artist.jpg";
import street from "@/assets/street.jpg";
import studio from "@/assets/studio.jpg";
import meme from "@/assets/meme.jpg";

const G = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);
const steps = ["Welcome", "Your profile", "Your interests", "Your circle"];
const pictures = [meme, street, studio, street, artist, studio];
const icons = [Laugh, Flame, Music, Camera, Gamepad2, Trophy];
const avatars = [artist, street, studio, meme];
const empty: SetupProfile = { name: "", handle: "", avatar: artist, bio: "", interests: [], following: [], friends: [] };

export function Auth({ onLogin, initialAccount = null }: { onLogin: (id: string, profile: SetupProfile) => void; initialAccount?: string | null }) {
  const [step, setStep] = useState(initialAccount ? 1 : 0);
  const [account, setAccount] = useState(initialAccount ?? "");
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState<SetupProfile>(empty);
  const [error, setError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const next = () => { setError(""); setStep((s) => s + 1); window.scrollTo(0, 0); };
  const enter = (id: string) => { setAccount(id); setPassword(""); next(); };
  const select = (key: "interests" | "following" | "friends", id: string) => setProfile((p) => ({ ...p, [key]: toggleSelection(p[key], id) }));
  const field = "h-12 w-full rounded-lg border border-border bg-card px-4 text-base outline-none transition focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";

  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-border px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2"><LogoMark className="h-9 w-9" /><Wordmark className="text-2xl" /></div>
        <span className="text-xs font-medium text-muted-foreground">YOUR CIRCLE. YOUR VIBE.</span>
      </header>
      <main className={`mx-auto w-full px-5 pb-12 pt-7 sm:px-8 sm:pt-12 ${step < 2 ? "max-w-lg" : "max-w-3xl"}`}>
        <ol aria-label="Setup progress" className="mb-10 flex items-start justify-between gap-2">
          {steps.map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined} className="flex flex-1 flex-col gap-2"><span className={`h-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} /><span className={`text-xs ${i === step ? "font-medium text-primary" : "text-muted-foreground"}`}>{label}</span></li>)}
        </ol>
        <div className="animate-rise" key={step}>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">{step === 0 ? "Welcome to tumeni." : `Step ${step + 1} of 4`}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{["Find your circle.", "Make it yours.", "What’s your vibe?", "Good company starts here."][step]}</h1>
          <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">{["A place for your people, your stories and everything in between.", "A familiar face. A name that’s you.", "Pick the things you love.", "Meet creators and familiar faces from the Tumeni community."][step]}</p>
          {step === 0 && <>
            <Button variant="outline" onClick={() => enter("google:you@gmail.com")} className="google-signin h-12 w-full gap-[10px] rounded-lg px-3 text-sm [&_svg]:size-[18px]"><G />Continue with Google</Button>
            <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div>
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-border p-1" role="group" aria-label="Sign-in method">
              {(["email", "phone"] as const).map((m) => <Button key={m} variant={mode === m ? "secondary" : "ghost"} aria-pressed={mode === m} onClick={() => { setMode(m); setValue(""); }} className="capitalize">{m === "phone" ? "Phone number" : "Email"}</Button>)}
            </div>
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); const id = testIdentity(mode, value, password); if (id) enter(id); }}>
              <label className="block space-y-2 text-sm font-medium"><span>{mode === "phone" ? "Phone number" : "Email address"}</span><input className={field} value={value} onChange={(e) => setValue(e.target.value)} type={mode === "phone" ? "tel" : "text"} inputMode={mode === "phone" ? "tel" : "email"} autoComplete={mode === "phone" ? "tel" : "email"} placeholder={mode === "phone" ? "+1 555 010 2030" : "you@example.com"} required /></label>
              <label className="block space-y-2 text-sm font-medium"><span>Password</span><div className="relative"><input className={`${field} pr-12`} value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter a test password" required /><Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1.5">{showPassword ? <EyeOff /> : <Eye />}</Button></div></label>
              <Button type="submit" disabled={!value.trim() || !password.trim()} className="h-12 w-full">Continue <ArrowRight /></Button>
            </form>
            <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">Test access · any email or phone and password.<br />No verification required.</p>
          </>}
          {step === 1 && <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); const message = profileError(profile.name, profile.handle); setError(message); if (!message) next(); }}>
            <div className="mb-7 flex items-center gap-5"><img src={profile.avatar} alt="Your selected avatar" className="h-20 w-20 rounded-full border-2 border-primary object-cover" /><div className="min-w-0"><p className="mb-2 text-sm font-medium">Profile photo</p><div className="flex flex-wrap gap-2">{avatars.map((src, i) => <Button key={src} type="button" variant="ghost" size="icon" aria-label={`Choose avatar ${i + 1}`} aria-pressed={profile.avatar === src} onClick={() => setProfile((p) => ({ ...p, avatar: src }))} className={`h-10 w-10 overflow-hidden rounded-full p-0 ${profile.avatar === src ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}><img src={src} alt="" className="h-full w-full object-cover" /></Button>)}<Button type="button" variant="outline" size="icon" aria-label="Upload profile photo" disabled={avatarBusy} onClick={() => upload.current?.click()}><Upload /></Button></div></div></div>
            <input ref={upload} hidden type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { setError("Choose an image smaller than 5 MB."); return; } setAvatarBusy(true); const reader = new FileReader(); reader.onload = () => { const result = reader.result; if (typeof result === "string") setProfile((p) => ({ ...p, avatar: result })); setError(""); setAvatarBusy(false); }; reader.onerror = () => { setError("This photo could not be opened. Try another."); setAvatarBusy(false); }; reader.readAsDataURL(file); }} />
            <label className="block space-y-2 text-sm font-medium"><span>Display name</span><input className={field} maxLength={50} autoComplete="nickname" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Your name" required /></label>
            <label className="block space-y-2 text-sm font-medium"><span>@handle</span><div className="relative"><span className="absolute left-4 top-3 text-muted-foreground">@</span><input className={`${field} pl-9`} maxLength={24} autoCapitalize="none" spellCheck={false} value={profile.handle} onChange={(e) => setProfile((p) => ({ ...p, handle: e.target.value.replace(/^@/, "") }))} placeholder="your.handle" required /></div></label>
            <label className="block space-y-2 text-sm font-medium"><span>Bio <span className="font-normal text-muted-foreground">· optional</span></span><textarea className={`${field} h-24 resize-none py-3`} maxLength={160} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} placeholder="A little about you…" /><span className="block text-right text-xs text-muted-foreground">{profile.bio.length}/160</span></label>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={avatarBusy} className="h-12 w-full">Continue <ArrowRight /></Button>
          </form>}
          {step === 2 && <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{INTERESTS.map((label, i) => { const Icon = icons[i] ?? Flame; const selected = profile.interests.includes(label); return <Button key={label} variant="outline" aria-pressed={selected} onClick={() => select("interests", label)} className={`relative h-auto flex-col items-start gap-0 overflow-hidden rounded-lg p-0 text-left whitespace-normal ${selected ? "border-primary ring-1 ring-primary" : "border-border"}`}><div className="relative aspect-[4/3] w-full overflow-hidden"><>{i < 4 ? <img src={pictures[i]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-secondary text-primary [&_svg]:size-16"><Icon /></div>}</><div className="absolute inset-0 bg-background/20" /><span className="absolute left-3 top-3 rounded-md bg-background/80 p-2 text-primary"><Icon /></span><span className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/50 bg-background/50"}`}>{selected && <Check />}</span></div><span className="flex min-h-16 w-full items-center bg-card px-3 py-3 text-sm font-medium">{label}</span></Button>; })}</div>
            <div className="mt-7 flex items-center justify-between gap-4"><span className="text-sm text-muted-foreground">{profile.interests.length} selected</span><Button className="h-12 px-6" disabled={!profile.interests.length} onClick={next}>Continue <ArrowRight /></Button></div>
          </>}
          {step === 3 && <>
            <h2 className="mb-3 text-lg font-semibold">Creators to follow</h2>
            <div className="grid gap-3 sm:grid-cols-2">{[USERS.yung, USERS.nala, USERS.kito, USERS.haha].map((u, i) => <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"><Face src={u.avatar} /><div className="min-w-0 flex-1"><p className="flex items-center gap-1 text-sm font-medium"><span className="truncate">{u.name}</span>{u.verified && <BadgeCheck aria-label="Verified creator" className="h-4 w-4 shrink-0 text-primary" />}</p><p className="truncate text-xs text-muted-foreground">{u.handle}</p><p className="mt-1 text-xs text-muted-foreground">{["48.2K", "31.6K", "12.9K", "24.8K"][i]} followers</p></div><Button variant={profile.following.includes(u.id) ? "secondary" : "default"} size="sm" aria-label={`${profile.following.includes(u.id) ? "Unfollow" : "Follow"} ${u.name}`} onClick={() => select("following", u.id)}>{profile.following.includes(u.id) ? <Check /> : <UserPlus />}{profile.following.includes(u.id) ? "Following" : "Follow"}</Button></div>)}</div>
            <h2 className="mb-3 mt-8 text-lg font-semibold">People you may know</h2>
            <div className="divide-y divide-border">{[USERS.zuri, USERS.dre].map((u, i) => <div key={u.id} className="flex items-center gap-3 py-4"><Face src={u.avatar} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{i === 0 ? 8 : 12} mutual friends</p></div><Button variant="outline" aria-label={`${profile.friends.includes(u.id) ? "Remove" : "Add"} ${u.name}`} onClick={() => select("friends", u.id)}>{profile.friends.includes(u.id) ? <Check /> : <UserPlus />}{profile.friends.includes(u.id) ? "Added" : "Add friend"}</Button></div>)}</div>
            <p className="mt-3 text-xs text-muted-foreground">Suggested connections are sample profiles for testing.</p>
            <Button className="mt-7 h-12 w-full" onClick={() => onLogin(account, { ...profile, name: profile.name.trim(), handle: `@${profile.handle.replace(/^@/, "")}`, bio: profile.bio.trim() })}>Enter Tumeni <ArrowRight /></Button>
          </>}
          {step > 0 && <Button variant="ghost" className="mt-5 px-0 text-muted-foreground" onClick={() => { setError(""); setStep((s) => s - 1); }}><ArrowLeft />Back</Button>}
        </div>
      </main>
    </div>
  );
}
function Face({ src }: { src: string }) { return src === "😆" ? <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl">{src}</span> : <img src={src} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />; }
