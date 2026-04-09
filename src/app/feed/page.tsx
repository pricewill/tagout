import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { HarvestCard } from "@/components/HarvestCard";
import Link from "next/link";
import { Fish, PlusCircle } from "lucide-react";
import type { ReactionCount } from "@/components/ReactionBar";

const PAGE_SIZE = 12;

interface FeedPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  // Resolve the current logged-in user via Supabase, then map to our Prisma user row.
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const currentUser = authUser
    ? await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { id: true },
      })
    : null;

  // Collect the IDs of users that the current viewer follows (if any).
  let followingIds: string[] = [];
  if (currentUser) {
    const following = await prisma.follow.findMany({
      where: { follower_id: currentUser.id },
      select: { following_id: true },
    });
    followingIds = following.map((f) => f.following_id);
  }

  // Fetch a page of harvest IDs ordered so that followed users come first,
  // and within each group the newest posts come first.
  const orderedIdRows =
    followingIds.length > 0
      ? await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT id FROM "Harvest"
          ORDER BY
            CASE WHEN user_id IN (${Prisma.join(followingIds)}) THEN 0 ELSE 1 END,
            created_at DESC
          LIMIT ${PAGE_SIZE} OFFSET ${skip}
        `)
      : await prisma.harvest.findMany({
          orderBy: { created_at: "desc" },
          skip,
          take: PAGE_SIZE,
          select: { id: true },
        });

  const pageHarvestIds = orderedIdRows.map((r) => r.id);

  const [harvestsUnordered, total] = await Promise.all([
    pageHarvestIds.length > 0
      ? prisma.harvest.findMany({
          where: { id: { in: pageHarvestIds } },
          include: {
            user: {
              select: {
                username: true,
                display_name: true,
                avatar_url: true,
              },
            },
            images: {
              where: { is_primary: true },
              select: { url: true, display_order: true },
              take: 1,
            },
            _count: {
              select: { comments: true, likes: true },
            },
          },
        })
      : Promise.resolve([]),
    prisma.harvest.count(),
  ]);

  // Preserve the ranked order from the ID query.
  const orderIndex = new Map(pageHarvestIds.map((id, i) => [id, i] as const));
  const harvests = [...harvestsUnordered].sort(
    (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
  );

  // Fetch reaction counts + the current user's reactions for this page.
  const [reactionCounts, userReactions] = await Promise.all([
    harvests.length > 0
      ? prisma.reaction.groupBy({
          by: ["harvest_id", "emoji"],
          where: { harvest_id: { in: pageHarvestIds } },
          _count: { emoji: true },
        })
      : Promise.resolve(
          [] as Array<{
            harvest_id: string;
            emoji: string;
            _count: { emoji: number };
          }>
        ),
    authUser && harvests.length > 0
      ? prisma.reaction.findMany({
          where: { user_id: authUser.id, harvest_id: { in: pageHarvestIds } },
          select: { harvest_id: true, emoji: true },
        })
      : Promise.resolve([] as Array<{ harvest_id: string; emoji: string }>),
  ]);

  const userReactedSet = new Set(
    userReactions.map((r) => `${r.harvest_id}:${r.emoji}`)
  );

  const reactionsByHarvest = new Map<string, ReactionCount[]>();
  for (const row of reactionCounts) {
    const list = reactionsByHarvest.get(row.harvest_id) ?? [];
    list.push({
      emoji: row.emoji,
      count: row._count.emoji,
      userReacted: userReactedSet.has(`${row.harvest_id}:${row.emoji}`),
    });
    reactionsByHarvest.set(row.harvest_id, list);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Discover</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {followingIds.length > 0
              ? "Latest adventures — people you follow first"
              : "Explore all recent adventures"}
          </p>
        </div>
        <Link
          href="/post/new"
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Post Adventure
        </Link>
      </div>

      {/* Feed grid */}
      {harvests.length === 0 ? (
        <div className="text-center py-20">
          <Fish className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-300 mb-2">
            No adventures yet
          </h2>
          <p className="text-slate-500 mb-6">
            Be the first to share an adventure!
          </p>
          <Link
            href="/post/new"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Post Your First Adventure
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {harvests.map((harvest) => (
              <HarvestCard
                key={harvest.id}
                harvest={harvest}
                reactions={reactionsByHarvest.get(harvest.id) ?? []}
                currentUserId={authUser?.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link
                  href={`/feed?page=${page - 1}`}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="text-slate-400 text-sm">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/feed?page=${page + 1}`}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
