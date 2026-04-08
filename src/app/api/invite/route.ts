import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Must be authenticated (magic link already exchanged)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Existing users don't need an invite
  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) {
    return NextResponse.json({ success: true });
  }

  const { code } = (await request.json()) as { code: string };

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  const invite = await prisma.inviteCode.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
  }

  if (!invite.is_active || invite.used_at !== null) {
    return NextResponse.json(
      { error: "This invite code has already been used or is no longer active." },
      { status: 400 }
    );
  }

  // Consume the code
  await prisma.inviteCode.update({
    where: { id: invite.id },
    data: {
      used_by_email: user.email ?? null,
      used_at: new Date(),
      is_active: false,
    },
  });

  return NextResponse.json({ success: true });
}
