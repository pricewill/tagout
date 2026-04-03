import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { identifySpeciesFromUrl } from "@/lib/anthropic";
import { SpeciesType } from "@prisma/client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const species = formData.get("species") as string;
    const species_type = formData.get("species_type") as SpeciesType;
    const method = formData.get("method") as string;
    const location_label = formData.get("location_label") as string;
    const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null;
    const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null;
    const weight_lbs = formData.get("weight_lbs") ? parseFloat(formData.get("weight_lbs") as string) : null;
    const length_in = formData.get("length_in") ? parseFloat(formData.get("length_in") as string) : null;
    const caption = (formData.get("caption") as string) || null;
    const harvested_at = new Date(formData.get("harvested_at") as string);

    const files = formData.getAll("images") as File[];

    if (!species || !species_type || !method || !location_label || !harvested_at) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upload images to Supabase Storage
    const serviceClient = await createServiceClient();
    const uploadedImages: { storage_key: string; url: string; display_order: number; is_primary: boolean }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop() ?? "jpg";
      const key = `harvests/${user.id}/${Date.now()}-${i}.${ext}`;

      const { error: uploadError } = await serviceClient.storage
        .from("harvest-images")
        .upload(key, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = serviceClient.storage
        .from("harvest-images")
        .getPublicUrl(key);

      uploadedImages.push({
        storage_key: key,
        url: publicUrl,
        display_order: i,
        is_primary: i === 0,
      });
    }

    // Run AI identification on the primary image
    let ai_id_result: string | null = null;
    let ai_id_confidence: number | null = null;

    if (uploadedImages.length > 0) {
      try {
        const result = await identifySpeciesFromUrl(uploadedImages[0].url);
        ai_id_result = result.species;
        ai_id_confidence = result.confidence;
      } catch (err) {
        console.error("AI identification failed:", err);
      }
    }

    // Create harvest record
    const harvest = await prisma.harvest.create({
      data: {
        user_id: user.id,
        species,
        species_type,
        method,
        location_label,
        lat,
        lng,
        weight_lbs,
        length_in,
        caption,
        ai_id_result,
        ai_id_confidence,
        harvested_at,
        images: {
          create: uploadedImages,
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ harvest }, { status: 201 });
  } catch (error) {
    console.error("Create harvest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
