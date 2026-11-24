import type { Comment, Post } from "./data";
import type { SetupProfile } from "./onboarding";

const DB_NAME = "tumeni-media-db";
const DB_VERSION = 1;
const MEDIA_STORE = "media";

const ACCOUNTS_KEY = "tumeni-accounts-v1";
const USER_POSTS_KEY = "tumeni-user-posts-v1";
const ENGAGEMENT_PREFIX = "tumeni-engagement:";

const memoryUrlCache = new Map<string, string>();
const memoryBlobFallback = new Map<string, Blob>();

function openMediaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    } catch {
      resolve(null);
    }
  });
}

export async function saveMediaBlob(blob: Blob): Promise<{ url: string; storageKey: string }> {
  const id = `media-${crypto.randomUUID()}`;
  const storageKey = `idb://${id}`;
  const objectUrl = URL.createObjectURL(blob);
  memoryUrlCache.set(storageKey, objectUrl);
  memoryBlobFallback.set(storageKey, blob);

  const db = await openMediaDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(MEDIA_STORE, "readwrite");
        tx.objectStore(MEDIA_STORE).put(blob, storageKey);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    return { url: objectUrl, storageKey };
  }

  // Fallback for environments without IndexedDB: store small assets as data URL
  if (blob.size <= 2 * 1024 * 1024) {
    const dataUrl = await blobToDataUrl(blob);
    if (dataUrl) {
      return { url: dataUrl, storageKey: dataUrl };
    }
  }
  return { url: objectUrl, storageKey };
}

export async function resolveMediaUrl(ref: string | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  if (!ref.startsWith("idb://")) return ref;

  const cached = memoryUrlCache.get(ref);
  if (cached) return cached;

  const fallbackBlob = memoryBlobFallback.get(ref);
  if (fallbackBlob) {
    const url = URL.createObjectURL(fallbackBlob);
    memoryUrlCache.set(ref, url);
    return url;
  }

  const db = await openMediaDb();
  if (!db) return undefined;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(MEDIA_STORE, "readonly");
      const req = tx.objectStore(MEDIA_STORE).get(ref);
      req.onsuccess = () => {
        const result = req.result;
        if (result instanceof Blob) {
          const url = URL.createObjectURL(result);
          memoryUrlCache.set(ref, url);
          resolve(url);
        } else {
          resolve(undefined);
        }
      };
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

export type AccountRecord = {
  accountId: string;
  profile: SetupProfile;
  followers: string[];
  createdAt: number;
};

export function loadAllAccounts(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AccountRecord =>
        !!item &&
        typeof item === "object" &&
        typeof (item as AccountRecord).accountId === "string" &&
        !!(item as AccountRecord).profile &&
        Array.isArray((item as AccountRecord).followers),
    );
  } catch {
    return [];
  }
}

function writeAllAccounts(records: AccountRecord[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(records));
  } catch {
    /* Storage full or unavailable. */
  }
}

export function getAccountRecord(accountId: string): AccountRecord | undefined {
  return loadAllAccounts().find((r) => r.accountId === accountId);
}

export function upsertAccountRecord(accountId: string, profile: SetupProfile): AccountRecord[] {
  const existing = loadAllAccounts();
  const idx = existing.findIndex((r) => r.accountId === accountId);
  if (idx >= 0) {
    const current = existing[idx]!;
    const updated: AccountRecord = {
      ...current,
      profile,
    };
    const next = [...existing];
    next[idx] = updated;
    writeAllAccounts(next);
    return next;
  }
  const created: AccountRecord = {
    accountId,
    profile,
    followers: [],
    createdAt: Date.now(),
  };
  const next = [created, ...existing];
  writeAllAccounts(next);
  return next;
}

export function toggleAccountFollow(
  followerAccountId: string,
  targetAccountId: string,
): AccountRecord[] {
  const existing = loadAllAccounts();
  const next = existing.map((rec) => {
    if (rec.accountId !== targetAccountId) return rec;
    const has = rec.followers.includes(followerAccountId);
    return {
      ...rec,
      followers: has
        ? rec.followers.filter((id) => id !== followerAccountId)
        : [...rec.followers, followerAccountId],
    };
  });
  writeAllAccounts(next);
  return next;
}

export function saveUserPosts(posts: Post[]) {
  try {
    const userPosts = posts.filter((p) => !p.id.startsWith("post-"));
    const serializable = userPosts.map((p) => {
      const cleanMedia = p.mediaStorageKey
        ? undefined
        : p.media?.startsWith("blob:")
          ? undefined
          : p.media;
      const cleanVideo = p.mediaStorageKey
        ? undefined
        : p.video?.startsWith("blob:")
          ? undefined
          : p.video;
      return {
        ...p,
        liked: undefined,
        saved: undefined,
        media: cleanMedia,
        video: cleanVideo,
      };
    });
    localStorage.setItem(USER_POSTS_KEY, JSON.stringify(serializable));
  } catch {
    /* Storage full or unavailable. */
  }
}

export async function loadPersistedUserPosts(): Promise<Post[]> {
  try {
    const raw = localStorage.getItem(USER_POSTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const resolved = await Promise.all(
      (parsed as Post[]).map(async (p) => {
        const mediaUrl = p.mediaStorageKey ? await resolveMediaUrl(p.mediaStorageKey) : p.media;
        return {
          ...p,
          media: p.kind === "text" || p.kind === "audio" ? undefined : mediaUrl,
          video: p.kind === "video" ? mediaUrl : p.video,
        } satisfies Post;
      }),
    );
    return resolved;
  } catch {
    return [];
  }
}

export type AccountEngagement = {
  likedIds: string[];
  savedIds: string[];
  commentsByPostId: Record<string, Comment[]>;
  shareCounts: Record<string, number>;
};

const emptyEngagement = (): AccountEngagement => ({
  likedIds: [],
  savedIds: [],
  commentsByPostId: {},
  shareCounts: {},
});

export function loadAccountEngagement(accountId: string): AccountEngagement {
  try {
    const raw = localStorage.getItem(`${ENGAGEMENT_PREFIX}${accountId}`);
    if (!raw) return emptyEngagement();
    const parsed = JSON.parse(raw) as Partial<AccountEngagement>;
    return {
      likedIds: Array.isArray(parsed.likedIds) ? parsed.likedIds : [],
      savedIds: Array.isArray(parsed.savedIds) ? parsed.savedIds : [],
      commentsByPostId:
        parsed.commentsByPostId && typeof parsed.commentsByPostId === "object"
          ? parsed.commentsByPostId
          : {},
      shareCounts:
        parsed.shareCounts && typeof parsed.shareCounts === "object" ? parsed.shareCounts : {},
    };
  } catch {
    return emptyEngagement();
  }
}

export function saveAccountEngagement(accountId: string, engagement: AccountEngagement) {
  try {
    localStorage.setItem(`${ENGAGEMENT_PREFIX}${accountId}`, JSON.stringify(engagement));
  } catch {
    /* Storage full or unavailable. */
  }
}
