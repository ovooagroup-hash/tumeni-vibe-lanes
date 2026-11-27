import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Auth } from "@/components/tumeni/Auth";
import { TumeniApp } from "@/components/tumeni/App";
import { readSetup, type SetupProfile } from "@/components/tumeni/onboarding";
import { getAccountRecord, upsertAccountRecord } from "@/components/tumeni/storage";
import { supabase } from "@/integrations/supabase/client";

const hasSupabaseConfig = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

const GUEST_PROFILE: SetupProfile = {
  name: "Guest Viewer",
  handle: "@guest",
  avatar: "",
  bio: "Watching videos on Tumeni.",
  location: "",
  city: "",
  interests: ["Music & Sound", "Comedy & Skits"],
  following: [],
  friends: [],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tumeni — Find Your Circle" },
      {
        name: "description",
        content: "Share videos, music snippets, memes and thoughts with your circle on Tumeni.",
      },
      { property: "og:title", content: "Tumeni — Find Your Circle" },
      {
        property: "og:description",
        content: "Share videos, music snippets, memes and thoughts with your circle on Tumeni.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function readProfileFromSupabaseUser(
  uid: string,
  metadata: Record<string, unknown> | undefined,
): SetupProfile | null {
  const metaProfile = metadata?.["tumeni_profile"];
  if (metaProfile && typeof metaProfile === "object") {
    const parsed = readSetup(JSON.stringify(metaProfile));
    if (parsed) return parsed;
  }
  try {
    const localSaved = readSetup(localStorage.getItem(`tumeni-setup:${uid}`));
    if (localSaved) return localSaved;
  } catch {
    /* Ignore storage access errors. */
  }
  return getAccountRecord(uid)?.profile ?? null;
}

function Index() {
  const [account, setAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [setup, setSetup] = useState<SetupProfile | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!hasSupabaseConfig) {
      setAccount(null);
      setSetup(null);
      setReady(true);
      return;
    }

    const applySessionUser = (
      user: { id: string; user_metadata?: Record<string, unknown> } | null,
    ) => {
      if (cancelled) return;
      if (!user) {
        setAccount(null);
        setSetup(null);
        setReady(true);
        return;
      }

      const uid = user.id;
      try {
        const storedAccount = localStorage.getItem("tumeni-account");
        if (storedAccount && storedAccount !== uid) {
          localStorage.removeItem("tumeni-account");
        }
      } catch {
        /* Ignore browser storage errors. */
      }

      setGuestMode(false);
      setAccount(uid);
      const profile = readProfileFromSupabaseUser(uid, user.user_metadata);
      if (profile) {
        try {
          localStorage.setItem(`tumeni-setup:${uid}`, JSON.stringify(profile));
          localStorage.setItem("tumeni-account", uid);
          upsertAccountRecord(uid, profile);
        } catch {
          /* Browser storage optional when cloud metadata succeeds. */
        }
      }
      setSetup(profile);
      setReady(true);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySessionUser(session?.user ?? null);
    });

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        applySessionUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
          setSetup(null);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const saveSetup = (id: string, profile: SetupProfile) => {
    try {
      localStorage.setItem(`tumeni-setup:${id}`, JSON.stringify(profile));
      localStorage.setItem("tumeni-account", id);
      upsertAccountRecord(id, profile);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
    setGuestMode(false);
    setSetup(profile);
    setAccount(id);

    if (hasSupabaseConfig && !id.startsWith("phone_")) {
      void supabase.auth.updateUser({ data: { tumeni_profile: profile } }).catch(() => {});
    }
  };

  if (!ready) return <div className="min-h-dvh bg-[#0A0A0C]" />;
  return (
    <>
      {storageError && (
        <p
          role="status"
          className="bg-secondary px-4 py-2 text-center text-sm text-muted-foreground"
        >
          Local browser cache is full — your profile stays synced in the cloud.
        </p>
      )}
      {account && setup ? (
        <TumeniApp
          account={account}
          setup={setup}
          onSetupChange={(p) => saveSetup(account, p)}
          onLogout={() => {
            try {
              localStorage.removeItem("tumeni-account");
            } catch {
              /* Continue logout. */
            }
            if (hasSupabaseConfig && !account.startsWith("phone_")) {
              void supabase.auth.signOut().catch(() => {});
            }
            setGuestMode(false);
            setAccount(null);
            setSetup(null);
          }}
        />
      ) : guestMode ? (
        <TumeniApp
          account="guest"
          setup={GUEST_PROFILE}
          onSetupChange={() => {}}
          onLogout={() => setGuestMode(false)}
        />
      ) : (
        <Auth
          initialAccount={account}
          onLogin={saveSetup}
          onGuestBrowse={() => setGuestMode(true)}
        />
      )}
    </>
  );
}
