# Tumeni Firestore Security Specification (Phase 0)

## 1. Data Invariants

1. **PII Isolation**: Email addresses live exclusively under `/users/{uid}/private/account`, readable and writable only by `request.auth.uid == uid`. Public searchable discovery profiles under `/profiles/{uid}` never contain email, phone, or credentials.
2. **Verified Identity**: All mutations require `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Ownership & Timestamps**: `uid`, `authorUid`, and `createdAt` cannot change after creation; `createdAt` and `updatedAt` must equal `request.time`.
4. **Atomic Follow Counters**: Non-owners may only increment/decrement `followersCount` on `/profiles/{uid}` by 1 inside a batch that simultaneously creates or deletes `/follows/{request.auth.uid}_{uid}`.
5. **Audience Enforcement**: Private/friends posts in `/posts/{postId}` cannot be listed or read by non-authors.

## 2. "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)

1. **Unverified email spoofing create on `/profiles/{uid}`**: `email_verified: false` attempting to create profile.
2. **Shadow field injection on `/profiles/{uid}`**: extra `isVerified: true` or `role: "admin"` field.
3. **Identity spoofing on `/profiles/{otherUid}`**: `uid` mismatch or creating another user's profile.
4. **Non-zero initial `followersCount`**: creating `/profiles/{uid}` with `followersCount: 9999`.
5. **Client-backdated timestamp**: creating `/profiles/{uid}` with `createdAt` != server `request.time`.
6. **PII scrape on `/users/{otherUid}/private/account`**: signed-in non-owner reading another user's private document.
7. **Unauthorized follower inflation**: updating another user's `followersCount` +100 without a paired `/follows` batch write.
8. **Handle regex poisoning**: setting `handle` to `"invalid handle!"` or a >25-char string.
9. **Oversized ID poisoning**: document ID > 128 chars or containing special characters.
10. **Self-follow loop**: creating `/follows/{uid}_{uid}` where `followerUid == targetUid`.
11. **Private post leak**: `list` or `get` on `/posts` returning another user's `audience: "private"` document.
12. **Author impersonation on `/posts/{postId}`**: creating a post with `authorUid` != `request.auth.uid`.
