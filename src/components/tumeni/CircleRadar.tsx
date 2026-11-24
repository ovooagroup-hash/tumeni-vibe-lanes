import { useState } from "react";
import {
  BadgeCheck,
  Check,
  MapPin,
  MessageCircle,
  Play,
  Radio,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  CREWS,
  SUGGESTED_PEOPLE,
  fmt,
  type Crew,
  type Post,
  type SuggestedPerson,
  type User,
} from "./data";
import { Avatar, Waveform } from "./SharedUI";

export type RadarFilter = "suggested" | "mutuals" | "near" | "crews" | "drops";

function SharedCirclesRow({ person }: { person: SuggestedPerson }) {
  const lead = person.sharedWith[0];
  const othersCount = Math.max(1, person.mutuals - 1);
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {person.sharedWith.slice(0, 3).map((friend) => (
          <div
            key={friend.id}
            className="overflow-hidden rounded-full border border-[#141418] bg-[#0A0A0C]"
          >
            <Avatar src={friend.avatar} name={friend.name} handle={friend.handle} size={22} />
          </div>
        ))}
      </div>
      <p className="min-w-0 truncate text-xs text-muted-foreground">
        Vibin&apos; with{" "}
        <span className="font-medium text-foreground">{lead?.name ?? "your crew"}</span> and{" "}
        <span className="tabular-nums">{othersCount}</span> {othersCount === 1 ? "other" : "others"}{" "}
        in your circle
      </p>
    </div>
  );
}

export function CircleRadarCarousel({
  suggestions,
  tappedIds,
  onTapIn,
  onSendDm,
  onDismiss,
  onSeeAll,
}: {
  suggestions: SuggestedPerson[];
  tappedIds: string[];
  onTapIn: (id: string, name: string) => void;
  onSendDm: (user: User) => void;
  onDismiss: (id: string) => void;
  onSeeAll: () => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <section
      aria-label="Circle Radar"
      className="border-b border-[#222228] bg-[#141418] py-4 sm:rounded-3xl sm:border sm:px-4"
    >
      <div className="mb-3 flex items-center justify-between px-4 sm:px-0">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[#FFB800]" />
          <h2 className="text-base font-semibold text-foreground">
            Circle Radar<span className="text-[#FFB800]">.</span>
          </h2>
        </div>
        <button
          type="button"
          onClick={onSeeAll}
          className="min-h-[36px] px-2 text-xs font-semibold text-[#FFB800] transition hover:underline"
        >
          See all
        </button>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 sm:px-0">
        {suggestions.map((person) => {
          const { user } = person;
          const tapped = tappedIds.includes(user.id);
          return (
            <div
              key={user.id}
              className="relative flex w-60 shrink-0 flex-col justify-between rounded-2xl border border-[#222228] bg-[#0A0A0C] p-4"
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
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    handle={user.handle}
                    size={52}
                    glowRing
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                      {user.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{user.handle}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#FFB800]">{person.vibeTag}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <SharedCirclesRow person={person} />
                </div>
              </div>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTapIn(user.id, user.name)}
                  className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-semibold transition active:scale-[0.98] ${
                    tapped
                      ? "border border-[#FFB800]/50 bg-[#141418] text-[#FFB800]"
                      : "bg-[#FFB800] text-[#0A0A0C] glow hover:brightness-110"
                  }`}
                >
                  {tapped ? (
                    <>
                      <span>Tapped In</span>
                      <Check className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <span>Tap In</span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Send DM to ${user.name}`}
                  onClick={() => onSendDm(user)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#222228] bg-[#141418] text-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
                >
                  <MessageCircle className="h-4 w-4" />
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
  posts,
  tappedIds,
  joinedCrews,
  onTapIn,
  onSendDm,
  onJoinCrew,
  onOpenCrewChat,
  onOpenPost,
}: {
  activeFilter: RadarFilter;
  setActiveFilter: (filter: RadarFilter) => void;
  posts: Post[];
  tappedIds: string[];
  joinedCrews: string[];
  onTapIn: (id: string, name: string) => void;
  onSendDm: (user: User) => void;
  onJoinCrew: (crew: Crew) => void;
  onOpenCrewChat: () => void;
  onOpenPost: (p: Post) => void;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  const filterPills: { id: RadarFilter; label: string }[] = [
    { id: "suggested", label: "Top Suggested" },
    { id: "mutuals", label: "Mutual Circles" },
    { id: "near", label: "Near You" },
    { id: "crews", label: "Crews" },
    { id: "drops", label: "Drops" },
  ];

  const matchedPeople = SUGGESTED_PEOPLE.filter((person) => {
    const matchesQuery =
      !needle ||
      person.user.name.toLowerCase().includes(needle) ||
      person.user.handle.toLowerCase().includes(needle) ||
      person.vibeTag.toLowerCase().includes(needle) ||
      person.bio.toLowerCase().includes(needle);

    if (!matchesQuery) return false;
    if (activeFilter === "near") return Boolean(person.nearYou);
    if (activeFilter === "mutuals") return person.mutuals >= 4;
    return true;
  }).sort((a, b) => {
    if (activeFilter === "mutuals") return b.mutuals - a.mutuals;
    return b.followers - a.followers;
  });

  const matchedCrews = CREWS.filter(
    (c) =>
      !needle ||
      c.name.toLowerCase().includes(needle) ||
      c.category.toLowerCase().includes(needle) ||
      c.description.toLowerCase().includes(needle),
  );

  const matchedPosts = posts.filter(
    (p) =>
      !needle ||
      p.caption.toLowerCase().includes(needle) ||
      p.user.name.toLowerCase().includes(needle) ||
      p.user.handle.toLowerCase().includes(needle) ||
      (p.tag ?? "").toLowerCase().includes(needle) ||
      (p.track ?? "").toLowerCase().includes(needle),
  );

  const noResults =
    (activeFilter === "crews" && matchedCrews.length === 0) ||
    (activeFilter === "drops" && matchedPosts.length === 0) ||
    ((activeFilter === "suggested" || activeFilter === "mutuals" || activeFilter === "near") &&
      matchedPeople.length === 0);

  return (
    <div className="px-4 pt-5 pb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Circle Radar<span className="text-[#FFB800]">.</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tap in with creators, mutuals, and active crews in your orbit
          </p>
        </div>
        <span className="text-xs font-semibold tabular-nums text-[#FFB800]">
          {tappedIds.length} in circle
        </span>
      </div>

      {/* Interactive Search Input with Glowing Amber Focus Border */}
      <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-[#222228] bg-[#141418] px-4 transition focus-within:border-[#FFB800] focus-within:shadow-[0_0_20px_rgba(255,184,0,0.22)]">
        <Search className="h-5 w-5 shrink-0 text-[#FFB800]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creators, friends, vibes..."
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

      {/* Vibe Filter Pills */}
      <div
        role="tablist"
        aria-label="Circle Radar filters"
        className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1"
      >
        {filterPills.map((pill) => {
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
                  ? "border-[#FFB800] bg-[#FFB800] text-[#0A0A0C] glow"
                  : "border-[#222228] bg-[#141418] text-muted-foreground hover:border-[#FFB800]/40 hover:text-foreground"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Quick vibe tags */}
      <div className="no-scrollbar my-3 flex gap-2 overflow-x-auto">
        {["#Producer", "#Visuals", "#Comedy", "#Afrohouse", "#Choreo"].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setQ(tag)}
            className="min-h-[34px] shrink-0 whitespace-nowrap rounded-full border border-[#222228] bg-[#141418] px-3 text-xs font-medium text-[#FFB800] transition hover:border-[#FFB800]"
          >
            {tag}
          </button>
        ))}
      </div>

      {noResults && (
        <div className="mt-6 rounded-3xl border border-[#222228] bg-[#141418] px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            No matches {q ? `for "${q}"` : "in this radar filter"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try switching vibe filters or searching another handle or vibe tag.
          </p>
        </div>
      )}

      {/* Signature Connection Cards */}
      {(activeFilter === "suggested" || activeFilter === "mutuals" || activeFilter === "near") &&
        matchedPeople.length > 0 && (
          <section className="mt-3 space-y-3" aria-label="Creator connections">
            {matchedPeople.map((person) => {
              const { user } = person;
              const tapped = tappedIds.includes(user.id);
              return (
                <article
                  key={user.id}
                  className="rounded-3xl border border-[#222228] bg-[#141418] p-4 transition hover:border-[#FFB800]/35"
                >
                  <div className="flex items-start gap-3.5">
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      handle={user.handle}
                      size={54}
                      glowRing
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <div className="flex items-center gap-1">
                          <h2 className="truncate text-base font-semibold text-foreground">
                            {user.name}
                          </h2>
                          {user.verified && (
                            <BadgeCheck className="h-4 w-4 shrink-0 fill-[#FFB800] text-[#0A0A0C]" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[#FFB800]">
                          {person.vibeTag}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{user.handle}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{fmt(person.followers)} followers</span>
                        {person.nearYou && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-0.5 text-foreground/80">
                              <MapPin className="h-3 w-3 text-[#FFB800]" />
                              Nearby
                            </span>
                          </>
                        )}
                      </p>
                      <p className="mt-2 text-sm leading-snug text-foreground/90">{person.bio}</p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-[#222228] pt-3">
                    <div className="min-w-0 flex-1">
                      <SharedCirclesRow person={person} />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Send DM to ${user.name}`}
                        onClick={() => onSendDm(user)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222228] bg-[#0A0A0C] text-foreground transition hover:border-[#FFB800] hover:text-[#FFB800]"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onTapIn(user.id, user.name)}
                        className={`flex min-h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 text-xs font-semibold transition active:scale-[0.98] ${
                          tapped
                            ? "border border-[#FFB800]/50 bg-[#0A0A0C] text-[#FFB800]"
                            : "bg-[#FFB800] text-[#0A0A0C] glow hover:brightness-110"
                        }`}
                      >
                        {tapped ? (
                          <>
                            <span>Tapped In</span>
                            <Check className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <span>Tap In</span>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

      {/* Crews Section */}
      {activeFilter === "crews" && matchedCrews.length > 0 && (
        <section className="mt-3 space-y-3" aria-label="Crews">
          {matchedCrews.map((crew) => {
            const joined = joinedCrews.includes(crew.id);
            return (
              <div
                key={crew.id}
                className="flex items-center gap-3.5 rounded-3xl border border-[#222228] bg-[#141418] p-4"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#FFB800]/45 bg-[#0A0A0C] text-sm font-bold text-[#FFB800] shadow-[0_0_16px_rgba(255,184,0,0.18)]">
                  {crew.accent}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-foreground">{crew.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {crew.category} ·{" "}
                    <span className="tabular-nums">
                      {fmt(crew.members + (joined ? 1 : 0))} members
                    </span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {crew.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onJoinCrew(crew)}
                    className={`flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-xs font-semibold transition ${
                      joined
                        ? "border border-[#FFB800]/50 bg-[#0A0A0C] text-[#FFB800]"
                        : "bg-[#FFB800] text-[#0A0A0C] glow hover:brightness-110"
                    }`}
                  >
                    {joined && <Check className="h-3.5 w-3.5" />}
                    <span>{joined ? "Tapped In" : "Join Crew"}</span>
                  </button>
                  {crew.id === "crew-nightowls" && (
                    <button
                      type="button"
                      onClick={onOpenCrewChat}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#FFB800] hover:underline"
                    >
                      <Users className="h-3 w-3" />
                      Open Chat
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Trending Drops Section */}
      {activeFilter === "drops" && matchedPosts.length > 0 && (
        <section className="mt-3" aria-label="Trending Drops">
          <div className="grid grid-cols-2 gap-2.5">
            {matchedPosts.map((p) => {
              const videoSrc = p.video ?? (p.mediaIsVideo ? p.media : undefined);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPost(p)}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-[#222228] bg-[#141418] text-left"
                >
                  {videoSrc ? (
                    <>
                      <video
                        src={videoSrc}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <span className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#0A0A0C]/75 text-[#FFB800] backdrop-blur">
                        <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                      </span>
                    </>
                  ) : p.media ? (
                    <img
                      src={p.media}
                      alt={p.caption}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : p.kind === "audio" ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                      <Waveform playing={false} bars={14} className="h-10" />
                      <p className="line-clamp-2 text-center text-xs font-medium text-foreground">
                        {p.track}
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center p-4">
                      <p className="line-clamp-4 text-sm leading-snug text-foreground">
                        {p.caption}
                      </p>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0C]/90 via-transparent to-transparent" />
                  <div className="absolute inset-x-2.5 bottom-2.5">
                    <p className="truncate text-xs font-medium text-foreground">{p.user.handle}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{p.caption}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
