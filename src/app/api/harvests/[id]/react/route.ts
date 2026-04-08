import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const VALID_EMOJIS = ["🔥", "😮", "🎯", "🐟", "👏"];

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
    return NextResponse.json({ reacted: false, emoji });
  } else {
    await prisma.reaction.create({
      data: { user_id: user.id, harvest_id: harvestId, emoji },
    });
    return NextResponse.json({ reacted: true, emoji });
  }
}
