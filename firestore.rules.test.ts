// Firestore Rules TDD Specification (requires @firebase/rules-unit-testing & Firestore emulator)
export const DIRTY_DOZEN_CASES = [
  {
    name: "1. Unverified user cannot create profile",
    collection: "profiles",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "2. Shadow field (isAdmin) rejected on profile create",
    collection: "profiles",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "3. Cannot create profile for another uid",
    collection: "profiles",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "4. Cannot seed non-zero followersCount on create",
    collection: "profiles",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "5. Cannot spoof createdAt timestamp",
    collection: "profiles",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "6. Non-owner cannot read /users/{uid}/private/account",
    collection: "users/private",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "7. Cannot inflate target followersCount without atomic /follows edge",
    collection: "profiles",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "8. Malformed @handle fails regex validation",
    collection: "profiles",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "9. Oversized document ID fails isValidId",
    collection: "posts",
    expect: "PERMISSION_DENIED",
  },
  { name: "10. Self-follow edge rejected", collection: "follows", expect: "PERMISSION_DENIED" },
  {
    name: "11. Private post cannot be read by another user",
    collection: "posts",
    expect: "PERMISSION_DENIED",
  },
  {
    name: "12. Post create with spoofed authorUid rejected",
    collection: "posts",
    expect: "PERMISSION_DENIED",
  },
] as const;
