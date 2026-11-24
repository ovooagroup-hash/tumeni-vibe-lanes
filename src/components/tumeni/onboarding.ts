export const INTERESTS = [
  "Comedy & Memes",
  "Trending",
  "Music & Soundtracks",
  "Daily Life & Stories",
  "Gaming & Tech",
  "Sports",
] as const;
export type SetupProfile = {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  interests: string[];
  following: string[];
  friends: string[];
};
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
    return {
      ...profile,
      following: profile.following.filter((id) => !sampleCreatorIds.has(id)),
      friends: profile.friends.filter((id) => !sampleFriendIds.has(id)),
    };
  } catch {
    return null;
  }
}
