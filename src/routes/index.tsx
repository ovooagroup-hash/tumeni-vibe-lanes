import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Auth } from "@/components/tumeni/Auth";
import { TumeniApp } from "@/components/tumeni/App";
import { readSetup, type SetupProfile } from "@/components/tumeni/onboarding";
import { upsertAccountRecord } from "@/components/tumeni/storage";

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
    try {
      const id = localStorage.getItem("tumeni-account");
      setAccount(id);
      if (id) {
        const parsed = readSetup(localStorage.getItem(`tumeni-setup:${id}`));
        setSetup(parsed);
        if (parsed) upsertAccountRecord(id, parsed);
      }
    } catch {
      setStorageError(true);
    }
    setReady(true);
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
  };
  if (!ready) return <div className="min-h-dvh bg-background" />;
  return (
    <>
      {storageError && (
        <p
          role="status"
          className="bg-secondary px-4 py-2 text-center text-sm text-muted-foreground"
        >
          Your details will only last for this visit. Browser storage is unavailable or full.
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
              /* Continue in this visit. */
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
