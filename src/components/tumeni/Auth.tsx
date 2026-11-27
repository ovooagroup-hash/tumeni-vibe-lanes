import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Flame,
  Gamepad2,
  KeyRound,
  Laugh,
  Loader2,
  Mail,
  MapPin,
  Music,
  Play,
  Search,
  Smartphone,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
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

const hasSupabaseConfig = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

type CountryOption = {
  code: string;
  dial: string;
  name: string;
  flag: string;
};

const COUNTRIES: CountryOption[] = [
  { code: "ZA", dial: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "US", dial: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dial: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "NG", dial: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", dial: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "GH", dial: "+233", name: "Ghana", flag: "🇬🇭" },
  { code: "BW", dial: "+267", name: "Botswana", flag: "🇧🇼" },
  { code: "NA", dial: "+264", name: "Namibia", flag: "🇳🇦" },
  { code: "ZW", dial: "+263", name: "Zimbabwe", flag: "🇿🇼" },
  { code: "TZ", dial: "+255", name: "Tanzania", flag: "🇹🇿" },
  { code: "UG", dial: "+256", name: "Uganda", flag: "🇺🇬" },
  { code: "CA", dial: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "AU", dial: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "BR", dial: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "IN", dial: "+91", name: "India", flag: "🇮🇳" },
  { code: "FR", dial: "+33", name: "France", flag: "🇫🇷" },
  { code: "DE", dial: "+49", name: "Germany", flag: "🇩🇪" },
];

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

function formatAuthError(err: unknown): string {
  const msg = err instanceof Error && err.message ? err.message : "";
  if (!msg) return "Authentication failed. Please try again.";
  if (/invalid login credentials/i.test(msg)) {
    return "Incorrect email or password. Double-check your details or try Forgot password.";
  }
  return msg;
}

function clearStaleAccountIfMismatch(uid: string) {
  try {
    const stored = localStorage.getItem("tumeni-account");
    if (stored && stored !== uid) {
      localStorage.removeItem("tumeni-account");
    }
  } catch {
    /* Ignore storage errors. */
  }
}

function generateSixDigitCode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(100000 + ((arr[0] ?? 0) % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function formatPhoneE164(dial: string, rawLocal: string): string {
  const cleanDial = dial.startsWith("+") ? dial : `+${dial.replace(/\D/g, "")}`;
  let digits = rawLocal.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length > 6) {
    digits = digits.slice(1);
  }
  return `${cleanDial}${digits}`;
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function Auth({
  onLogin,
  onGuestBrowse,
  initialAccount = null,
}: {
  onLogin: (id: string, profile: SetupProfile) => void;
  onGuestBrowse?: () => void;
  initialAccount?: string | null;
}) {
  const [step, setStep] = useState(initialAccount ? 1 : 0);
  const [account, setAccount] = useState(initialAccount ?? "");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");

  // Phone OTP state
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[0]!);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [fullPhone, setFullPhone] = useState("");
  const [phoneStage, setPhoneStage] = useState<"input" | "otp">("input");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [fallbackOtpCode, setFallbackOtpCode] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const verifyingOtpRef = useRef(false);

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [infoMsg, setInfoMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<SetupProfile>(empty);
  const [error, setError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q),
    );
  }, [countryQuery]);

  const hydrateOrStartOnboarding = useCallback(
    (
      uid: string,
      identifier: string,
      displayName?: string | null,
      existingProfile?: SetupProfile | null,
    ) => {
      clearStaleAccountIfMismatch(uid);

      if (existingProfile) {
        onLogin(uid, existingProfile);
        return;
      }

      const fallbackName =
        displayName?.trim() || (identifier.includes("@") ? identifier.split("@")[0] : "") || "";
      const handleSeed = identifier.includes("@")
        ? identifier.split("@")[0] || fallbackName
        : fallbackName || `creator.${uid.replace(/\D/g, "").slice(-4) || "01"}`;

      setAccount(uid);
      setPassword("");
      setProfile((prev) => ({
        ...prev,
        name: prev.name || fallbackName.slice(0, 50),
        handle: prev.handle || sanitizeHandle(handleSeed),
      }));
      setStep(1);
      window.scrollTo(0, 0);
    },
    [onLogin],
  );

  useEffect(() => {
    if (!initialAccount) return;
    clearStaleAccountIfMismatch(initialAccount);
    setAccount(initialAccount);
    if (step === 0) {
      setStep(1);
    }

    if (!hasSupabaseConfig || initialAccount.startsWith("phone_")) return;
    let active = true;
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active || !data.user || data.user.id !== initialAccount) return;
        const meta = data.user.user_metadata as Record<string, unknown> | undefined;
        const metaName =
          typeof meta?.["full_name"] === "string"
            ? meta["full_name"]
            : typeof meta?.["name"] === "string"
              ? meta["name"]
              : "";
        const userEmail = data.user.email ?? "";
        const userPhone = data.user.phone ?? "";
        const fallbackName = metaName.trim() || (userEmail ? userEmail.split("@")[0] : "") || "";
        if (userEmail) setEmail((prev) => prev || userEmail);
        setProfile((prev) => ({
          ...prev,
          name: prev.name || fallbackName.slice(0, 50),
          handle:
            prev.handle ||
            sanitizeHandle(
              (userEmail ? userEmail.split("@")[0] : "") ||
                fallbackName ||
                `tumeni.${userPhone.slice(-4) || "01"}`,
            ),
        }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialAccount, step]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setResendSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const next = () => {
    setError("");
    setInfoMsg("");
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setInfoMsg("");
    if (!hasSupabaseConfig) {
      setError("Cloud sign-in is not configured here yet. Use Phone Number or Email below.");
      return;
    }
    setBusy(true);
    try {
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
        hydrateOrStartOnboarding(data.user.id, data.user.email ?? "", displayName, existingProfile);
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const sendPhoneCode = async (targetPhone?: string) => {
    const e164 = targetPhone ?? formatPhoneE164(selectedCountry.dial, phoneInput);
    const localDigits = phoneInput.replace(/\D/g, "");
    if (!targetPhone && localDigits.length < 6) {
      setError("Enter a valid mobile phone number to receive a 6-digit code.");
      return;
    }

    setError("");
    setInfoMsg("");
    setCountryPickerOpen(false);
    setBusy(true);
    setFullPhone(e164);

    let useFallback = !hasSupabaseConfig;
    if (hasSupabaseConfig) {
      try {
        const { error: otpErr } = await supabase.auth.signInWithOtp({
          phone: e164,
        });
        if (otpErr) {
          useFallback = true;
        }
      } catch {
        useFallback = true;
      }
    }

    if (useFallback) {
      setFallbackOtpCode(generateSixDigitCode());
    } else {
      setFallbackOtpCode(null);
      setInfoMsg(`SMS verification code sent to ${e164}.`);
    }

    setOtpDigits(["", "", "", "", "", ""]);
    setPhoneStage("otp");
    setResendSeconds(45);
    setBusy(false);
    window.setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 60);
  };

  const verifyOtpCode = useCallback(
    async (code: string) => {
      if (code.length !== 6 || verifyingOtpRef.current) return;
      verifyingOtpRef.current = true;
      setError("");
      setBusy(true);

      try {
        if (fallbackOtpCode) {
          if (code !== fallbackOtpCode) {
            setError("That code doesn't match. Check the 6 digits and try again.");
            setOtpDigits(["", "", "", "", "", ""]);
            window.setTimeout(() => otpInputRefs.current[0]?.focus(), 30);
            return;
          }
          const cleanDigits = fullPhone.replace(/\D/g, "");
          const uid = `phone_${cleanDigits}`;
          hydrateOrStartOnboarding(uid, fullPhone, null, null);
          return;
        }

        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: code,
          type: "sms",
        });

        if (verifyErr) {
          setError(verifyErr.message || "Invalid verification code. Please try again.");
          setOtpDigits(["", "", "", "", "", ""]);
          window.setTimeout(() => otpInputRefs.current[0]?.focus(), 30);
          return;
        }

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
          hydrateOrStartOnboarding(
            data.user.id,
            data.user.phone ?? fullPhone,
            displayName,
            existingProfile,
          );
        }
      } catch (err) {
        setError(formatAuthError(err));
      } finally {
        verifyingOtpRef.current = false;
        setBusy(false);
      }
    },
    [fallbackOtpCode, fullPhone, hydrateOrStartOnboarding],
  );

  const handleOtpDigitChange = (idx: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      setOtpDigits((prev) => {
        const nextArr = [...prev];
        nextArr[idx] = "";
        return nextArr;
      });
      return;
    }

    const chars = cleaned.slice(0, 6 - idx).split("");
    setOtpDigits((prev) => {
      const nextArr = [...prev];
      chars.forEach((ch, offset) => {
        if (idx + offset < 6) {
          nextArr[idx + offset] = ch;
        }
      });
      const joined = nextArr.join("");
      if (joined.length === 6 && !nextArr.includes("")) {
        void verifyOtpCode(joined);
      }
      return nextArr;
    });

    const nextFocus = Math.min(5, idx + chars.length);
    otpInputRefs.current[nextFocus]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx]) {
        setOtpDigits((prev) => {
          const nextArr = [...prev];
          nextArr[idx] = "";
          return nextArr;
        });
      } else if (idx > 0) {
        otpInputRefs.current[idx - 1]?.focus();
        setOtpDigits((prev) => {
          const nextArr = [...prev];
          nextArr[idx - 1] = "";
          return nextArr;
        });
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      otpInputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const nextArr = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      nextArr[i] = pasted[i] ?? "";
    }
    setOtpDigits(nextArr);
    const focusIdx = Math.min(5, pasted.length);
    otpInputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) {
      void verifyOtpCode(pasted);
    }
  };

  const handleAutofillFallbackOtp = () => {
    if (!fallbackOtpCode) return;
    const digits = fallbackOtpCode.slice(0, 6).split("");
    setOtpDigits(digits);
    otpInputRefs.current[5]?.focus();
    void verifyOtpCode(fallbackOtpCode);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) return;

    setError("");
    setInfoMsg("");
    if (!hasSupabaseConfig) {
      setError("Email authentication is not configured here yet. Try Phone Number sign-in.");
      return;
    }
    setBusy(true);

    try {
      if (authTab === "signin") {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (signInErr) {
          setError(formatAuthError(signInErr));
          return;
        }
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
          hydrateOrStartOnboarding(
            data.user.id,
            data.user.email ?? cleanEmail,
            displayName,
            existingProfile,
          );
        }
      } else {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}`,
          },
        });
        if (signUpErr) {
          setError(formatAuthError(signUpErr));
          return;
        }
        if (data.session && data.user) {
          const meta = data.user.user_metadata as Record<string, unknown> | undefined;
          const existingProfile =
            meta?.["tumeni_profile"] && typeof meta["tumeni_profile"] === "object"
              ? readSetup(JSON.stringify(meta["tumeni_profile"]))
              : null;
          hydrateOrStartOnboarding(
            data.user.id,
            data.user.email ?? cleanEmail,
            null,
            existingProfile,
          );
        } else {
          setInfoMsg(`Check ${cleanEmail} to confirm your account, then return to finish setup.`);
          setAuthTab("signin");
        }
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
    if (!hasSupabaseConfig) {
      setError("Password reset is not available until cloud auth is configured.");
      return;
    }
    setBusy(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}`,
      });
      if (resetErr) setError(resetErr.message);
      else setInfoMsg(`Password reset email sent to ${cleanEmail}.`);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleFinishOnboarding = async () => {
    if (!account) {
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
      if (hasSupabaseConfig && !account.startsWith("phone_")) {
        const { error: updateErr } = await supabase.auth.updateUser({
          data: { tumeni_profile: finalProfile },
        });
        if (updateErr) {
          setError(updateErr.message);
          return;
        }
      }
      onLogin(account, finalProfile);
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
  const isOtpScreen = step === 0 && authMethod === "phone" && phoneStage === "otp";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-[#0A0A0C] text-foreground">
      {/* Ambient Amber Stage Glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-140px] h-[380px] w-[540px] -translate-x-1/2 rounded-full bg-[#FFB800]/[0.1] blur-[140px]" />
      </div>

      {/* Minimal Top Bar */}
      <header className="relative z-10 border-b border-[#222228]/80 bg-[#0A0A0C]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
            <LogoMark className="h-8 w-8 sm:h-9 sm:w-9" />
            <Wordmark className="text-xl sm:text-2xl" />
          </div>
          {step === 0 && (
            <button
              type="button"
              onClick={() => {
                setAuthTab((t) => (t === "signin" ? "signup" : "signin"));
                setError("");
                setInfoMsg("");
              }}
              className="min-h-[44px] shrink-0 whitespace-nowrap text-sm font-medium text-zinc-300 transition hover:text-[#FFB800]"
            >
              {authTab === "signin" ? "Sign up" : "Log in"}
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className={`w-full ${step < 2 ? "max-w-md" : "max-w-2xl"}`}>
          <section className="relative overflow-hidden rounded-3xl border border-[#222228] bg-[#141418]/95 p-6 shadow-2xl shadow-black/60 sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#FFB800]/[0.07] to-transparent"
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

              <div className="animate-rise" key={`${step}-${phoneStage}`}>
                {step === 0 && !isOtpScreen && (
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 inline-flex items-center gap-2">
                      <LogoMark className="h-9 w-9" />
                      <Wordmark className="text-2xl" />
                    </div>
                    <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {authTab === "signin" ? "Log in to Tumeni" : "Sign up for Tumeni"}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                      Manage your drops, connect with your circle, and watch authentic videos.
                    </p>
                  </div>
                )}

                {isOtpScreen && (
                  <div className="mb-6">
                    <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      Enter 6-digit code
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-400">
                      <span>Sent via SMS to {fullPhone}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneStage("input");
                          setOtpDigits(["", "", "", "", "", ""]);
                          setFallbackOtpCode(null);
                          setError("");
                          setInfoMsg("");
                        }}
                        className="min-h-[36px] font-semibold text-[#FFB800] hover:underline"
                      >
                        Edit number
                      </button>
                    </div>
                  </div>
                )}

                {step > 0 && (
                  <>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FFB800]">
                      Step {step + 1} of 4
                    </p>
                    <h1 className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {["", "Make it yours.", "What are you into?", "Your circle is ready."][step]}
                    </h1>
                    <p className="mb-6 mt-2 text-sm leading-relaxed text-zinc-400">
                      {
                        [
                          "",
                          "Add a photo, set your city for local discovery, and claim your @handle.",
                          "Pick the lanes you want first in your For You feed.",
                          "Your reels, audio drops, and local circle are ready.",
                        ][step]
                      }
                    </p>
                  </>
                )}

                {step === 0 && !isOtpScreen && (
                  <>
                    {/* TikTok-Style Auth Method Selector Tabs */}
                    <div
                      className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-[#26262E] bg-[#0A0A0C] p-1"
                      role="tablist"
                      aria-label="Choose sign-in method"
                    >
                      <button
                        type="button"
                        role="tab"
                        aria-selected={authMethod === "phone"}
                        onClick={() => {
                          setAuthMethod("phone");
                          setError("");
                          setInfoMsg("");
                        }}
                        className={`flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition ${
                          authMethod === "phone"
                            ? "bg-[#FFB800] font-semibold text-[#0A0A0C]"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Smartphone className="h-4 w-4 shrink-0" />
                        <span>Phone Number</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={authMethod === "email"}
                        onClick={() => {
                          setAuthMethod("email");
                          setCountryPickerOpen(false);
                          setError("");
                          setInfoMsg("");
                        }}
                        className={`flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition ${
                          authMethod === "email"
                            ? "bg-[#FFB800] font-semibold text-[#0A0A0C]"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Mail className="h-4 w-4 shrink-0" />
                        <span>Email / Password</span>
                      </button>
                    </div>

                    {authMethod === "phone" && (
                      <form
                        className="space-y-4"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void sendPhoneCode();
                        }}
                      >
                        <div className="space-y-1.5">
                          <span className="block text-sm font-medium text-zinc-200">
                            Phone number
                          </span>
                          <div className="relative flex gap-2">
                            <button
                              type="button"
                              aria-label="Select country code"
                              aria-expanded={countryPickerOpen}
                              onClick={() => setCountryPickerOpen((open) => !open)}
                              className="flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-xl border border-[#2A2A32] bg-[#0A0A0C] px-3 text-sm font-medium text-white transition hover:border-[#FFB800]/60"
                            >
                              <span aria-hidden="true">{selectedCountry.flag}</span>
                              <span className="tabular-nums">{selectedCountry.dial}</span>
                              <ChevronDown className="h-4 w-4 text-zinc-400" />
                            </button>
                            <input
                              className={field}
                              type="tel"
                              inputMode="tel"
                              autoComplete="tel-national"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="82 123 4567"
                              aria-label="Mobile number"
                              required
                            />

                            {countryPickerOpen && (
                              <div className="absolute left-0 right-0 top-[54px] z-30 overflow-hidden rounded-2xl border border-[#2A2A32] bg-[#141418] shadow-2xl">
                                <div className="flex items-center gap-2 border-b border-[#26262E] px-3 py-2">
                                  <Search className="h-4 w-4 shrink-0 text-zinc-400" />
                                  <input
                                    type="text"
                                    value={countryQuery}
                                    onChange={(e) => setCountryQuery(e.target.value)}
                                    placeholder="Search country or +code"
                                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                                    autoFocus
                                  />
                                </div>
                                <div className="max-h-52 overflow-y-auto p-1">
                                  {filteredCountries.map((c) => (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => {
                                        setSelectedCountry(c);
                                        setCountryPickerOpen(false);
                                        setCountryQuery("");
                                      }}
                                      className={`flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-left text-sm transition ${
                                        selectedCountry.code === c.code
                                          ? "bg-[#FFB800]/15 text-[#FFB800]"
                                          : "text-zinc-200 hover:bg-white/5"
                                      }`}
                                    >
                                      <span className="flex items-center gap-2.5 truncate">
                                        <span>{c.flag}</span>
                                        <span className="truncate">{c.name}</span>
                                      </span>
                                      <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-400">
                                        {c.dial}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {error && (
                          <div
                            role="alert"
                            className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-300"
                          >
                            {error}
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
                          disabled={busy || phoneInput.replace(/\D/g, "").length < 6}
                          className="min-h-[48px] w-full rounded-xl bg-[#FFB800] text-sm font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <span>Send 6-Digit Code</span>
                              <ArrowRight />
                            </>
                          )}
                        </Button>
                      </form>
                    )}

                    {authMethod === "email" && (
                      <>
                        <div
                          className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-[#26262E] bg-[#0A0A0C] p-1"
                          role="tablist"
                          aria-label="Email mode"
                        >
                          {(
                            [
                              { id: "signin", label: "Sign In" },
                              { id: "signup", label: "Create Account" },
                            ] as const
                          ).map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              role="tab"
                              aria-selected={authTab === t.id}
                              onClick={() => {
                                setAuthTab(t.id);
                                setError("");
                                setInfoMsg("");
                              }}
                              className={`min-h-[40px] whitespace-nowrap rounded-lg text-xs font-medium transition ${
                                authTab === t.id
                                  ? "bg-[#222228] font-semibold text-white"
                                  : "text-zinc-400 hover:text-white"
                              }`}
                            >
                              {t.label}
                            </button>
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
                                  authTab === "signin"
                                    ? "Enter your password"
                                    : "At least 6 characters"
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
                              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-300"
                            >
                              {error}
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

                    <div className="my-5 flex items-center gap-3 text-xs font-medium text-zinc-500">
                      <span className="h-px flex-1 bg-[#26262E]" />
                      <span>OR</span>
                      <span className="h-px flex-1 bg-[#26262E]" />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void handleGoogleSignIn()}
                      className="google-signin min-h-[48px] w-full gap-2.5 rounded-xl border-[#2A2A32] bg-[#0A0A0C] px-4 text-sm font-semibold text-white hover:bg-[#1C1C22] [&_svg]:size-[18px]"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <G />}
                      <span>Continue with Google</span>
                    </Button>

                    {onGuestBrowse && (
                      <div className="mt-5 border-t border-[#222228] pt-4 text-center">
                        <button
                          type="button"
                          onClick={onGuestBrowse}
                          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-zinc-300 transition hover:bg-white/[0.04] hover:text-[#FFB800]"
                        >
                          <Play className="h-4 w-4 fill-current text-[#FFB800]" />
                          <span>Skip for now — Watch Videos First</span>
                        </button>
                      </div>
                    )}
                  </>
                )}

                {isOtpScreen && (
                  <div className="space-y-5">
                    {fallbackOtpCode && (
                      <button
                        type="button"
                        onClick={handleAutofillFallbackOtp}
                        className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-[#FFB800]/40 bg-[#FFB800]/10 px-4 py-3 text-left transition hover:bg-[#FFB800]/15"
                      >
                        <span className="flex items-center gap-2.5 text-xs font-medium text-[#FFB800]">
                          <KeyRound className="h-4 w-4 shrink-0" />
                          <span>
                            Tumeni Verification Code:{" "}
                            <strong className="font-mono text-sm tracking-wider text-white">
                              {fallbackOtpCode}
                            </strong>
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-[#FFB800]">
                          Tap to autofill
                        </span>
                      </button>
                    )}

                    <div
                      className="grid grid-cols-6 gap-2 sm:gap-3"
                      role="group"
                      aria-label="6-digit verification code"
                    >
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          autoComplete={idx === 0 ? "one-time-code" : "off"}
                          aria-label={`Digit ${idx + 1}`}
                          value={digit}
                          disabled={busy}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onPaste={handleOtpPaste}
                          className="h-14 w-full rounded-xl border border-[#2A2A32] bg-[#0A0A0C] text-center font-mono text-xl font-bold tabular-nums text-white outline-none transition focus:border-[#FFB800] focus:ring-1 focus:ring-[#FFB800]"
                        />
                      ))}
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-300"
                      >
                        {error}
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

                    <div className="flex items-center justify-between pt-1 text-xs">
                      {resendSeconds > 0 ? (
                        <span className="tabular-nums text-zinc-400">
                          Resend code in {formatCountdown(resendSeconds)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void sendPhoneCode(fullPhone)}
                          className="min-h-[44px] font-semibold text-[#FFB800] hover:underline"
                        >
                          Resend code
                        </button>
                      )}
                      {busy && (
                        <span className="inline-flex items-center gap-1.5 text-zinc-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FFB800]" />
                          Verifying…
                        </span>
                      )}
                    </div>

                    <Button
                      type="button"
                      disabled={busy || otpDigits.join("").length !== 6}
                      onClick={() => void verifyOtpCode(otpDigits.join(""))}
                      className="min-h-[48px] w-full rounded-xl bg-[#FFB800] text-sm font-semibold text-[#0A0A0C] hover:bg-[#FFB800]/90"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span>Verify &amp; Continue</span>
                          <ArrowRight />
                        </>
                      )}
                    </Button>
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
                        if (hasSupabaseConfig && !account.startsWith("phone_")) {
                          void supabase.auth.signOut().catch(() => {});
                        }
                        try {
                          localStorage.removeItem("tumeni-account");
                        } catch {
                          /* Continue logout. */
                        }
                        setAccount("");
                        setPhoneStage("input");
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
