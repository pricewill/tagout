import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { identifySpeciesFromUrl } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { imageUrl } = await request.json() as { imageUrl: string };

  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  try {
    const result = await identifySpeciesFromUrl(imageUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI identify error:", error);
    return NextResponse.json({ error: "Identification failed" }, { status: 500 });
  }
}
