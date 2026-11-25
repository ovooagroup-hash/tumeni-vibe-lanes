import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  Laugh,
  Loader2,
  MailCheck,
  MapPin,
  Music,
  Trophy,
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { auth, googleProvider } from "@/lib/firebase";
import { fetchCloudProfile, saveCloudProfile } from "@/lib/tumeni-db";
import { LogoMark, Wordmark } from "./Logo";
import {
  INTERESTS,
  POPULAR_CITIES,
  compressAvatarFile,
  normalizeCity,
  profileError,
  readSetup,
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
  location: "",
  city: "",
  interests: [],
  following: [],
  friends: [],
};

function sanitizeHandle(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 22);
  return cleaned.length >= 2 ? cleaned : `tumeni.${Math.floor(100 + Math.random() * 900)}`;
}

function formatAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: string }).code ?? "")
      : "";
  switch (code) {
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled yet in Firebase Console (Authentication → Sign-in method). Enable it there or use Google Sign-In above.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Double-check your details or try Forgot password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Switch to Sign In to continue.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in popup was closed before completing.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Allow popups for this site and try again.";
    case "auth/too-many-requests":
      return "Too many attempts right now. Wait a minute and try again.";
    default:
      return err instanceof Error && err.message
        ? err.message
        : "Authentication failed. Please try again.";
  }
}

export function Auth({
  onLogin,
  initialAccount = null,
}: {
  onLogin: (id: string, profile: SetupProfile) => void;
  initialAccount?: string | null;
}) {
  const currentUser = auth.currentUser;
  const startNeedsVerify = Boolean(currentUser && !currentUser.emailVerified);
  const startAtOnboarding = Boolean(initialAccount && currentUser && currentUser.emailVerified);

  const [step, setStep] = useState(startAtOnboarding ? 1 : 0);
  const [account, setAccount] = useState(initialAccount ?? currentUser?.uid ?? "");
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(startNeedsVerify);
  const [infoMsg, setInfoMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<SetupProfile>(() => {
    if (startAtOnboarding && currentUser) {
      const baseName =
        currentUser.displayName?.trim() || currentUser.email?.split("@")[0] || "Creator";
      return {
        ...empty,
        name: baseName.slice(0, 50),
        handle: sanitizeHandle(currentUser.email?.split("@")[0] || baseName),
      };
    }
    return empty;
  });
  const [error, setError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fbUser = auth.currentUser;
    if (initialAccount && fbUser) {
      setAccount(fbUser.uid);
      if (fbUser.emailVerified && step === 0 && !needsVerification) {
        setProfile((prev) => ({
          ...prev,
          name: prev.name || fbUser.displayName?.trim() || fbUser.email?.split("@")[0] || "",
          handle:
            prev.handle ||
            sanitizeHandle(fbUser.email?.split("@")[0] || fbUser.displayName || "creator"),
        }));
        setStep(1);
      } else if (!fbUser.emailVerified) {
        setNeedsVerification(true);
        setStep(0);
      }
    }
  }, [initialAccount, step, needsVerification]);

  const next = () => {
    setError("");
    setInfoMsg("");
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const hydrateOrStartOnboarding = async (
    uid: string,
    userEmail: string,
    displayName?: string | null,
  ) => {
    try {
      const cloud = await fetchCloudProfile(uid);
      if (cloud?.profile) {
        onLogin(uid, cloud.profile);
        return;
      }
    } catch {
      /* Check local backup or proceed to onboarding. */
    }

    try {
      const localBackup = readSetup(localStorage.getItem(`tumeni-setup:${uid}`));
      if (localBackup) {
        await saveCloudProfile(uid, userEmail, localBackup);
        onLogin(uid, localBackup);
        return;
      }
    } catch {
      /* Continue to fresh profile setup. */
    }

    const fallbackName = displayName?.trim() || userEmail.split("@")[0] || "";
    setAccount(uid);
    setPassword("");
    setNeedsVerification(false);
    setProfile((prev) => ({
      ...prev,
      name: prev.name || fallbackName.slice(0, 50),
      handle: prev.handle || sanitizeHandle(userEmail.split("@")[0] || fallbackName),
    }));
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setInfoMsg("");
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await hydrateOrStartOnboarding(cred.user.uid, cred.user.email ?? "", cred.user.displayName);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    setError("");
    setInfoMsg("");
    setBusy(true);
    try {
      if (authTab === "signin") {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (!cred.user.emailVerified) {
          setAccount(cred.user.uid);
          setNeedsVerification(true);
          setInfoMsg("Verify your email first to activate your cloud profile.");
          return;
        }
        await hydrateOrStartOnboarding(
          cred.user.uid,
          cred.user.email ?? cleanEmail,
          cred.user.displayName,
        );
      } else {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        setAccount(cred.user.uid);
        try {
          await sendEmailVerification(cred.user);
        } catch {
          /* Verification email might be rate-limited; user can click resend. */
        }
        setNeedsVerification(true);
        setInfoMsg(`We sent a verification link to ${cleanEmail}.`);
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Enter your email address above first so we can send a reset link.");
      return;
    }
    setError("");
    setInfoMsg("");
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setInfoMsg(`Password reset email sent to ${cleanEmail}.`);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setError("");
    setInfoMsg("");
    setBusy(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setInfoMsg("Verification link resent. Check your inbox and spam folder.");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckVerified = async () => {
    if (!auth.currentUser) return;
    setError("");
    setInfoMsg("");
    setBusy(true);
    try {
      await auth.currentUser.reload();
      const refreshed = auth.currentUser;
      if (refreshed?.emailVerified) {
        await hydrateOrStartOnboarding(
          refreshed.uid,
          refreshed.email ?? email,
          refreshed.displayName,
        );
      } else {
        setError("Email is not verified yet. Open the link in your inbox, then tap Continue.");
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleFinishOnboarding = async () => {
    const uid = auth.currentUser?.uid || account;
    if (!uid) {
      setStep(0);
      setError("Please sign in again to finish creating your profile.");
      return;
    }

    const { location, city } = normalizeCity(profile.location ?? profile.city ?? "");
    const finalProfile: SetupProfile = {
      ...profile,
      name: profile.name.trim(),
      handle: `@${profile.handle.replace(/^@/, "")}`,
      bio: profile.bio.trim(),
      location,
      city,
    };

    setBusy(true);
    setError("");
    try {
      await saveCloudProfile(uid, auth.currentUser?.email ?? email, finalProfile);
      onLogin(uid, finalProfile);
    } catch (err) {
      setError(
        err instanceof Error
          ? "Could not save your profile to the cloud right now. Please try again."
          : "Could not save your profile.",
      );
    } finally {
      setBusy(false);
    }
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
                needsVerification
                  ? "Check your inbox."
                  : authTab === "signin"
                    ? "Sign in to tumeni."
                    : "Create your account.",
                "Make it yours.",
                "What’s your vibe?",
                "Good company starts here.",
              ][step]
            }
          </h1>
          <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">
            {
              [
                needsVerification
                  ? "Verify your email address so your account and circle stay synced across sessions."
                  : authTab === "signin"
                    ? "Welcome back. Your circle, saved drops, and profile stay synced in the cloud."
                    : "Join tumeni. with a real account synced across sessions.",
                "Upload your photo, set your city for local discovery, and pick your @handle.",
                "Pick the things you love.",
                "Your feed, reels, and circle are ready.",
              ][step]
            }
          </p>

          {step === 0 && !needsVerification && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void handleGoogleSignIn()}
                className="google-signin h-12 w-full gap-[10px] rounded-lg px-3 text-sm [&_svg]:size-[18px]"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <G />}
                Continue with Google
              </Button>

              <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-[#222228]" />
                or use email &amp; password
                <span className="h-px flex-1 bg-[#222228]" />
              </div>

              <div
                className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-[#222228] bg-[#141418] p-1"
                role="tablist"
                aria-label="Authentication mode"
              >
                {(
                  [
                    { id: "signin", label: "Sign In" },
                    { id: "signup", label: "Create Account" },
                  ] as const
                ).map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={authTab === t.id}
                    variant={authTab === t.id ? "secondary" : "ghost"}
                    onClick={() => {
                      setAuthTab(t.id);
                      setError("");
                      setInfoMsg("");
                    }}
                    className={
                      authTab === t.id
                        ? "bg-[#FFB800] font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                        : "text-muted-foreground hover:text-foreground"
                    }
                  >
                    {t.label}
                  </Button>
                ))}
              </div>

              <form className="space-y-4" onSubmit={(e) => void handleEmailAuth(e)}>
                <label className="block space-y-2 text-sm font-medium">
                  <span>Email address</span>
                  <input
                    className={field}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  <div className="flex items-center justify-between">
                    <span>Password</span>
                    {authTab === "signin" && (
                      <button
                        type="button"
                        onClick={() => void handleResetPassword()}
                        className="text-xs font-medium text-[#FFB800] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      className={`${field} pr-12`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      autoComplete={authTab === "signin" ? "current-password" : "new-password"}
                      placeholder={
                        authTab === "signin" ? "Enter your password" : "At least 6 characters"
                      }
                      minLength={6}
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

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400"
                  >
                    {error}
                  </p>
                )}
                {infoMsg && (
                  <p
                    role="status"
                    className="rounded-lg border border-[#FFB800]/30 bg-[#FFB800]/10 p-3 text-xs text-[#FFB800]"
                  >
                    {infoMsg}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={busy || !email.trim() || !password}
                  className="h-12 w-full bg-[#FFB800] font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>{authTab === "signin" ? "Sign In" : "Create Account"}</span>
                      <ArrowRight />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          {step === 0 && needsVerification && (
            <div className="space-y-4 rounded-2xl border border-[#222228] bg-[#141418] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#FFB800]/40 bg-[#0A0A0C] text-[#FFB800]">
                  <MailCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Verify your email</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {auth.currentUser?.email || email}
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Click the verification link sent to your inbox, then tap{" "}
                <span className="font-semibold text-foreground">I&apos;ve verified — Continue</span>
                .
              </p>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400"
                >
                  {error}
                </p>
              )}
              {infoMsg && (
                <p
                  role="status"
                  className="rounded-lg border border-[#FFB800]/30 bg-[#FFB800]/10 p-3 text-xs text-[#FFB800]"
                >
                  {infoMsg}
                </p>
              )}

              <div className="space-y-2.5 pt-1">
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCheckVerified()}
                  className="h-12 w-full bg-[#FFB800] font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>I&apos;ve verified — Continue</span>
                      <ArrowRight />
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleResendVerification()}
                    className="h-11 rounded-lg border-[#222228] bg-[#0A0A0C] text-xs"
                  >
                    Resend link
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void handleGoogleSignIn()}
                    className="h-11 gap-2 rounded-lg border-[#222228] bg-[#0A0A0C] text-xs"
                  >
                    <G />
                    <span>Use Google</span>
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void signOut(auth).catch(() => {});
                    setNeedsVerification(false);
                    setError("");
                    setInfoMsg("");
                  }}
                  className="w-full text-xs text-muted-foreground"
                >
                  Use another email
                </Button>
              </div>
            </div>
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
                  void compressAvatarFile(file)
                    .then((dataUrl) => {
                      setProfile((p) => ({ ...p, avatar: dataUrl }));
                      setError("");
                    })
                    .catch(() => {
                      setError("This photo could not be opened. Try another.");
                    })
                    .finally(() => setAvatarBusy(false));
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
              <div className="space-y-2">
                <label className="block space-y-2 text-sm font-medium">
                  <span>
                    What city / vibe zone are you in?{" "}
                    <span className="font-normal text-muted-foreground">· for People Near You</span>
                  </span>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-[#FFB800]" />
                    <input
                      className={`${field} pl-10`}
                      maxLength={80}
                      value={profile.location ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const { city } = normalizeCity(val);
                        setProfile((p) => ({ ...p, location: val, city }));
                      }}
                      placeholder="e.g. Johannesburg, Lagos, NYC, London..."
                    />
                  </div>
                </label>
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                  {POPULAR_CITIES.map((city) => {
                    const active =
                      (profile.location ?? "").trim().toLowerCase() === city.toLowerCase();
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setProfile((p) => ({ ...p, location: city, city }))}
                        className={`min-h-[32px] shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition ${
                          active
                            ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                            : "border-[#222228] bg-[#141418] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>
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
                <h2 className="mt-4 text-lg font-semibold">Your profile is synced</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {profile.location
                    ? `Local radar tuned for ${profile.location}. Discover real drops, reels, and creators near you.`
                    : "Discover real drops, reels, and creators inside."}
                </p>
              </div>
              {error && (
                <p role="alert" className="mt-4 text-sm text-red-400">
                  {error}
                </p>
              )}
              <Button
                disabled={busy}
                className="mt-7 h-12 w-full bg-[#FFB800] text-[#0A0A0C] hover:bg-[#FFB800]/90"
                onClick={() => void handleFinishOnboarding()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Enter Tumeni</span>
                    <ArrowRight />
                  </>
                )}
              </Button>
            </>
          )}

          {step > 0 && (
            <Button
              variant="ghost"
              className="mt-5 px-0 text-muted-foreground"
              onClick={() => {
                setError("");
                if (step === 1 && auth.currentUser) {
                  void signOut(auth).catch(() => {});
                  setAccount("");
                  setNeedsVerification(false);
                }
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
