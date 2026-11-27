import { useState } from "react";
import {
  BadgeCheck,
  Check,
  Copy,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CREWS, fmt, type Crew, type SuggestedPerson, type User } from "./data";
import { normalizeCity } from "./onboarding";
import { Avatar } from "./SharedUI";

export type RadarFilter = "suggestions" | "nearby" | "friends" | "requests";

function isCityMatch(person: SuggestedPerson, userLocation?: string): boolean {
  const { cityLower } = normalizeCity(userLocation ?? "");
  if (!cityLower) return Boolean(person.nearYou);
  const pCity = normalizeCity(person.city ?? person.location ?? "").cityLower;
  if (!pCity) return Boolean(person.nearYou);
  return pCity === cityLower || pCity.includes(cityLower) || cityLower.includes(pCity);
}

function MutualFriendsLine({ person }: { person: SuggestedPerson }) {
  const locationLabel = person.location || person.city;

  if (person.sharedWith.length === 0) {
    return (
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs tabular-nums text-muted-foreground">
        <span>{fmt(person.followers)} followers</span>
        {locationLabel && (
          <span className="inline-flex items-center gap-0.5 text-[#FFB800]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="mt-1 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {person.sharedWith.slice(0, 3).map((friend) => (
            <div
              key={friend.id}
              className="overflow-hidden rounded-full border border-[#141418] bg-[#0A0A0C]"
            >
              <Avatar src={friend.avatar} name={friend.name} handle={friend.handle} size={20} />
            </div>
          ))}
        </div>
        <p className="min-w-0 truncate text-xs tabular-nums text-muted-foreground">
          {person.mutuals} mutual friends
        </p>
      </div>
      {locationLabel && (
        <p className="inline-flex items-center gap-1 text-[11px] font-medium text-[#FFB800]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{locationLabel}</span>
        </p>
      )}
    </div>
  );
}

export function InviteCrewCard({
  myHandle,
  myName,
  compact = false,
}: {
  myHandle?: string | undefined;
  myName?: string | undefined;
  compact?: boolean | undefined;
}) {
  const cleanHandle = (myHandle ?? "@creator").replace(/^@/, "");
  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/@${cleanHandle}` : "";

  const handleShareInvite = async () => {
    const shareText = `Join ${myName || "me"} (@${cleanHandle}) on tumeni. — drop videos, catch live vibes & build with your crew: ${profileUrl}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Join me on tumeni.",
          text: shareText,
          url: profileUrl,
        });
        return;
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard?.writeText(shareText);
      toast.success("Invite message copied — paste it in WhatsApp or Messages!");
    } catch {
      toast.success("Copied to clipboard!");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard?.writeText(profileUrl);
    } catch {
      /* ignore clipboard error */
    }
    toast.success("Copied to clipboard!");
  };

  return (
    <div
      className={`border border-[#222228] bg-[#141418] ${
        compact ? "rounded-3xl p-4" : "rounded-3xl p-5 sm:p-6"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#FFB800]/30 bg-[#FFB800]/10 text-[#FFB800]">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground sm:text-base">
            You&apos;re one of the first creators on tumeni.
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Invite your crew to be the first to view and react to your drops.
          </p>
        </div>
      </div>

      <div className={`mt-4 flex flex-col gap-2 ${compact ? "" : "sm:flex-row"}`}>
        <button
          type="button"
          onClick={() => void handleShareInvite()}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#FFB800] px-4 text-xs font-bold text-[#0A0A0C] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Share2 className="h-4 w-4 shrink-0" />
          <span>📲 Invite via WhatsApp / Messages</span>
        </button>
        <button
          type="button"
          onClick={() => void handleCopyLink()}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#222228] bg-[#0A0A0C] px-4 text-xs font-semibold text-foreground transition hover:border-[#FFB800]/60 active:scale-[0.98]"
        >
          <Copy className="h-4 w-4 shrink-0 text-[#FFB800]" />
          <span>🔗 Copy Profile Link</span>
        </button>
      </div>
    </div>
  );
}

export function CircleRadarCarousel({
  suggestions,
  tappedIds,
  userLocation,
  myHandle,
  myName,
  onEditLocation,
  onTapIn,
  onDismiss,
  onSeeAll,
}: {
  suggestions: SuggestedPerson[];
  tappedIds: string[];
  userLocation?: string | undefined;
  myHandle?: string | undefined;
  myName?: string | undefined;
  onEditLocation?: (() => void) | undefined;
  onTapIn: (id: string, name: string) => void;
  onDismiss: (id: string) => void;
  onSeeAll: () => void;
}) {
  if (suggestions.length === 0) {
    return (
      <section aria-label="Invite your crew" className="px-4 sm:px-0">
        <InviteCrewCard myHandle={myHandle} myName={myName} />
      </section>
    );
  }

  const { city } = normalizeCity(userLocation ?? "");
  const ordered = [...suggestions].sort(
    (a, b) => Number(isCityMatch(b, userLocation)) - Number(isCityMatch(a, userLocation)),
  );

  return (
    <section
      aria-label="People near you"
      className="border-b border-[#222228] bg-[#141418] py-4 sm:rounded-3xl sm:border sm:px-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-4 sm:px-0">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-[#FFB800]" />
          <h2 className="truncate text-base font-semibold text-foreground">People Near You</h2>
          {city ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#FFB800]/30 bg-[#0A0A0C] px-2.5 py-0.5 text-[11px] font-medium text-[#FFB800]">
              <MapPin className="h-3 w-3" />
              <span>{city}</span>
            </span>
          ) : (
            onEditLocation && (
              <button
                type="button"
                onClick={onEditLocation}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#222228] bg-[#0A0A0C] px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
              >
                <MapPin className="h-3 w-3 text-[#FFB800]" />
                <span>Set city</span>
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-[36px] shrink-0 px-2 text-xs font-semibold text-[#FFB800] transition hover:underline"
        >
          See all
        </button>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 sm:px-0">
        {ordered.map((person) => {
          const { user } = person;
          const added = tappedIds.includes(user.id);
          return (
            <div
              key={user.id}
              className="relative flex w-56 shrink-0 flex-col justify-between rounded-2xl border border-[#222228] bg-[#0A0A0C] p-4"
            >
              <button
                type="button"
                aria-label={`Dismiss ${user.name}`}
                onClick={() => onDismiss(user.id)}
                className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-[#141418] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <div className="flex items-center gap-3 pr-6">
                  <Avatar src={user.avatar} name={user.name} handle={user.handle} size={50} ring />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                      {user.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{user.handle}</p>
                  </div>
                </div>
                <div className="mt-2.5">
                  <MutualFriendsLine person={person} />
                </div>
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTapIn(user.id, user.name)}
                  className={`flex min-h-[38px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-semibold transition active:scale-[0.98] ${
                    added
                      ? "border border-[#FFB800]/50 bg-[#141418] text-[#FFB800]"
                      : "bg-[#FFB800] text-[#0A0A0C] hover:brightness-110"
                  }`}
                >
                  {added ? (
                    <>
                      <span>Friend Added</span>
                      <Check className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add Friend</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(user.id)}
                  className="min-h-[38px] rounded-xl border border-[#222228] bg-[#141418] px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CircleRadarHub({
  activeFilter,
  setActiveFilter,
  suggestions,
  requests,
  allPeople,
  currentAccountId,
  userLocation,
  tappedIds,
  joinedCrews,
  onAddFriend,
  onConfirmRequest,
  onDismissSuggestion,
  onDismissRequest,
  onSendDm,
  onJoinCrew,
  onOpenCrewChat,
  onOpenMyProfile,
  myHandle,
  myName,
}: {
  activeFilter: RadarFilter;
  setActiveFilter: (filter: RadarFilter) => void;
  suggestions: SuggestedPerson[];
  requests: SuggestedPerson[];
  allPeople: SuggestedPerson[];
  currentAccountId?: string | undefined;
  userLocation?: string | undefined;
  tappedIds: string[];
  joinedCrews: string[];
  onAddFriend: (id: string, name: string) => void;
  onConfirmRequest: (person: SuggestedPerson) => void;
  onDismissSuggestion: (id: string) => void;
  onDismissRequest: (id: string) => void;
  onSendDm: (user: User) => void;
  onJoinCrew: (crew: Crew) => void;
  onOpenCrewChat: () => void;
  onOpenMyProfile?: (() => void) | undefined;
  myHandle?: string | undefined;
  myName?: string | undefined;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const { city } = normalizeCity(userLocation ?? "");

  const matchesPerson = (p: SuggestedPerson) =>
    !needle ||
    p.user.name.toLowerCase().includes(needle) ||
    p.user.handle.toLowerCase().includes(needle) ||
    p.vibeTag.toLowerCase().includes(needle) ||
    p.bio.toLowerCase().includes(needle) ||
    (p.location ?? "").toLowerCase().includes(needle) ||
    (p.city ?? "").toLowerCase().includes(needle);

  const visibleSuggestions = needle
    ? allPeople.filter(matchesPerson)
    : suggestions.filter(matchesPerson);
  const nearbyPool = allPeople.filter(
    (p) => p.user.id !== currentAccountId && isCityMatch(p, userLocation) && matchesPerson(p),
  );
  const visibleNearby =
    nearbyPool.length > 0
      ? nearbyPool
      : allPeople.filter((p) => p.user.id !== currentAccountId && p.nearYou && matchesPerson(p));
  const visibleFriends = allPeople.filter((p) => tappedIds.includes(p.user.id) && matchesPerson(p));
  const visibleRequests = requests.filter(matchesPerson);
  const matchedCrews = needle
    ? CREWS.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.category.toLowerCase().includes(needle) ||
          c.description.toLowerCase().includes(needle),
      )
    : [];

  const pills: { id: RadarFilter; label: string; count?: number }[] = [
    { id: "suggestions", label: "Suggestions" },
    { id: "nearby", label: city ? `Near ${city}` : "Near You", count: visibleNearby.length },
    { id: "friends", label: "Your Friends", count: visibleFriends.length },
    { id: "requests", label: "Requests", count: requests.length },
  ];

  const activeList = needle
    ? allPeople.filter(matchesPerson)
    : activeFilter === "nearby"
      ? visibleNearby
      : activeFilter === "friends"
        ? visibleFriends
        : activeFilter === "requests"
          ? visibleRequests
          : visibleSuggestions;

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Circle Radar<span className="text-[#FFB800]">.</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {city
              ? `Discovering creators around ${city} and your circle`
              : "Discover creators near you, friend requests, and crews"}
          </p>
        </div>
        <span className="text-xs font-semibold tabular-nums text-[#FFB800]">
          {tappedIds.length} friends
        </span>
      </div>

      {/* Top Pill Selector: Suggestions | Near You | Your Friends | Requests */}
      <div
        role="tablist"
        aria-label="Friends sections"
        className="no-scrollbar mb-4 flex gap-2 overflow-x-auto"
      >
        {pills.map((pill) => {
          const active = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveFilter(pill.id)}
              className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full border px-4 text-xs font-semibold transition ${
                active
                  ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C]"
                  : "border-[#222228] bg-[#141418] text-muted-foreground hover:border-[#FFB800]/40 hover:text-foreground"
              }`}
            >
              {pill.label}
              {pill.count !== undefined && pill.count > 0 && (
                <span
                  className={`ml-1.5 tabular-nums ${active ? "text-[#0A0A0C]" : "text-[#FFB800]"}`}
                >
                  {pill.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-[#222228] bg-[#141418] px-4 transition focus-within:border-[#FFB800]">
        <Search className="h-5 w-5 shrink-0 text-[#FFB800]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people, cities, handles, crews..."
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQ("")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-[#222228] hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </label>

      {/* Location prompt banner inside Near You tab if user hasn't set a city */}
      {activeFilter === "nearby" && !city && onOpenMyProfile && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#FFB800]/30 bg-[#141418] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-[#FFB800]" />
            <p className="text-xs text-muted-foreground">
              Add your city in your profile to prioritize creators right near you.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenMyProfile}
            className="min-h-[34px] shrink-0 rounded-full bg-[#FFB800] px-3 text-xs font-semibold text-[#0A0A0C]"
          >
            Set city
          </button>
        </div>
      )}

      {/* Connection Cards */}
      <section className="mt-4 space-y-3" aria-label="Connections list">
        {activeList.length === 0 ? (
          needle ? (
            <div className="rounded-3xl border border-[#222228] bg-[#141418] px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No registered creators match &ldquo;{q}&rdquo;
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Search finds real accounts registered on tumeni. Invite your crew below to grow the
                network.
              </p>
              <div className="mt-5 text-left">
                <InviteCrewCard myHandle={myHandle} myName={myName} />
              </div>
            </div>
          ) : activeFilter === "friends" ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-[#222228] bg-[#141418] px-6 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  You haven&apos;t added friends yet.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Invite friends to join tumeni. or check Suggestions as new creators register.
                </p>
              </div>
              <InviteCrewCard myHandle={myHandle} myName={myName} />
            </div>
          ) : activeFilter === "requests" ? (
            <div className="rounded-3xl border border-[#222228] bg-[#141418] px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No pending friend requests right now.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Real friend requests from registered creators will appear here.
              </p>
            </div>
          ) : (
            <InviteCrewCard myHandle={myHandle} myName={myName} />
          )
        ) : (
          activeList.map((person) => {
            const { user } = person;
            const isSelf = !!currentAccountId && user.id === currentAccountId;
            const isFriend = tappedIds.includes(user.id);

            return (
              <article
                key={user.id}
                className="flex flex-col gap-3.5 rounded-2xl border border-[#222228] bg-[#141418] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left Avatar + Middle Info */}
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <Avatar src={user.avatar} name={user.name} handle={user.handle} size={56} ring />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate text-base font-semibold text-foreground">
                        {user.name}
                      </h2>
                      {user.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
                      )}
                      {isSelf && (
                        <span className="rounded-full bg-[#FFB800]/15 px-2 py-0.5 text-[10px] font-semibold text-[#FFB800]">
                          You
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.handle} · <span className="text-[#FFB800]">{person.vibeTag}</span>
                    </p>
                    <MutualFriendsLine person={person} />
                  </div>
                </div>

                {/* Right: Two Prominent Action Buttons */}
                <div className="flex shrink-0 items-center gap-2">
                  {isSelf ? (
                    <button
                      type="button"
                      onClick={onOpenMyProfile}
                      className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#FFB800]/50 bg-[#0A0A0C] px-4 text-xs font-semibold text-[#FFB800] transition hover:bg-[#FFB800] hover:text-[#0A0A0C] sm:flex-initial"
                    >
                      <span>View Profile</span>
                    </button>
                  ) : activeFilter === "requests" && !needle ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onConfirmRequest(person)}
                        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#FFB800] px-4 text-xs font-semibold text-[#0A0A0C] transition hover:brightness-110 sm:flex-initial"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Confirm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissRequest(user.id)}
                        className="min-h-[40px] flex-1 whitespace-nowrap rounded-xl border border-[#222228] bg-[#222228]/70 px-4 text-xs font-semibold text-foreground transition hover:bg-[#222228] sm:flex-initial"
                      >
                        Delete
                      </button>
                    </>
                  ) : activeFilter === "friends" && !needle ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onSendDm(user)}
                        className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#FFB800] px-4 text-xs font-semibold text-[#0A0A0C] transition hover:brightness-110 sm:flex-initial"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Message</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onAddFriend(user.id, user.name)}
                        className="min-h-[40px] flex-1 whitespace-nowrap rounded-xl border border-[#222228] bg-[#222228]/70 px-4 text-xs font-semibold text-foreground transition hover:bg-[#222228] sm:flex-initial"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onAddFriend(user.id, user.name)}
                        className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 text-xs font-semibold transition sm:flex-initial ${
                          isFriend
                            ? "border border-[#FFB800]/50 bg-[#0A0A0C] text-[#FFB800]"
                            : "bg-[#FFB800] text-[#0A0A0C] hover:brightness-110"
                        }`}
                      >
                        {isFriend ? (
                          <>
                            <span>Friend Added</span>
                            <Check className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add Friend</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismissSuggestion(user.id)}
                        className="min-h-[40px] flex-1 whitespace-nowrap rounded-xl border border-[#222228] bg-[#222228]/70 px-4 text-xs font-semibold text-foreground transition hover:bg-[#222228] sm:flex-initial"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Matching Crews when searching */}
      {matchedCrews.length > 0 && (
        <section className="mt-6 space-y-2.5" aria-label="Matching Crews">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Matching Crews
          </h2>
          {matchedCrews.map((crew) => {
            const joined = joinedCrews.includes(crew.id);
            return (
              <div
                key={crew.id}
                className="flex items-center gap-3 rounded-2xl border border-[#222228] bg-[#141418] p-3.5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#FFB800]/40 bg-[#0A0A0C] text-xs font-bold text-[#FFB800]">
                  {crew.accent}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{crew.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {crew.category} · {fmt(crew.members + (joined ? 1 : 0))} members
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {crew.id === "crew-nightowls" && (
                    <button
                      type="button"
                      onClick={onOpenCrewChat}
                      className="min-h-[36px] rounded-xl border border-[#222228] bg-[#0A0A0C] px-3 text-xs font-medium text-[#FFB800]"
                    >
                      Chat
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onJoinCrew(crew)}
                    className={`min-h-[36px] rounded-xl px-3.5 text-xs font-semibold ${
                      joined
                        ? "border border-[#222228] bg-[#0A0A0C] text-[#FFB800]"
                        : "bg-[#FFB800] text-[#0A0A0C]"
                    }`}
                  >
                    {joined ? "Joined ✓" : "Join"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
