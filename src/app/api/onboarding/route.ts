import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username, display_name, home_state, bio } = await request.json() as {
    username: string;
    display_name: string;
    home_state?: string;
    bio?: string;
  };

  if (!username?.trim() || !display_name?.trim()) {
    return NextResponse.json({ error: "Username and display name required" }, { status: 400 });
  }

  if (!/^[a-z0-9_]{1,30}$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  // Check for existing username
  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {
      username,
      display_name,
      home_state: home_state || null,
      bio: bio || null,
      email: user.email ?? undefined,
    },
    create: {
      id: user.id,
      username,
      display_name,
      home_state: home_state || null,
      bio: bio || null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      email: user.email ?? null,
    },
  });

  return NextResponse.json({ user: dbUser }, { status: 201 });
}
