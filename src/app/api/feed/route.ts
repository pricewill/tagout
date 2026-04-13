import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

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

  let followingIds: string[] = [];
  if (currentUser) {
    const following = await prisma.follow.findMany({
      where: { follower_id: currentUser.id },
      select: { following_id: true },
    });
    followingIds = following.map((f) => f.following_id);
  }

  const orderedIdRows =
    followingIds.length > 0
      ? await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT id FROM "Harvest"
          ORDER BY
            CASE WHEN user_id IN (${Prisma.join(followingIds)}) THEN 0 ELSE 1 END,
            created_at DESC
          LIMIT ${PAGE_SIZE} OFFSET ${offset}
        `)
      : await prisma.harvest.findMany({
          orderBy: { created_at: "desc" },
          skip: offset,
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

  const orderIndex = new Map(pageHarvestIds.map((id, i) => [id, i] as const));
  const harvests = [...harvestsUnordered].sort(
    (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
  );

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
          where: {
            user_id: authUser.id,
            harvest_id: { in: pageHarvestIds },
          },
          select: { harvest_id: true, emoji: true },
        })
      : Promise.resolve([] as Array<{ harvest_id: string; emoji: string }>),
  ]);

  const userReactedSet = new Set(
    userReactions.map((r) => `${r.harvest_id}:${r.emoji}`)
  );

  const reactionsByHarvest: Record<
    string,
    Array<{ emoji: string; count: number; userReacted: boolean }>
  > = {};
  for (const row of reactionCounts) {
    const list = reactionsByHarvest[row.harvest_id] ?? [];
    list.push({
      emoji: row.emoji,
      count: row._count.emoji,
      userReacted: userReactedSet.has(`${row.harvest_id}:${row.emoji}`),
    });
    reactionsByHarvest[row.harvest_id] = list;
  }

  return NextResponse.json({
    harvests,
    reactions: reactionsByHarvest,
    total,
    hasMore: offset + PAGE_SIZE < total,
  });
}
