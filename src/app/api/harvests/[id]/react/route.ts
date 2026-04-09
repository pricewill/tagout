import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const VALID_EMOJIS = ["🔥", "😮", "🎯", "🐟", "👏"];

async function buildCounts(harvestId: string, userId: string) {
  const rows = await prisma.reaction.findMany({
    where: { harvest_id: harvestId },
    select: { emoji: true, user_id: true },
  });
  const counts = new Map<string, { count: number; userReacted: boolean }>();
  for (const r of rows) {
    const cur = counts.get(r.emoji) ?? { count: 0, userReacted: false };
    cur.count += 1;
    if (r.user_id === userId) cur.userReacted = true;
    counts.set(r.emoji, cur);
  }
  return VALID_EMOJIS.map((emoji) => ({
    emoji,
    count: counts.get(emoji)?.count ?? 0,
    userReacted: counts.get(emoji)?.userReacted ?? false,
  }));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: harvestId } = await params;
  const { emoji } = (await request.json()) as { emoji: string };

  if (!VALID_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  try {
    const existing = await prisma.reaction.findUnique({
      where: {
        user_id_harvest_id_emoji: {
          user_id: user.id,
          harvest_id: harvestId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.reaction.create({
        data: { user_id: user.id, harvest_id: harvestId, emoji },
      });
    }

    const reactions = await buildCounts(harvestId, user.id);
    return NextResponse.json({ reactions });
  } catch (e) {
    console.error("Reaction toggle error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
