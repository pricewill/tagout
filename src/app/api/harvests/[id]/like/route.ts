import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: harvestId } = await params;

  const existing = await prisma.like.findUnique({
    where: { user_id_harvest_id: { user_id: user.id, harvest_id: harvestId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.like.create({
      data: { user_id: user.id, harvest_id: harvestId },
    });
    return NextResponse.json({ liked: true });
  }
}
