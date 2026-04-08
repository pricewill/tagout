import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { HarvestCard } from "@/components/HarvestCard";
import { getCurrentUser } from "@/lib/auth";
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

  const currentUser = await getCurrentUser();
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // If user has follows, show followed users' harvests; otherwise show global feed
  let harvestWhere = {};
  let feedMode: "following" | "global" = "global";

  if (currentUser) {
    const followCount = await prisma.follow.count({
      where: { follower_id: currentUser.id },
    });

    if (followCount > 0) {
      feedMode = "following";
      const following = await prisma.follow.findMany({
        where: { follower_id: currentUser.id },
        select: { following_id: true },
      });
      harvestWhere = { user_id: { in: following.map((f) => f.following_id) } };
    }
  }

  const [harvests, total] = await Promise.all([
    prisma.harvest.findMany({
      where: harvestWhere,
      orderBy: { created_at: "desc" },
      skip,
      take: PAGE_SIZE,
      include: {
        user: { select: { username: true, display_name: true, avatar_url: true } },
        images: { select: { url: true, display_order: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.harvest.count({ where: harvestWhere }),
  ]);

  // Fetch reaction counts + current user's reactions in parallel
  const harvestIds = harvests.map((h) => h.id);

  const [reactionCounts, userReactions] = await Promise.all([
    prisma.reaction.groupBy({
      by: ["harvest_id", "emoji"],
      where: { harvest_id: { in: harvestIds } },
      _count: { emoji: true },
    }),
    authUser
      ? prisma.reaction.findMany({
          where: { user_id: authUser.id, harvest_id: { in: harvestIds } },
          select: { harvest_id: true, emoji: true },
        })
      : Promise.resolve([]),
  ]);

  const userReactedSet = new Set(
    userReactions.map((r) => `${r.harvest_id}:${r.emoji}`)
  );

  const reactionsByHarvest = new Map<string, ReactionCount[]>();
  for (const row of reactionCounts) {
    const harvestId = row.harvest_id;
    if (!reactionsByHarvest.has(harvestId)) {
      reactionsByHarvest.set(harvestId, []);
    }
    reactionsByHarvest.get(harvestId)!.push({
      emoji: row.emoji,
      count: row._count.emoji,
      userReacted: userReactedSet.has(`${harvestId}:${row.emoji}`),
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {feedMode === "following" ? "Following" : "Discover"}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {feedMode === "following"
              ? "Latest from hunters & anglers you follow"
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
          <h2 className="text-lg font-semibold text-slate-300 mb-2">No adventures yet</h2>
          {feedMode === "following" ? (
            <p className="text-slate-500 mb-6">
              The people you follow haven&apos;t posted any adventures yet.
            </p>
          ) : (
            <p className="text-slate-500 mb-6">
              Be the first to share an adventure!
            </p>
          )}
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
