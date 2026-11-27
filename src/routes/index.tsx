import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Auth } from "@/components/tumeni/Auth";
import { TumeniApp } from "@/components/tumeni/App";
import { readSetup, type SetupProfile } from "@/components/tumeni/onboarding";
import { upsertAccountRecord } from "@/components/tumeni/storage";
import { supabase } from "@/integrations/supabase/client";
import { auth, testFirestoreConnection } from "@/lib/firebase";
import { fetchCloudProfile, saveCloudProfile } from "@/lib/tumeni-db";

const hasSupabaseConfig = Boolean(
  import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "tumeni. — Find Your Circle" },
      {
        name: "description",
        content: "Share videos, music snippets, memes and thoughts with your circle on tumeni.",
      },
      { property: "og:title", content: "tumeni. — Find Your Circle" },
      {
        property: "og:description",
        content: "Share videos, music snippets, memes and thoughts with your circle on tumeni.",
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
    return readSetup(localStorage.getItem(`tumeni-setup:${uid}`));
  } catch {
    return null;
  }
}

function Index() {
  const [account, setAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [setup, setSetup] = useState<SetupProfile | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (hasSupabaseConfig) {
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
        setAccount(user.id);
        const profile = readProfileFromSupabaseUser(user.id, user.user_metadata);
        if (profile) {
          try {
            localStorage.setItem(`tumeni-setup:${user.id}`, JSON.stringify(profile));
            localStorage.setItem("tumeni-account", user.id);
            upsertAccountRecord(user.id, profile);
          } catch {
            /* Browser storage optional when cloud metadata succeeds. */
          }
        }
        setSetup(profile);
        setReady(true);
      };

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

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        applySessionUser(session?.user ?? null);
      });

      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    }

    void testFirestoreConnection();

    const hydrateServerSession = async (): Promise<boolean> => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "same-origin" });
        if (!res.ok || cancelled) return false;
        const data = (await res.json()) as {
          user?: { uid?: string; email?: string } | null;
          profile?: SetupProfile | null;
        };
        const uid = data.user?.uid;
        if (!uid) return false;

        setAccount(uid);
        if (data.profile) {
          try {
            localStorage.setItem(`tumeni-setup:${uid}`, JSON.stringify(data.profile));
            localStorage.setItem("tumeni-account", uid);
            upsertAccountRecord(uid, data.profile);
          } catch {
            /* Browser storage optional when server profile succeeds. */
          }
          setSetup(data.profile);
        } else {
          const cached = readSetup(localStorage.getItem(`tumeni-setup:${uid}`));
          setSetup(cached);
        }
        setReady(true);
        return true;
      } catch {
        return false;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;

      if (!fbUser) {
        const hasServerSession = await hydrateServerSession();
        if (cancelled) return;
        if (!hasServerSession) {
          setAccount(null);
          setSetup(null);
          setReady(true);
        }
        return;
      }

      if (!fbUser.emailVerified) {
        setAccount(fbUser.uid);
        setSetup(null);
        setReady(true);
        return;
      }

      setAccount(fbUser.uid);

      try {
        const cloud = await fetchCloudProfile(fbUser.uid);
        if (cancelled) return;
        if (cloud?.profile) {
          try {
            localStorage.setItem(`tumeni-setup:${fbUser.uid}`, JSON.stringify(cloud.profile));
            localStorage.setItem("tumeni-account", fbUser.uid);
            upsertAccountRecord(fbUser.uid, cloud.profile);
          } catch {
            /* Browser storage optional when cloud profile succeeds. */
          }
          setSetup(cloud.profile);
          setReady(true);
          return;
        }
      } catch {
        /* Fallback to local cached profile if offline. */
      }

      try {
        const cached = readSetup(localStorage.getItem(`tumeni-setup:${fbUser.uid}`));
        if (cached) {
          void saveCloudProfile(fbUser.uid, fbUser.email ?? "", cached);
          setSetup(cached);
          setReady(true);
          return;
        }
      } catch {
        setStorageError(true);
      }

      setSetup(null);
      setReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe();
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
    setSetup(profile);
    setAccount(id);

    if (hasSupabaseConfig) {
      void supabase.auth.updateUser({ data: { tumeni_profile: profile } }).catch(() => {});
      return;
    }

    if (id.startsWith("srv_")) {
      void fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ profile }),
      }).catch(() => {});
      return;
    }

    const fbUser = auth.currentUser;
    if (fbUser && fbUser.uid === id && fbUser.emailVerified) {
      void saveCloudProfile(id, fbUser.email ?? "", profile).catch(() => {});
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
            if (hasSupabaseConfig) {
              void supabase.auth.signOut().catch(() => {});
            } else {
              void fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin",
              }).catch(() => {});
              void signOut(auth).catch(() => {});
            }
            setAccount(null);
            setSetup(null);
          }}
        />
      ) : (
        <Auth initialAccount={account} onLogin={saveSetup} />
      )}
    </>
  );
}
