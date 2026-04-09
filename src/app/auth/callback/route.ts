import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const response = NextResponse.redirect(`${origin}/feed`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      // Look up user by auth id first, then fall back to email so returning
      // users on new devices are recognized instead of being re-onboarded.
      let existing = await prisma.user.findUnique({ where: { id: user.id } });

      if (!existing && user.email) {
        existing = await prisma.user.findUnique({ where: { email: user.email } });
      }

      // Ensure the email is stored on the record so future lookups match.
      if (existing && user.email && existing.email !== user.email) {
        try {
          await prisma.user.update({
            where: { id: existing.id },
            data: { email: user.email },
          });
        } catch (e) {
          console.error("Failed to backfill user email:", e);
        }
      }

      if (!existing) {
        // New user — redirect to invite page (cookies already set on response)
        const inviteResponse = NextResponse.redirect(`${origin}/invite`);
        response.cookies.getAll().forEach(({ name, value, ...options }) => {
          inviteResponse.cookies.set(name, value, options);
        });
        return inviteResponse;
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
