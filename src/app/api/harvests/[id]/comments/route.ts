import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: harvestId } = await params;
  const { body } = await request.json() as { body: string };

  if (!body?.trim()) {
    return NextResponse.json({ error: "Comment body required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      user_id: user.id,
      harvest_id: harvestId,
      body: body.trim(),
    },
    include: {
      user: {
        select: { username: true, display_name: true, avatar_url: true },
      },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
