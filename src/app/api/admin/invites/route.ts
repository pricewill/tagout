import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function generateCode(): string {
  const seg = () =>
    Array.from(
      { length: 4 },
      () => CHARSET[Math.floor(Math.random() * CHARSET.length)]
    ).join("");
  return `DGC-${seg()}-${seg()}`;
}

// GET — list all invite codes
export async function GET() {
  const codes = await prisma.inviteCode.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json({ codes });
}

// POST — generate a new code
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { created_by?: string };

  // Retry up to 5 times in case of collision (extremely unlikely)
  let code = "";
  for (let i = 0; i < 5; i++) {
    const candidate = generateCode();
    const exists = await prisma.inviteCode.findUnique({ where: { code: candidate } });
    if (!exists) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    return NextResponse.json({ error: "Failed to generate unique code" }, { status: 500 });
  }

  const invite = await prisma.inviteCode.create({
    data: { code, created_by: body.created_by ?? null },
  });

  return NextResponse.json({ invite }, { status: 201 });
}
