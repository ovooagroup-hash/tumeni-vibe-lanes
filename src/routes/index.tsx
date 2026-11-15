import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Auth } from "@/components/tumeni/Auth";
import { TumeniApp } from "@/components/tumeni/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "tumeni. — Find Your Circle" },
      { name: "description", content: "Share videos, music snippets, memes and thoughts with your circle on tumeni." },
      { property: "og:title", content: "tumeni. — Find Your Circle" },
      { property: "og:description", content: "Share videos, music snippets, memes and thoughts with your circle on tumeni." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [account, setAccount] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setAccount(localStorage.getItem("tumeni-account")); setReady(true); }, []);
  if (!ready) return <div className="min-h-dvh bg-background" />;
  return account ? (
    <TumeniApp account={account} onLogout={() => { localStorage.removeItem("tumeni-account"); setAccount(null); }} />
  ) : (
    <Auth onLogin={(id) => { localStorage.setItem("tumeni-account", id); setAccount(id); }} />
  );
}
