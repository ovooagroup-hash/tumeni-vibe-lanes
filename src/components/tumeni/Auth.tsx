import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ExternalLink,
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
  browserPopupRedirectResolver,
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { auth, googleProvider } from "@/lib/firebase";
import { fetchCloudProfile, saveCloudProfile } from "@/lib/tumeni-db";
import firebaseConfig from "../../../firebase-applet-config.json";
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

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            use_fedcm_for_prompt?: boolean;
            use_fedcm_for_button?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const hasSupabaseConfig = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

const G = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">
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

const steps = ["Welcome", "Profile", "Interests", "Circle"];
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

function getAuthErrorCode(err: unknown): string {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code?: string }).code ?? "")
    : "";
}

function formatAuthError(err: unknown): string {
  const code = getAuthErrorCode(err);
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  switch (code) {
    case "auth/unauthorized-domain":
      return `Google sign-in via Firebase is waiting for "${host}" to be added to Firebase Console → Authentication → Settings → Authorized domains. You can sign in with Email & Password below right now.`;
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
      return "Mobile preview closed the Google popup before finishing. Use Open in Full Tab below or sign in with Email & Password.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google popup. Use Open in Full Tab below or sign in with Email & Password.";
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
  const currentUser = !hasSupabaseConfig ? auth.currentUser : null;
  const startNeedsVerify = Boolean(currentUser && !currentUser.emailVerified);
  const startAtOnboarding = Boolean(initialAccount && currentUser && currentUser.emailVerified);

  const [step, setStep] = useState(startAtOnboarding ? 1 : 0);
  const [account, setAccount] = useState(initialAccount ?? currentUser?.uid ?? "");
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(startNeedsVerify);
  const [googleFallbackHelp, setGoogleFallbackHelp] = useState(false);
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
  const gisLoadedRef = useRef(false);

  const hydrateOrStartOnboarding = useCallback(
    async (
      uid: string,
      userEmail: string,
      displayName?: string | null,
      existingProfile?: SetupProfile | null,
    ) => {
      if (existingProfile) {
        onLogin(uid, existingProfile);
        return;
      }

      if (!hasSupabaseConfig && !uid.startsWith("srv_")) {
        try {
          const cloud = await fetchCloudProfile(uid);
          if (cloud?.profile) {
            onLogin(uid, cloud.profile);
            return;
          }
        } catch {
          /* Check local backup or proceed to onboarding. */
        }
      }

      try {
        const localBackup = readSetup(localStorage.getItem(`tumeni-setup:${uid}`));
        if (localBackup) {
          if (hasSupabaseConfig) {
            await supabase.auth.updateUser({ data: { tumeni_profile: localBackup } });
          } else if (uid.startsWith("srv_")) {
            await fetch("/api/auth/profile", {
              method: "PUT",
              headers: { "content-type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ profile: localBackup }),
            });
          } else {
            await saveCloudProfile(uid, userEmail, localBackup);
          }
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
      setGoogleFallbackHelp(false);
      setProfile((prev) => ({
        ...prev,
        name: prev.name || fallbackName.slice(0, 50),
        handle: prev.handle || sanitizeHandle(userEmail.split("@")[0] || fallbackName),
      }));
      setStep(1);
      window.scrollTo(0, 0);
    },
    [onLogin],
  );

  useEffect(() => {
    if (hasSupabaseConfig) {
      if (initialAccount && step === 0) {
        setAccount(initialAccount);
        setNeedsVerification(false);
        setStep(1);
      }
      return;
    }

    const fbUser = auth.currentUser;
    if (initialAccount && fbUser && initialAccount === fbUser.uid) {
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
    } else if (initialAccount && initialAccount.startsWith("srv_") && step === 0) {
      setAccount(initialAccount);
      setNeedsVerification(false);
      setStep(1);
    }
  }, [initialAccount, step, needsVerification]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_notice") === "1") {
      setInfoMsg(
        "Google sign-in isn't enabled on this preview host yet. Sign in with Email & Password below.",
      );
      params.delete("oauth_notice");
      const nextSearch = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`,
      );
    }
  }, []);

  useEffect(() => {
    if (hasSupabaseConfig) return;
    let active = true;
    void getRedirectResult(auth)
      .then(async (res) => {
        if (!active || !res?.user) return;
        setBusy(true);
        await hydrateOrStartOnboarding(res.user.uid, res.user.email ?? "", res.user.displayName);
      })
      .catch((err) => {
        if (!active) return;
        const code = getAuthErrorCode(err);
        if (code && code !== "auth/no-auth-event") {
          setError(formatAuthError(err));
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [hydrateOrStartOnboarding]);

  useEffect(() => {
    if (
      hasSupabaseConfig ||
      typeof window === "undefined" ||
      gisLoadedRef.current ||
      !firebaseConfig.oAuthClientId
    ) {
      return;
    }
    gisLoadedRef.current = true;

    const initGis = () => {
      const gisId = window.google?.accounts?.id;
      if (!gisId) return;
      try {
        gisId.initialize({
          client_id: firebaseConfig.oAuthClientId,
          use_fedcm_for_prompt: true,
          use_fedcm_for_button: true,
          callback: (response) => {
            const token = response.credential;
            if (!token) return;
            setBusy(true);
            setError("");
            setGoogleFallbackHelp(false);
            const credential = GoogleAuthProvider.credential(token);
            void signInWithCredential(auth, credential)
              .then((cred) =>
                hydrateOrStartOnboarding(
                  cred.user.uid,
                  cred.user.email ?? "",
                  cred.user.displayName,
                ),
              )
              .catch((err) => {
                setError(formatAuthError(err));
              })
              .finally(() => {
                setBusy(false);
              });
          },
        });
      } catch {
        /* GIS fallback stays optional. */
      }
    };

    if (window.google?.accounts?.id) {
      initGis();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      existingScript.addEventListener("load", initGis);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGis;
    document.head.appendChild(script);
  }, [hydrateOrStartOnboarding]);

  const next = () => {
    setError("");
    setInfoMsg("");
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setInfoMsg("");
    setGoogleFallbackHelp(false);
    setBusy(true);

    if (hasSupabaseConfig) {
      try {
        const hostname = typeof window !== "undefined" ? window.location.hostname : "";
        const isLovableHost =
          /(^|\.)(lovableproject\.com|lovableproject-dev\.com|lovable\.app|lovable\.dev|gpt-eng\.com|gptengineer\.run)$/i.test(
            hostname,
          );

        if (isLovableHost) {
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin,
          });
          if (result.redirected) return;
          if (result.error) {
            setError(result.error.message || "Google sign-in could not complete.");
            return;
          }
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            const meta = data.user.user_metadata as Record<string, unknown> | undefined;
            const existingProfile =
              meta?.["tumeni_profile"] && typeof meta["tumeni_profile"] === "object"
                ? readSetup(JSON.stringify(meta["tumeni_profile"]))
                : null;
            const displayName =
              typeof meta?.["full_name"] === "string"
                ? meta["full_name"]
                : typeof meta?.["name"] === "string"
                  ? meta["name"]
                  : null;
            await hydrateOrStartOnboarding(
              data.user.id,
              data.user.email ?? "",
              displayName,
              existingProfile,
            );
          }
          return;
        }

        const { error: oauthErr } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (oauthErr) {
          setError(oauthErr.message);
        }
      } catch (err) {
        setError(formatAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      const cred = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      await hydrateOrStartOnboarding(cred.user.uid, cred.user.email ?? "", cred.user.displayName);
    } catch (err) {
      const code = getAuthErrorCode(err);
      const isPopupFailure =
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-blocked";
      const isIframe = typeof window !== "undefined" && window.self !== window.top;

      if (code === "auth/unauthorized-domain") {
        try {
          window.google?.accounts?.id?.prompt();
        } catch {
          /* Fall through to helpful domain guidance. */
        }
        setError(formatAuthError(err));
        return;
      }

      if (isPopupFailure && !isIframe) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setError(formatAuthError(redirectErr));
          return;
        }
      }

      if (isPopupFailure && isIframe) {
        try {
          window.google?.accounts?.id?.prompt();
        } catch {
          /* Show explicit full-tab and redirect fallback controls below. */
        }
        setGoogleFallbackHelp(true);
      }
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setError("");
    setInfoMsg("");
    setBusy(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setError(formatAuthError(err));
      setBusy(false);
    }
  };

  const handleServerEmailAuth = async (cleanEmail: string) => {
    const endpoint = authTab === "signin" ? "/api/auth/signin" : "/api/auth/signup";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const data = (await res.json()) as {
      error?: string;
      user?: { uid?: string; email?: string };
      profile?: SetupProfile | null;
    };
    if (!res.ok || !data.user?.uid) {
      setError(data.error || "Authentication failed. Please try again.");
      return;
    }
    await hydrateOrStartOnboarding(
      data.user.uid,
      data.user.email ?? cleanEmail,
      null,
      data.profile ?? null,
    );
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    setError("");
    setInfoMsg("");
    setGoogleFallbackHelp(false);
    setBusy(true);

    if (hasSupabaseConfig) {
      try {
        if (authTab === "signin") {
          const { data, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (signInErr) {
            setError(signInErr.message);
            return;
          }
          if (data.user) {
            const meta = data.user.user_metadata as Record<string, unknown> | undefined;
            const existingProfile =
              meta?.["tumeni_profile"] && typeof meta["tumeni_profile"] === "object"
                ? readSetup(JSON.stringify(meta["tumeni_profile"]))
                : null;
            await hydrateOrStartOnboarding(
              data.user.id,
              data.user.email ?? cleanEmail,
              null,
              existingProfile,
            );
          }
        } else {
          const { data, error: signUpErr } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          });
          if (signUpErr) {
            setError(signUpErr.message);
            return;
          }
          if (data.session && data.user) {
            await hydrateOrStartOnboarding(data.user.id, data.user.email ?? cleanEmail, null);
          } else {
            setInfoMsg(`Check ${cleanEmail} to confirm your account, then sign in.`);
            setAuthTab("signin");
          }
        }
      } catch (err) {
        setError(formatAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

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
      const code = getAuthErrorCode(err);
      if (code === "auth/operation-not-allowed" || code === "auth/unauthorized-domain") {
        try {
          await handleServerEmailAuth(cleanEmail);
        } catch {
          setError("Could not reach the sign-in service. Check your connection and try again.");
        }
      } else {
        setError(formatAuthError(err));
      }
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

    if (hasSupabaseConfig) {
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        });
        if (resetErr) setError(resetErr.message);
        else setInfoMsg(`Password reset email sent to ${cleanEmail}.`);
      } catch (err) {
        setError(formatAuthError(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setInfoMsg(`Password reset email sent to ${cleanEmail}.`);
    } catch (err) {
      const code = getAuthErrorCode(err);
      if (code === "auth/operation-not-allowed" || code === "auth/unauthorized-domain") {
        setInfoMsg(
          "Password reset emails activate once Email/Password is enabled for this domain in Firebase Console.",
        );
      } else {
        setError(formatAuthError(err));
      }
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
    const uid = (!hasSupabaseConfig ? auth.currentUser?.uid : undefined) || account;
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
      if (hasSupabaseConfig) {
        const { error: updateErr } = await supabase.auth.updateUser({
          data: { tumeni_profile: finalProfile },
        });
        if (updateErr) {
          setError(updateErr.message);
          return;
        }
      } else if (uid.startsWith("srv_")) {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ profile: finalProfile }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: string };
          setError(payload.error || "Could not save your profile right now.");
          return;
        }
      } else {
        await saveCloudProfile(uid, auth.currentUser?.email ?? email, finalProfile);
      }
      onLogin(uid, finalProfile);
    } catch (err) {
      setError(
        err instanceof Error
          ? "Could not save your profile right now. Please try again."
          : "Could not save your profile.",
      );
    } finally {
      setBusy(false);
    }
  };

  const select = (key: "interests" | "following" | "friends", id: string) =>
    setProfile((p) => ({ ...p, [key]: toggleSelection(p[key], id) }));

  const field =
    "min-h-[48px] w-full rounded-xl border border-[#2A2A32] bg-[#0A0A0C] px-4 text-base text-foreground outline-none transition duration-150 focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800] placeholder:text-zinc-500";

  const initial = (profile.name.trim() || profile.handle.trim() || "T").charAt(0).toUpperCase();
  const fullTabHref = typeof window !== "undefined" ? window.location.href : "/";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-[#0A0A0C] text-foreground">
      {/* Subtle Amber Glow Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[360px] w-[520px] -translate-x-1/2 rounded-full bg-[#FFB800]/[0.09] blur-[130px]" />
      </div>

      {/* Minimal Brand Header */}
      <header className="relative z-10 border-b border-[#222228]/80 bg-[#0A0A0C]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
            <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
            <Wordmark className="text-xl sm:text-2xl" />
          </div>
          <p className="truncate text-xs font-medium tracking-wide text-zinc-400">
            Social · Audio · Video
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className={`w-full ${step < 2 ? "max-w-md" : "max-w-2xl"}`}>
          <section className="relative overflow-hidden rounded-3xl border border-[#222228] bg-[#141418]/95 p-6 shadow-2xl shadow-black/60 sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#FFB800]/[0.06] to-transparent"
            />

            <div className="relative">
              {step > 0 && (
                <ol
                  aria-label="Setup progress"
                  className="mb-7 flex items-start justify-between gap-2"
                >
                  {steps.map((label, i) => (
                    <li
                      key={label}
                      aria-current={step === i ? "step" : undefined}
                      className="flex flex-1 flex-col gap-1.5"
                    >
                      <span
                        className={`h-1 rounded-full transition-colors ${
                          i <= step ? "bg-[#FFB800]" : "bg-[#26262E]"
                        }`}
                      />
                      <span
                        className={`truncate text-[11px] sm:text-xs ${
                          i === step ? "font-semibold text-[#FFB800]" : "text-zinc-500"
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <div className="animate-rise" key={step}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFB800]">
                  {step === 0 ? "Welcome to Tumeni" : `Step ${step + 1} of 4`}
                </p>
                <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {
                    [
                      needsVerification
                        ? "Check your inbox."
                        : authTab === "signin"
                          ? "Sign in to Tumeni."
                          : "Create your account.",
                      "Make it yours.",
                      "What are you into?",
                      "Your circle is ready.",
                    ][step]
                  }
                </h1>
                <p className="mb-6 mt-2 text-sm leading-relaxed text-zinc-400">
                  {
                    [
                      needsVerification
                        ? "Verify your email address so your account stays synced."
                        : authTab === "signin"
                          ? "Sign in to access your feed, drops, and circle."
                          : "Create your account to join tumeni.",
                      "Add a photo, set your city for local discovery, and claim your @handle.",
                      "Pick the lanes you want first in your For You feed.",
                      "Your reels, audio drops, and local circle are ready.",
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
                      className="google-signin min-h-[48px] w-full gap-2.5 rounded-xl px-4 text-sm font-semibold [&_svg]:size-[18px]"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <G />}
                      <span>Continue with Google</span>
                    </Button>

                    <div className="my-5 flex items-center gap-3 text-xs text-zinc-500">
                      <span className="h-px flex-1 bg-[#26262E]" />
                      <span>or continue with email</span>
                      <span className="h-px flex-1 bg-[#26262E]" />
                    </div>

                    <div
                      className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-[#26262E] bg-[#0A0A0C] p-1"
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
                            setGoogleFallbackHelp(false);
                          }}
                          className={`min-h-[44px] whitespace-nowrap rounded-lg text-sm ${
                            authTab === t.id
                              ? "bg-[#FFB800] font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {t.label}
                        </Button>
                      ))}
                    </div>

                    <form className="space-y-4" onSubmit={(e) => void handleEmailAuth(e)}>
                      <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
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
                      <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
                        <div className="flex items-center justify-between gap-2">
                          <span>Password</span>
                          {authTab === "signin" && (
                            <button
                              type="button"
                              onClick={() => void handleResetPassword()}
                              className="min-h-[32px] text-xs font-medium text-[#FFB800] hover:underline"
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
                            autoComplete={
                              authTab === "signin" ? "current-password" : "new-password"
                            }
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
                            className="absolute right-1.5 top-1 h-10 w-10 text-zinc-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                      </label>

                      {error && (
                        <div
                          role="alert"
                          className="space-y-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
                        >
                          <p className="leading-relaxed">{error}</p>
                          {googleFallbackHelp && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              <a
                                href={fullTabHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-[#0A0A0C] transition hover:bg-zinc-200"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Open in Full Tab for Google</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => void handleGoogleRedirect()}
                                className="inline-flex min-h-[40px] items-center rounded-lg border border-white/20 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10"
                              >
                                Try Redirect Sign-In
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {infoMsg && (
                        <p
                          role="status"
                          className="rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/10 p-3.5 text-xs leading-relaxed text-[#FFB800]"
                        >
                          {infoMsg}
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={busy || !email.trim() || !password}
                        className="min-h-[48px] w-full rounded-xl bg-[#FFB800] text-sm font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
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
                  <div className="space-y-4 rounded-2xl border border-[#26262E] bg-[#0A0A0C] p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#FFB800]/40 bg-[#141418] text-[#FFB800]">
                        <MailCheck className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">Verify your email</p>
                        <p className="truncate text-xs text-zinc-400">
                          {auth.currentUser?.email || email}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-zinc-400">
                      Click the verification link sent to your inbox, then tap{" "}
                      <span className="font-semibold text-white">
                        I&apos;ve verified — Continue
                      </span>
                      .
                    </p>

                    {error && (
                      <p
                        role="alert"
                        className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
                      >
                        {error}
                      </p>
                    )}
                    {infoMsg && (
                      <p
                        role="status"
                        className="rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/10 p-3 text-xs text-[#FFB800]"
                      >
                        {infoMsg}
                      </p>
                    )}

                    <div className="space-y-2.5 pt-1">
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleCheckVerified()}
                        className="min-h-[48px] w-full rounded-xl bg-[#FFB800] font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
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
                          className="min-h-[44px] rounded-xl border-[#26262E] bg-[#141418] text-xs"
                        >
                          Resend link
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void handleGoogleSignIn()}
                          className="min-h-[44px] gap-2 rounded-xl border-[#26262E] bg-[#141418] text-xs"
                        >
                          <G />
                          <span>Use Google</span>
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setNeedsVerification(false);
                          setError("");
                          setInfoMsg("");
                          void signOut(auth).catch(() => {});
                        }}
                        className="min-h-[44px] w-full text-xs text-zinc-400"
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
                    <div className="flex items-center gap-4 rounded-2xl border border-[#26262E] bg-[#0A0A0C] p-4">
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="Your uploaded avatar"
                          referrerPolicy="no-referrer"
                          className="h-20 w-20 shrink-0 rounded-full border-2 border-[#FFB800] object-cover"
                        />
                      ) : (
                        <div
                          aria-label="Tumeni monogram avatar"
                          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-[#FFB800] bg-[#141418] text-2xl font-bold tracking-tight text-[#FFB800]"
                        >
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">Profile photo</p>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {profile.avatar
                            ? "Custom photo selected from your device."
                            : "Using your gold monogram by default."}
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
                              className="min-h-[44px] text-xs text-zinc-400 hover:text-white"
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
                    <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
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
                    <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
                      <span>@handle</span>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-zinc-500">@</span>
                        <input
                          className={`${field} pl-9`}
                          maxLength={24}
                          autoCapitalize="none"
                          spellCheck={false}
                          value={profile.handle}
                          onChange={(e) =>
                            setProfile((p) => ({
                              ...p,
                              handle: e.target.value.replace(/^@/, ""),
                            }))
                          }
                          placeholder="your.handle"
                          required
                        />
                      </div>
                    </label>
                    <div className="space-y-2">
                      <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
                        <span>
                          What city are you in?{" "}
                          <span className="font-normal text-zinc-400">· for People Near You</span>
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
                              className={`min-h-[36px] shrink-0 whitespace-nowrap rounded-xl border px-3 text-xs font-medium transition ${
                                active
                                  ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                                  : "border-[#26262E] bg-[#0A0A0C] text-zinc-400 hover:text-white"
                              }`}
                            >
                              {city}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
                      <span>
                        Bio <span className="font-normal text-zinc-400">· optional</span>
                      </span>
                      <textarea
                        className={`${field} h-24 resize-none py-3`}
                        maxLength={160}
                        value={profile.bio}
                        onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="A little about you…"
                      />
                      <span className="block text-right text-xs tabular-nums text-zinc-500">
                        {profile.bio.length}/160
                      </span>
                    </label>
                    {error && (
                      <p role="alert" className="text-sm text-red-400">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={avatarBusy}
                      className="min-h-[48px] w-full rounded-xl bg-[#FFB800] font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                    >
                      <span>Continue</span>
                      <ArrowRight />
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
                            type="button"
                            variant="outline"
                            aria-pressed={selected}
                            onClick={() => select("interests", label)}
                            className={`relative h-auto flex-col items-start gap-0 overflow-hidden rounded-2xl bg-[#0A0A0C] p-0 text-left whitespace-normal ${
                              selected
                                ? "border-[#FFB800] ring-1 ring-[#FFB800]"
                                : "border-[#26262E] hover:border-[#FFB800]/50"
                            }`}
                          >
                            <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-[#1C1810] via-[#141418] to-[#0A0A0C] text-[#FFB800]">
                              <Icon className="h-11 w-11" />
                              <span
                                className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                                  selected
                                    ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                                    : "border-white/30 bg-[#0A0A0C]/70"
                                }`}
                              >
                                {selected && <Check className="h-3.5 w-3.5" />}
                              </span>
                            </div>
                            <span className="flex min-h-14 w-full items-center border-t border-[#26262E] bg-[#141418] px-3.5 py-2.5 text-sm font-medium text-white">
                              {label}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                    <div className="mt-7 flex items-center justify-between gap-4">
                      <span className="text-sm tabular-nums text-zinc-400">
                        {profile.interests.length} selected
                      </span>
                      <Button
                        type="button"
                        className="min-h-[48px] rounded-xl bg-[#FFB800] px-6 font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                        disabled={!profile.interests.length}
                        onClick={next}
                      >
                        <span>Continue</span>
                        <ArrowRight />
                      </Button>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="rounded-2xl border border-[#26262E] bg-[#0A0A0C] px-5 py-8 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#FFB800]/40 bg-[#141418] text-[#FFB800]">
                        <Check className="h-7 w-7" />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-white">
                        Your profile is synced
                      </h2>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
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
                      type="button"
                      disabled={busy}
                      className="mt-7 min-h-[48px] w-full rounded-xl bg-[#FFB800] font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
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
                    type="button"
                    variant="ghost"
                    className="mt-4 min-h-[44px] px-0 text-zinc-400 hover:text-white"
                    onClick={() => {
                      setError("");
                      if (step === 1) {
                        if (hasSupabaseConfig) {
                          void supabase.auth.signOut().catch(() => {});
                        } else if (auth.currentUser) {
                          void signOut(auth).catch(() => {});
                          setNeedsVerification(false);
                        } else if (account.startsWith("srv_")) {
                          void fetch("/api/auth/logout", {
                            method: "POST",
                            credentials: "same-origin",
                          }).catch(() => {});
                        }
                        setAccount("");
                      }
                      setStep((s) => s - 1);
                    }}
                  >
                    <ArrowLeft />
                    <span>Back</span>
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
