import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { SpeciesBadge } from "@/components/ui/SpeciesBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Trophy } from "lucide-react";

const TIME_RANGES = [
  { label: "All Time", value: "all" },
  { label: "This Year", value: "year" },
  { label: "This Month", value: "month" },
  { label: "This Week", value: "week" },
] as const;

const TABS = [
  { label: "🔥 Top Reactions", value: "reactions" },
  { label: "🎣 Fish", value: "fish" },
  { label: "🦌 Big Game", value: "biggame" },
  { label: "🦅 Birds", value: "birds" },
] as const;

function getDateFilter(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "week": { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
    case "month": { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    case "year": { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    default: return null;
  }
}

interface LeaderboardPageProps {
  searchParams: Promise<{ tab?: string; range?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { tab = "reactions", range = "all" } = await searchParams;
  const dateFilter = getDateFilter(range);
  const dateWhere = dateFilter ? { harvested_at: { gte: dateFilter } } : {};

  const buildLink = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ tab, range, ...overrides });
    return `/leaderboard?${params}`;
  };

  // ── fetch based on tab ────────────────────────────────────────────────────────
  type Entry = {
    id: string;
    species: string;
    species_type: string;
    metric: string;
    user: { username: string; display_name: string; avatar_url: string | null };
    imageUrl: string | null;
  };

  let entries: Entry[] = [];

  if (tab === "reactions") {
    // Group reactions by harvest, count total, join harvest + user + image
    const reactionCounts = await prisma.reaction.groupBy({
      by: ["harvest_id"],
      _count: { harvest_id: true },
      orderBy: { _count: { harvest_id: "desc" } },
      take: 50,
    });

    if (reactionCounts.length > 0) {
      const harvestIds = reactionCounts.map((r) => r.harvest_id);
      const harvests = await prisma.harvest.findMany({
        where: { id: { in: harvestIds }, ...dateWhere },
        include: {
          user: { select: { username: true, display_name: true, avatar_url: true } },
          images: { where: { is_primary: true }, take: 1 },
        },
      });

      const harvestMap = new Map(harvests.map((h) => [h.id, h]));
      entries = reactionCounts
        .filter((r) => harvestMap.has(r.harvest_id))
        .map((r) => {
          const h = harvestMap.get(r.harvest_id)!;
          return {
            id: h.id,
            species: h.species,
            species_type: h.species_type,
            metric: `${r._count.harvest_id} reactions`,
            user: h.user,
            imageUrl: h.images[0]?.url ?? null,
          };
        });
    }
  } else if (tab === "fish") {
    const harvests = await prisma.harvest.findMany({
      where: {
        species_type: "FISH",
        OR: [{ length_in: { not: null } }, { weight_lbs: { not: null } }],
        ...dateWhere,
      },
      orderBy: [{ length_in: "desc" }, { weight_lbs: "desc" }],
      take: 50,
      include: {
        user: { select: { username: true, display_name: true, avatar_url: true } },
        images: { where: { is_primary: true }, take: 1 },
      },
    });
    entries = harvests.map((h) => ({
      id: h.id,
      species: h.species,
      species_type: h.species_type,
      metric: h.length_in != null
        ? `${h.length_in}"`
        : h.weight_lbs != null ? `${h.weight_lbs} lbs` : "—",
      user: h.user,
      imageUrl: h.images[0]?.url ?? null,
    }));
  } else if (tab === "biggame") {
    const harvests = await prisma.harvest.findMany({
      where: {
        species_type: "BIG_GAME",
        OR: [{ score: { not: null } }, { point_count: { not: null } }],
        ...dateWhere,
      },
      orderBy: [{ score: "desc" }, { point_count: "desc" }],
      take: 50,
      include: {
        user: { select: { username: true, display_name: true, avatar_url: true } },
        images: { where: { is_primary: true }, take: 1 },
      },
    });
    entries = harvests.map((h) => ({
      id: h.id,
      species: h.species,
      species_type: h.species_type,
      metric: h.score != null
        ? `${h.score} score`
        : h.point_count != null ? `${h.point_count} pts` : "—",
      user: h.user,
      imageUrl: h.images[0]?.url ?? null,
    }));
  } else if (tab === "birds") {
    const harvests = await prisma.harvest.findMany({
      where: {
        species_type: "BIRD",
        fish_count: { not: null },
        ...dateWhere,
      },
      orderBy: { fish_count: "desc" },
      take: 50,
      include: {
        user: { select: { username: true, display_name: true, avatar_url: true } },
        images: { where: { is_primary: true }, take: 1 },
      },
    });
    entries = harvests.map((h) => ({
      id: h.id,
      species: h.species,
      species_type: h.species_type,
      metric: h.fish_count != null ? `${h.fish_count} birds` : "—",
      user: h.user,
      imageUrl: h.images[0]?.url ?? null,
    }));
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="w-7 h-7 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={buildLink({ tab: t.value })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t.value
                ? "bg-amber-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Time range */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 text-sm">Period:</span>
        {TIME_RANGES.map((r) => (
          <Link
            key={r.value}
            href={buildLink({ range: r.value })}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              range === r.value
                ? "bg-amber-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No entries for this leaderboard yet.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => {
            const rank = i + 1;
            return (
              <Link key={entry.id} href={`/harvest/${entry.id}`}>
                <div className="flex items-center gap-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl p-4 transition-all">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    rank === 1 ? "bg-amber-500 text-white"
                    : rank === 2 ? "bg-slate-400 text-slate-900"
                    : rank === 3 ? "bg-amber-800 text-white"
                    : "bg-slate-700 text-slate-300"
                  }`}>
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-700 shrink-0">
                    {entry.imageUrl && (
                      <Image src={entry.imageUrl} alt={entry.species} fill className="object-cover" sizes="56px" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-white truncate">{entry.species}</h3>
                      <SpeciesBadge type={entry.species_type as "FISH" | "BIG_GAME" | "BIRD" | "OTHER"} className="text-xs shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Avatar src={entry.user.avatar_url} alt={entry.user.display_name} size="sm" className="w-5 h-5" />
                      <span>{entry.user.display_name}</span>
                    </div>
                  </div>

                  {/* Metric */}
                  <div className="text-right shrink-0">
                    <p className="font-bold text-amber-400 text-lg">{entry.metric}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
