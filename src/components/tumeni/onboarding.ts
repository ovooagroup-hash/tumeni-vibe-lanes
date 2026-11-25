export const INTERESTS = [
  "Comedy & Memes",
  "Trending",
  "Music & Soundtracks",
  "Daily Life & Stories",
  "Gaming & Tech",
  "Sports",
] as const;

export const POPULAR_CITIES = [
  "Johannesburg",
  "Cape Town",
  "Lagos",
  "London",
  "NYC",
  "Atlanta",
  "Nairobi",
  "Los Angeles",
] as const;

export type SetupProfile = {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  location?: string | undefined;
  city?: string | undefined;
  interests: string[];
  following: string[];
  friends: string[];
};

export function normalizeCity(raw: string): {
  location: string;
  city: string;
  cityLower: string;
} {
  const cleaned = raw.trim().replace(/\s+/g, " ").slice(0, 80);
  const firstSegment = (cleaned.split(",")[0] ?? cleaned).trim().slice(0, 60);
  return {
    location: cleaned,
    city: firstSegment,
    cityLower: firstSegment.toLowerCase(),
  };
}

export function testIdentity(mode: "email" | "phone", value: string, password: string) {
  return value.trim() && password.trim() ? `${mode}:${value.trim()}` : null;
}

export function profileError(name: string, handle: string) {
  if (!name.trim()) return "Enter your display name.";
  if (!/^[a-zA-Z0-9_.]{2,24}$/.test(handle.replace(/^@/, "")))
    return "Use 2–24 letters, numbers, underscores or dots for your handle.";
  return "";
}

export function toggleSelection(values: string[], id: string) {
  return values.includes(id) ? values.filter((v) => v !== id) : [...values, id];
}

export function readSetup(raw: string | null): SetupProfile | null {
  try {
    const p: unknown = JSON.parse(raw ?? "null");
    if (!p || typeof p !== "object") return null;
    const v = p as Record<string, unknown>;
    if (!["name", "handle", "avatar", "bio"].every((k) => typeof v[k] === "string")) return null;
    if (
      !["interests", "following", "friends"].every(
        (k) => Array.isArray(v[k]) && (v[k] as unknown[]).every((i) => typeof i === "string"),
      )
    )
      return null;
    const profile = p as SetupProfile;
    const sampleCreatorIds = new Set(["yung", "haha", "nala", "kito"]);
    const sampleFriendIds = new Set(["zuri", "dre"]);
    const base: SetupProfile = {
      ...profile,
      following: profile.following.filter((id) => !sampleCreatorIds.has(id)),
      friends: profile.friends.filter((id) => !sampleFriendIds.has(id)),
    };
    if (typeof v["location"] === "string") {
      base.location = v["location"];
    }
    if (typeof v["city"] === "string") {
      base.city = v["city"];
    }
    return base;
  } catch {
    return null;
  }
}

export async function compressAvatarFile(file: File): Promise<string> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Invalid image data"));
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });

  if (typeof document === "undefined" || rawUrl.length <= 90000) {
    return rawUrl;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image decode failed"));
      el.src = rawUrl;
    });

    const maxDim = 240;
    const scale = Math.min(1, maxDim / Math.max(img.width || maxDim, img.height || maxDim));
    const width = Math.max(1, Math.round((img.width || maxDim) * scale));
    const height = Math.max(1, Math.round((img.height || maxDim) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawUrl;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.78;
    let compressed = canvas.toDataURL("image/jpeg", quality);
    while (compressed.length > 92000 && quality > 0.35) {
      quality -= 0.15;
      compressed = canvas.toDataURL("image/jpeg", quality);
    }
    return compressed;
  } catch {
    return rawUrl;
  }
}
