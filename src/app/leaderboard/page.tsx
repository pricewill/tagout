import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { SpeciesBadge } from "@/components/ui/SpeciesBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Trophy, Scale, Ruler } from "lucide-react";
import { formatWeight, formatLength } from "@/lib/utils";
import { SpeciesType } from "@prisma/client";

const TIME_RANGES = [
  { label: "All Time", value: "all" },
  { label: "This Year", value: "year" },
  { label: "This Month", value: "month" },
  { label: "This Week", value: "week" },
] as const;

const SPECIES_FILTERS = [
  { label: "All", value: "" },
  { label: "Fish", value: "FISH" },
  { label: "Big Game", value: "BIG_GAME" },
  { label: "Bird", value: "BIRD" },
  { label: "Other", value: "OTHER" },
] as const;

function getDateFilter(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    default:
      return null;
  }
}

interface LeaderboardPageProps {
  searchParams: Promise<{
    type?: string;
    range?: string;
    sortBy?: string;
  }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { type, range = "all", sortBy = "weight" } = await searchParams;

  const dateFilter = getDateFilter(range);

  const where: Record<string, unknown> = {
    ...(type ? { species_type: type as SpeciesType } : {}),
    ...(sortBy === "weight" ? { weight_lbs: { not: null } } : { length_in: { not: null } }),
    ...(dateFilter ? { harvested_at: { gte: dateFilter } } : {}),
  };

  const harvests = await prisma.harvest.findMany({
    where,
    orderBy: sortBy === "weight" ? { weight_lbs: "desc" } : { length_in: "desc" },
    take: 50,
    include: {
      user: { select: { username: true, display_name: true, avatar_url: true } },
      images: {
        where: { is_primary: true },
        take: 1,
      },
      _count: { select: { likes: true } },
    },
  });

  const buildLink = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({
      type: type ?? "",
      range,
      sortBy,
      ...overrides,
    });
    return `/leaderboard?${params}`;
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="w-7 h-7 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Sort by */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-sm">Sort by:</span>
          {["weight", "length"].map((s) => (
            <Link
              key={s}
              href={buildLink({ sortBy: s })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                sortBy === s
                  ? "bg-amber-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {s === "weight" ? (
                <span className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" /> Weight
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> Length
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Species filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 text-sm">Type:</span>
          {SPECIES_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={buildLink({ type: f.value })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (type ?? "") === f.value
                  ? "bg-amber-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {f.label}
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
      </div>

      {/* Leaderboard list */}
      {harvests.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No adventures match these filters yet.
        </div>
      ) : (
        <div className="space-y-3">
          {harvests.map((harvest, i) => {
            const primaryImage = harvest.images[0];
            const rank = i + 1;

            return (
              <Link key={harvest.id} href={`/harvest/${harvest.id}`}>
                <div className="flex items-center gap-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl p-4 transition-all">
                  {/* Rank */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      rank === 1
                        ? "bg-amber-500 text-white"
                        : rank === 2
                        ? "bg-slate-400 text-slate-900"
                        : rank === 3
                        ? "bg-amber-800 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                  </div>

                  {/* Image thumbnail */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-700 shrink-0">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={harvest.species}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-white truncate">
                        {harvest.species}
                      </h3>
                      <SpeciesBadge type={harvest.species_type} className="text-xs shrink-0" />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <Avatar
                        src={harvest.user.avatar_url}
                        alt={harvest.user.display_name}
                        size="sm"
                        className="w-5 h-5"
                      />
                      <span>{harvest.user.display_name}</span>
                    </div>
                  </div>

                  {/* Measurement */}
                  <div className="text-right shrink-0">
                    {sortBy === "weight" && harvest.weight_lbs != null && (
                      <div>
                        <p className="font-bold text-amber-400 text-lg">
                          {formatWeight(harvest.weight_lbs)}
                        </p>
                        {harvest.length_in != null && (
                          <p className="text-xs text-slate-500">
                            {formatLength(harvest.length_in)}
                          </p>
                        )}
                      </div>
                    )}
                    {sortBy === "length" && harvest.length_in != null && (
                      <div>
                        <p className="font-bold text-amber-400 text-lg">
                          {formatLength(harvest.length_in)}
                        </p>
                        {harvest.weight_lbs != null && (
                          <p className="text-xs text-slate-500">
                            {formatWeight(harvest.weight_lbs)}
                          </p>
                        )}
                      </div>
                    )}
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
