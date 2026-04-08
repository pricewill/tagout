import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH — deactivate a code
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const invite = await prisma.inviteCode.findUnique({ where: { id } });
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.inviteCode.update({
    where: { id },
    data: { is_active: false },
  });

  return NextResponse.json({ invite: updated });
}
