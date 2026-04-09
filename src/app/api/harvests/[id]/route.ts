import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Fields the owner is allowed to update. Matches the optional fields on
// Harvest plus caption and video_url.
const optNum = z.coerce.number().optional().nullable();
const optStr = z.string().optional().nullable();
const optBool = z.boolean().optional().nullable();
const optEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z
    .enum(values)
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : (v as T | null | undefined)));

const updateHarvestSchema = z.object({
  caption: optStr,
  video_url: optStr,

  species: z.string().min(1).optional(),
  method: optStr,
  weight_lbs: optNum,
  length_in: optNum,
  harvested_at: z.coerce.date().optional(),

  companions: optStr,
  state: optStr,
  land_type: optEnum(["PUBLIC", "PRIVATE", "UNKNOWN"] as const),
  weather: optEnum(["SUNNY", "OVERCAST", "WIND", "RAIN", "SNOW"] as const),
  moon_phase: optEnum([
    "NEW",
    "WAXING_CRESCENT",
    "FIRST_QUARTER",
    "WAXING_GIBBOUS",
    "FULL",
    "WANING_GIBBOUS",
    "LAST_QUARTER",
    "WANING_CRESCENT",
  ] as const),
  time_of_day: optEnum(["MORNING", "MIDDAY", "AFTERNOON", "NIGHT"] as const),
  personal_best: optBool,
  harvest_success: optBool,

  // hunting
  shot_distance_yards: optNum,
  season_type: optEnum([
    "ARCHERY",
    "MUZZLELOADER",
    "RIFLE",
    "GENERAL",
    "SHOTGUN",
  ] as const),
  tag_type: optEnum(["GENERAL", "LIMITED_ENTRY", "OTC", "PRIVATE"] as const),
  animal_age: optEnum(["MATURE", "YOUNG", "UNKNOWN"] as const),
  point_count: z.coerce.number().int().optional().nullable(),
  score: optNum,

  // fishing
  fly_pattern: optStr,
  water_type: optEnum([
    "RIVER",
    "LAKE",
    "RESERVOIR",
    "STREAM",
    "POND",
    "BAY_ESTUARY",
    "OCEAN_OFFSHORE",
    "OCEAN_FLATS",
  ] as const),
  technique: optEnum([
    "DRY_FLY",
    "NYMPH",
    "STREAMER",
    "SPIN",
    "BAITCAST",
    "TROLLING",
    "ICE_FISHING",
    "FLY",
  ] as const),
  catch_release: optBool,
  fish_count: z.coerce.number().int().optional().nullable(),
  water_conditions: optEnum(["CLEAR", "MURKY", "HIGH", "LOW"] as const),
});

async function assertOwner(harvestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const harvest = await prisma.harvest.findUnique({
    where: { id: harvestId },
    select: { id: true, user_id: true },
  });
  if (!harvest) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  if (harvest.user_id !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, harvest };
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await assertOwner(id);
  if ("error" in check) return check.error;

  try {
    // Clean up dependent rows first since there is no cascade in the schema.
    await prisma.$transaction([
      prisma.reaction.deleteMany({ where: { harvest_id: id } }),
      prisma.like.deleteMany({ where: { harvest_id: id } }),
      prisma.comment.deleteMany({ where: { harvest_id: id } }),
      prisma.harvestImage.deleteMany({ where: { harvest_id: id } }),
      prisma.harvest.delete({ where: { id } }),
    ]);
  } catch (e) {
    console.error("Delete harvest error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = await assertOwner(id);
  if ("error" in check) return check.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateHarvestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      {
        error:
          "Validation failed: " +
          Object.entries(fieldErrors)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", "),
      },
      { status: 422 }
    );
  }

  // Drop undefined keys so we only update what was supplied.
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) data[k] = v;
  }

  try {
    const updated = await prisma.harvest.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Update harvest error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
