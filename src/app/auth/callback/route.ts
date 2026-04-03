import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Ensure user record exists in our DB
      const existing = await prisma.user.findUnique({ where: { id: user.id } });

      if (!existing) {
        // New user — redirect to onboarding
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/feed`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
