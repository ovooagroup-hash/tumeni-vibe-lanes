import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Laugh,
  Music,
  Camera,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark, Wordmark } from "./Logo";
import {
  INTERESTS,
  profileError,
  testIdentity,
  toggleSelection,
  type SetupProfile,
} from "./onboarding";

const G = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

const steps = ["Welcome", "Your profile", "Your interests", "Your circle"];
const icons = [Laugh, Flame, Music, Camera, Gamepad2, Trophy];
const empty: SetupProfile = {
  name: "",
  handle: "",
  avatar: "",
  bio: "",
  interests: [],
  following: [],
  friends: [],
};

export function Auth({
  onLogin,
  initialAccount = null,
}: {
  onLogin: (id: string, profile: SetupProfile) => void;
  initialAccount?: string | null;
}) {
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

  const next = () => {
    setError("");
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };
  const enter = (id: string) => {
    setAccount(id);
    setPassword("");
    next();
  };
  const select = (key: "interests" | "following" | "friends", id: string) =>
    setProfile((p) => ({ ...p, [key]: toggleSelection(p[key], id) }));

  const field =
    "h-12 w-full rounded-lg border border-border bg-card px-4 text-base outline-none transition focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground";

  const initial = (profile.name.trim() || profile.handle.trim() || "T").charAt(0).toUpperCase();

  return (
    <div className="min-h-dvh bg-[#0A0A0C]">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#222228] px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2">
          <LogoMark className="h-9 w-9" />
          <Wordmark className="text-2xl" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">YOUR CIRCLE. YOUR VIBE.</span>
      </header>
      <main
        className={`mx-auto w-full px-5 pb-12 pt-7 sm:px-8 sm:pt-12 ${step < 2 ? "max-w-lg" : "max-w-3xl"}`}
      >
        <ol aria-label="Setup progress" className="mb-10 flex items-start justify-between gap-2">
          {steps.map((label, i) => (
            <li
              key={label}
              aria-current={step === i ? "step" : undefined}
              className="flex flex-1 flex-col gap-2"
            >
              <span className={`h-1 rounded-full ${i <= step ? "bg-[#FFB800]" : "bg-[#222228]"}`} />
              <span
                className={`text-xs ${i === step ? "font-medium text-[#FFB800]" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </li>
          ))}
        </ol>
        <div className="animate-rise" key={step}>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[#FFB800]">
            {step === 0 ? "Welcome to tumeni." : `Step ${step + 1} of 4`}
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {
              [
                "Find your circle.",
                "Make it yours.",
                "What’s your vibe?",
                "Good company starts here.",
              ][step]
            }
          </h1>
          <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
            {
              [
                "A place for your people, your stories and everything in between.",
                "Upload your own photo and pick the name your circle knows you by.",
                "Pick the things you love.",
                "Your feed, reels, and circle are ready.",
              ][step]
            }
          </p>

          {step === 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => enter("google:you@gmail.com")}
                className="google-signin h-12 w-full gap-[10px] rounded-lg px-3 text-sm [&_svg]:size-[18px]"
              >
                <G />
                Continue with Google
              </Button>
              <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-[#222228]" />
                or continue with
                <span className="h-px flex-1 bg-[#222228]" />
              </div>
              <div
                className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-[#222228] p-1"
                role="group"
                aria-label="Sign-in method"
              >
                {(["email", "phone"] as const).map((m) => (
                  <Button
                    key={m}
                    variant={mode === m ? "secondary" : "ghost"}
                    aria-pressed={mode === m}
                    onClick={() => {
                      setMode(m);
                      setValue("");
                    }}
                    className="capitalize"
                  >
                    {m === "phone" ? "Phone number" : "Email"}
                  </Button>
                ))}
              </div>
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const id = testIdentity(mode, value, password);
                  if (id) enter(id);
                }}
              >
                <label className="block space-y-2 text-sm font-medium">
                  <span>{mode === "phone" ? "Phone number" : "Email address"}</span>
                  <input
                    className={field}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    type={mode === "phone" ? "tel" : "text"}
                    inputMode={mode === "phone" ? "tel" : "email"}
                    autoComplete={mode === "phone" ? "tel" : "email"}
                    placeholder={mode === "phone" ? "+1 555 010 2030" : "you@example.com"}
                    required
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  <span>Password</span>
                  <div className="relative">
                    <input
                      className={`${field} pr-12`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter a test password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1.5"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </label>
                <Button
                  type="submit"
                  disabled={!value.trim() || !password.trim()}
                  className="h-12 w-full bg-[#FFB800] text-[#0A0A0C] hover:bg-[#FFB800]/90"
                >
                  Continue <ArrowRight />
                </Button>
              </form>
              <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
                Test access · any email or phone and password.
                <br />
                No verification required.
              </p>
            </>
          )}

          {step === 1 && (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                const message = profileError(profile.name, profile.handle);
                setError(message);
                if (!message) next();
              }}
            >
              <div className="mb-7 flex items-center gap-5 rounded-2xl border border-[#222228] bg-[#141418] p-4">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Your uploaded avatar"
                    className="h-20 w-20 shrink-0 rounded-full border-2 border-[#FFB800] object-cover"
                  />
                ) : (
                  <div
                    aria-label="Tumeni monogram avatar"
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#FFB800] bg-[#0A0A0C] text-2xl font-bold tracking-tight text-[#FFB800]"
                  >
                    {initial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Profile photo</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {profile.avatar
                      ? "Custom photo selected from your device."
                      : "Using your Tumeni gold monogram by default."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      disabled={avatarBusy}
                      onClick={() => upload.current?.click()}
                      className="min-h-[44px] gap-2 rounded-xl bg-[#FFB800] px-4 text-sm font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                    >
                      <Camera className="h-4 w-4" />
                      <span>{profile.avatar ? "Change Photo" : "Upload Photo"}</span>
                    </Button>
                    {profile.avatar && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setProfile((p) => ({ ...p, avatar: "" }))}
                        className="min-h-[44px] text-xs text-muted-foreground hover:text-foreground"
                      >
                        Use monogram
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <input
                ref={upload}
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
                    setError("Choose an image smaller than 5 MB.");
                    return;
                  }
                  setAvatarBusy(true);
                  const reader = new FileReader();
                  reader.onload = () => {
                    const result = reader.result;
                    if (typeof result === "string") setProfile((p) => ({ ...p, avatar: result }));
                    setError("");
                    setAvatarBusy(false);
                  };
                  reader.onerror = () => {
                    setError("This photo could not be opened. Try another.");
                    setAvatarBusy(false);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <label className="block space-y-2 text-sm font-medium">
                <span>Display name</span>
                <input
                  className={field}
                  maxLength={50}
                  autoComplete="nickname"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  required
                />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span>@handle</span>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-muted-foreground">@</span>
                  <input
                    className={`${field} pl-9`}
                    maxLength={24}
                    autoCapitalize="none"
                    spellCheck={false}
                    value={profile.handle}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, handle: e.target.value.replace(/^@/, "") }))
                    }
                    placeholder="your.handle"
                    required
                  />
                </div>
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span>
                  Bio <span className="font-normal text-muted-foreground">· optional</span>
                </span>
                <textarea
                  className={`${field} h-24 resize-none py-3`}
                  maxLength={160}
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="A little about you…"
                />
                <span className="block text-right text-xs text-muted-foreground">
                  {profile.bio.length}/160
                </span>
              </label>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={avatarBusy}
                className="h-12 w-full bg-[#FFB800] text-[#0A0A0C] hover:bg-[#FFB800]/90"
              >
                Continue <ArrowRight />
              </Button>
            </form>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {INTERESTS.map((label, i) => {
                  const Icon = icons[i] ?? Flame;
                  const selected = profile.interests.includes(label);
                  return (
                    <Button
                      key={label}
                      variant="outline"
                      aria-pressed={selected}
                      onClick={() => select("interests", label)}
                      className={`relative h-auto flex-col items-start gap-0 overflow-hidden rounded-2xl bg-[#141418] p-0 text-left whitespace-normal ${
                        selected
                          ? "border-[#FFB800] ring-1 ring-[#FFB800]"
                          : "border-[#222228] hover:border-[#FFB800]/50"
                      }`}
                    >
                      <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[#141418] to-[#0A0A0C] text-[#FFB800]">
                        <Icon className="h-12 w-12" />
                        <span
                          className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                              : "border-foreground/40 bg-[#0A0A0C]/60"
                          }`}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                      <span className="flex min-h-14 w-full items-center border-t border-[#222228] bg-[#141418] px-3.5 py-3 text-sm font-medium text-foreground">
                        {label}
                      </span>
                    </Button>
                  );
                })}
              </div>
              <div className="mt-7 flex items-center justify-between gap-4">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {profile.interests.length} selected
                </span>
                <Button
                  className="h-12 bg-[#FFB800] px-6 text-[#0A0A0C] hover:bg-[#FFB800]/90"
                  disabled={!profile.interests.length}
                  onClick={next}
                >
                  Continue <ArrowRight />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="rounded-2xl border border-[#222228] bg-[#141418] px-5 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#FFB800]/40 bg-[#0A0A0C] text-[#FFB800]">
                  <Check className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">Your profile starts fresh</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  No placeholder accounts or inflated numbers. Discover real drops, reels, and crews
                  inside.
                </p>
              </div>
              <Button
                className="mt-7 h-12 w-full bg-[#FFB800] text-[#0A0A0C] hover:bg-[#FFB800]/90"
                onClick={() =>
                  onLogin(account, {
                    ...profile,
                    name: profile.name.trim(),
                    handle: `@${profile.handle.replace(/^@/, "")}`,
                    bio: profile.bio.trim(),
                  })
                }
              >
                Enter Tumeni <ArrowRight />
              </Button>
            </>
          )}

          {step > 0 && (
            <Button
              variant="ghost"
              className="mt-5 px-0 text-muted-foreground"
              onClick={() => {
                setError("");
                setStep((s) => s - 1);
              }}
            >
              <ArrowLeft />
              Back
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
