import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Auth } from "@/components/tumeni/Auth";
import { TumeniApp } from "@/components/tumeni/App";
import { readSetup, type SetupProfile } from "@/components/tumeni/onboarding";
import { upsertAccountRecord } from "@/components/tumeni/storage";
import { auth, testFirestoreConnection } from "@/lib/firebase";
import { fetchCloudProfile, saveCloudProfile } from "@/lib/tumeni-db";

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

function Index() {
  const [account, setAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [setup, setSetup] = useState<SetupProfile | null>(null);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    void testFirestoreConnection();

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;

      if (!fbUser) {
        setAccount(null);
        setSetup(null);
        setReady(true);
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

    const fbUser = auth.currentUser;
    if (fbUser && fbUser.uid === id && fbUser.emailVerified) {
      void saveCloudProfile(id, fbUser.email ?? "", profile).catch(() => {});
    }
  };

  if (!ready) return <div className="min-h-dvh bg-background" />;
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
            void signOut(auth).catch(() => {});
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
