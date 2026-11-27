import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { Post, SuggestedPerson } from "@/components/tumeni/data";
import { normalizeCity, type SetupProfile } from "@/components/tumeni/onboarding";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";

export type CloudProfileDoc = {
  uid: string;
  name: string;
  handle: string;
  handleLower: string;
  avatar: string;
  bio: string;
  location: string;
  city: string;
  cityLower: string;
  vibeTag: string;
  interests: string[];
  isPublicProfile: boolean;
  followersCount: number;
  followingCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type PrivateAccountDoc = {
  uid: string;
  email: string;
  following: string[];
  friends: string[];
  likedIds: string[];
  savedIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function fetchCloudProfile(
  uid: string,
): Promise<{ profile: SetupProfile; followersCount: number } | null> {
  const profilePath = `profiles/${uid}`;
  const privatePath = `users/${uid}/private/account`;

  try {
    const profileSnap = await getDoc(doc(db, "profiles", uid));
    if (!profileSnap.exists()) return null;

    const pub = profileSnap.data() as CloudProfileDoc;
    let priv: Partial<PrivateAccountDoc> = {};

    try {
      const privSnap = await getDoc(doc(db, "users", uid, "private", "account"));
      if (privSnap.exists()) {
        priv = privSnap.data() as PrivateAccountDoc;
      }
    } catch {
      /* Private doc may not exist yet for migrated profiles; continue with empty lists. */
    }

    const setup: SetupProfile = {
      name: pub.name || "",
      handle: pub.handle || "",
      avatar: pub.avatar || "",
      bio: pub.bio || "",
      location: pub.location || pub.city || "",
      city: pub.city || "",
      interests: Array.isArray(pub.interests) ? pub.interests : [],
      following: Array.isArray(priv.following) ? priv.following : [],
      friends: Array.isArray(priv.friends) ? priv.friends : [],
    };
    return { profile: setup, followersCount: pub.followersCount ?? 0 };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      handleFirestoreError(error, OperationType.GET, profilePath);
    }
    throw new Error(`Failed loading ${profilePath} / ${privatePath}`, { cause: error });
  }
}

export async function saveCloudProfile(
  uid: string,
  email: string,
  profile: SetupProfile,
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  if (!auth.currentUser.emailVerified) return;

  const cleanHandle = `@${profile.handle.replace(/^@/, "").slice(0, 24)}`;
  const cleanName = (profile.name.trim() || cleanHandle.replace(/^@/, "")).slice(0, 50);
  const { location, city, cityLower } = normalizeCity(profile.location ?? profile.city ?? "");
  const firstInterest =
    profile.interests[0]?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "Creator";

  // Keep avatar within Firestore size budget
  const safeAvatar = profile.avatar.length <= 95000 ? profile.avatar : "";

  const profileRef = doc(db, "profiles", uid);
  const privateRef = doc(db, "users", uid, "private", "account");
  const profilePath = `profiles/${uid}`;
  const privatePath = `users/${uid}/private/account`;

  let existingProfile: CloudProfileDoc | null = null;
  let existingPrivate: PrivateAccountDoc | null = null;
  try {
    const [pSnap, privSnap] = await Promise.all([getDoc(profileRef), getDoc(privateRef)]);
    if (pSnap.exists()) existingProfile = pSnap.data() as CloudProfileDoc;
    if (privSnap.exists()) existingPrivate = privSnap.data() as PrivateAccountDoc;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  try {
    await setDoc(profileRef, {
      uid,
      name: cleanName,
      handle: cleanHandle,
      handleLower: cleanHandle.toLowerCase(),
      avatar: safeAvatar,
      bio: profile.bio.trim().slice(0, 160),
      location,
      city,
      cityLower,
      vibeTag: `#${firstInterest}`,
      interests: profile.interests.slice(0, 10),
      isPublicProfile: true,
      followersCount: existingProfile ? (existingProfile.followersCount ?? 0) : 0,
      followingCount: profile.following.length,
      createdAt: existingProfile?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }

  try {
    await setDoc(privateRef, {
      uid,
      email: (email || auth.currentUser.email || "").slice(0, 254),
      following: profile.following.slice(0, 500),
      friends: profile.friends.slice(0, 500),
      likedIds: existingPrivate?.likedIds ?? [],
      savedIds: existingPrivate?.savedIds ?? [],
      createdAt: existingPrivate?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

export async function listDirectoryProfiles(userCity?: string): Promise<SuggestedPerson[]> {
  const path = "profiles";
  const { cityLower: myCityLower } = normalizeCity(userCity ?? "");
  const items: SuggestedPerson[] = [];
  const seenIds = new Set<string>();

  if (auth.currentUser) {
    try {
      const q = query(collection(db, path), where("isPublicProfile", "==", true), limit(60));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        const data = d.data() as CloudProfileDoc;
        seenIds.add(data.uid);
        items.push({
          user: {
            id: data.uid,
            name: data.name,
            handle: data.handle,
            avatar: data.avatar,
          },
          bio: data.bio || "Creator on tumeni.",
          vibeTag: data.vibeTag || "#Creator",
          location: data.location || data.city || undefined,
          city: data.city || undefined,
          mutuals: 0,
          followers: data.followersCount ?? 0,
          nearYou: Boolean(myCityLower && data.cityLower && data.cityLower === myCityLower),
          sharedWith: [],
        });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    }
  }

  try {
    const res = await fetch("/api/auth/directory", { credentials: "same-origin" });
    if (res.ok) {
      const data = (await res.json()) as {
        profiles?: Array<{
          uid?: string;
          name?: string;
          handle?: string;
          avatar?: string;
          bio?: string;
          vibeTag?: string;
          location?: string;
          city?: string;
          followers?: number;
        }>;
      };
      for (const p of data.profiles ?? []) {
        if (!p.uid || seenIds.has(p.uid) || !p.name || !p.handle) continue;
        seenIds.add(p.uid);
        const cityInfo = normalizeCity(p.location || p.city || "");
        items.push({
          user: {
            id: p.uid,
            name: p.name,
            handle: p.handle,
            avatar: p.avatar ?? "",
          },
          bio: p.bio || "Creator on tumeni.",
          vibeTag: p.vibeTag || "#Creator",
          location: p.location || p.city || undefined,
          city: p.city || undefined,
          mutuals: 0,
          followers: p.followers ?? 0,
          nearYou: Boolean(myCityLower && cityInfo.cityLower && cityInfo.cityLower === myCityLower),
          sharedWith: [],
        });
      }
    }
  } catch {
    /* Optional server directory lookup. */
  }

  items.sort((a, b) => Number(Boolean(b.nearYou)) - Number(Boolean(a.nearYou)));
  return items;
}

export async function toggleCloudFollow(
  followerUid: string,
  targetUid: string,
  willFollow: boolean,
): Promise<boolean> {
  if (!auth.currentUser || !auth.currentUser.emailVerified || followerUid === targetUid) {
    return false;
  }
  const followId = `${followerUid}_${targetUid}`;
  const targetProfileRef = doc(db, "profiles", targetUid);
  const followRef = doc(db, "follows", followId);

  try {
    const targetSnap = await getDoc(targetProfileRef);
    if (!targetSnap.exists()) {
      return false;
    }

    const batch = writeBatch(db);
    if (willFollow) {
      batch.set(followRef, {
        followerUid,
        targetUid,
        createdAt: serverTimestamp(),
      });
      batch.update(targetProfileRef, {
        followersCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.delete(followRef);
      batch.update(targetProfileRef, {
        followersCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      handleFirestoreError(error, OperationType.WRITE, `follows/${followId}`);
    }
    return false;
  }
}

export async function publishCloudPost(authorUid: string, post: Post): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== authorUid || !auth.currentUser.emailVerified) {
    return;
  }
  const postId = post.id.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!postId) return;

  const mediaUrl = post.video ?? post.media ?? "";
  // Only store URLs or compact images (< 140KB) in Firestore; local idb:// videos remain in browser storage
  const syncableMedia =
    mediaUrl && !mediaUrl.startsWith("blob:") && mediaUrl.length <= 140000 ? mediaUrl : undefined;
  const safeAvatar = post.user.avatar.length <= 95000 ? post.user.avatar : "";

  const payload: Record<string, unknown> = {
    id: postId,
    authorUid,
    authorName: post.user.name.slice(0, 50),
    authorHandle: `@${post.user.handle.replace(/^@/, "").slice(0, 24)}`,
    authorAvatar: safeAvatar,
    lane: post.lane,
    kind: post.kind,
    audience: post.audience ?? "public",
    caption: post.caption.slice(0, 500),
    likesCount: 0,
    sharesCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (post.tag) payload["tag"] = post.tag.slice(0, 160);
  if (post.track) payload["track"] = post.track.slice(0, 160);
  if (post.soundUrl) payload["soundUrl"] = post.soundUrl.slice(0, 1024);
  if (post.soundYoutubeId) payload["soundYoutubeId"] = post.soundYoutubeId.slice(0, 64);
  if (syncableMedia) payload["media"] = syncableMedia;
  if (typeof post.mediaIsVideo === "boolean") payload["isVideo"] = post.mediaIsVideo;
  if (post.filterClass) payload["filterClass"] = post.filterClass.slice(0, 160);
  if (post.filterCss) payload["filterCss"] = post.filterCss.slice(0, 200);
  if (post.effectId) payload["effectId"] = post.effectId.slice(0, 64);
  if (typeof post.playbackSpeed === "number") payload["playbackSpeed"] = post.playbackSpeed;
  if (post.mood) payload["mood"] = post.mood.slice(0, 64);

  const path = `posts/${postId}`;
  try {
    await setDoc(doc(db, "posts", postId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchCloudPosts(uid: string): Promise<Post[]> {
  if (!auth.currentUser) return [];
  try {
    const [publicSnap, mineSnap] = await Promise.all([
      getDocs(query(collection(db, "posts"), where("audience", "==", "public"), limit(30))),
      getDocs(query(collection(db, "posts"), where("authorUid", "==", uid), limit(30))),
    ]);

    const seen = new Set<string>();
    const combined: Post[] = [];
    for (const d of [...mineSnap.docs, ...publicSnap.docs]) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const raw = d.data() as Record<string, unknown>;
      const kind = (raw["kind"] as Post["kind"]) || "text";
      const media = typeof raw["media"] === "string" ? raw["media"] : undefined;
      combined.push({
        id: String(raw["id"] ?? d.id),
        user: {
          id: String(raw["authorUid"] ?? ""),
          name: String(raw["authorName"] ?? "Creator"),
          handle: String(raw["authorHandle"] ?? "@creator"),
          avatar: String(raw["authorAvatar"] ?? ""),
        },
        authorAccountId: String(raw["authorUid"] ?? ""),
        lane: (raw["lane"] as Post["lane"]) ?? "vlog",
        kind,
        audience: (raw["audience"] as Post["audience"]) ?? "public",
        time: "recent",
        caption: String(raw["caption"] ?? ""),
        tag: typeof raw["tag"] === "string" ? raw["tag"] : undefined,
        track: typeof raw["track"] === "string" ? raw["track"] : undefined,
        soundUrl: typeof raw["soundUrl"] === "string" ? raw["soundUrl"] : undefined,
        soundYoutubeId:
          typeof raw["soundYoutubeId"] === "string" ? raw["soundYoutubeId"] : undefined,
        media: kind === "text" || kind === "audio" ? undefined : media,
        video: kind === "video" ? media : undefined,
        audio: kind === "audio" ? media : undefined,
        mediaIsVideo: typeof raw["isVideo"] === "boolean" ? raw["isVideo"] : undefined,
        filterClass: typeof raw["filterClass"] === "string" ? raw["filterClass"] : undefined,
        filterCss: typeof raw["filterCss"] === "string" ? raw["filterCss"] : undefined,
        effectId: typeof raw["effectId"] === "string" ? raw["effectId"] : undefined,
        playbackSpeed: typeof raw["playbackSpeed"] === "number" ? raw["playbackSpeed"] : undefined,
        mood: typeof raw["mood"] === "string" ? raw["mood"] : undefined,
        likes: typeof raw["likesCount"] === "number" ? raw["likesCount"] : 0,
        shares: typeof raw["sharesCount"] === "number" ? raw["sharesCount"] : 0,
        comments: [],
      });
    }
    return combined;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      handleFirestoreError(error, OperationType.LIST, "posts");
    }
    return [];
  }
}
