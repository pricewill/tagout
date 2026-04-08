import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ─── validation schema ────────────────────────────────────────────────────────
const optNum = z.coerce.number().optional()
const optStr = z.string().optional()
const optBool = z.boolean().optional()

const createHarvestSchema = z.object({
  // required core
  user_id:        z.string().min(1),
  species:        z.string().min(1),
  species_type:   z.enum(['FISH', 'BIG_GAME', 'BIRD', 'OTHER']),
  method:         z.string().min(1),
  harvested_at:   z.string().datetime({ offset: true }).or(z.string().date()),

  // optional core
  weight_lbs:       optNum,
  length_in:        optNum,
  caption:          optStr,
  image_url:        optStr,
  ai_id_result:     optStr,
  ai_id_confidence: optNum,

  // general optional
  companions:      optStr,
  state:           optStr,
  land_type:       z.enum(['PUBLIC', 'PRIVATE', 'UNKNOWN']).optional(),
  weather:         z.enum(['SUNNY', 'OVERCAST', 'WIND', 'RAIN', 'SNOW']).optional(),
  moon_phase:      z.enum(['NEW', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS', 'FULL',
                           'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT']).optional(),
  time_of_day:     z.enum(['MORNING', 'MIDDAY', 'EVENING', 'NIGHT']).optional(),
  personal_best:   optBool,
  harvest_success: optBool,
  video_url:       optStr,

  // hunting-specific (BIG_GAME | BIRD)
  shot_distance_yards: optNum,
  season_type:         z.enum(['ARCHERY', 'MUZZLELOADER', 'RIFLE', 'GENERAL', 'SHOTGUN']).optional(),
  tag_type:            z.enum(['GENERAL', 'LIMITED_ENTRY', 'OTC', 'PRIVATE']).optional(),
  animal_age:          z.enum(['MATURE', 'YOUNG', 'UNKNOWN']).optional(),
  point_count:         z.coerce.number().int().optional(),
  score:               optNum,

  // fishing-specific (FISH)
  fly_pattern:      optStr,
  water_type:       z.enum(['RIVER', 'LAKE', 'RESERVOIR', 'STREAM', 'POND',
                            'BAY_ESTUARY', 'OCEAN_OFFSHORE', 'OCEAN_FLATS']).optional(),
  technique:        z.enum(['DRY_FLY', 'NYMPH', 'STREAMER', 'SPIN', 'BAITCAST',
                            'TROLLING', 'ICE_FISHING', 'FLY']).optional(),
  catch_release:    optBool,
  fish_count:       z.coerce.number().int().optional(),
  water_conditions: z.enum(['CLEAR', 'MURKY', 'HIGH', 'LOW']).optional(),
})

type CreateHarvestInput = z.infer<typeof createHarvestSchema>

// ─── strip fields that don't belong to the species type ──────────────────────
function sanitizeBySpeciesType(data: CreateHarvestInput): CreateHarvestInput {
  const isHunting = data.species_type === 'BIG_GAME' || data.species_type === 'BIRD'
  const isFishing = data.species_type === 'FISH'

  const out = { ...data }

  if (!isHunting) {
    out.shot_distance_yards = undefined
    out.season_type = undefined
    out.tag_type = undefined
    out.animal_age = undefined
    out.point_count = undefined
    out.score = undefined
  }

  if (!isFishing) {
    out.fly_pattern = undefined
    out.water_type = undefined
    out.technique = undefined
    out.catch_release = undefined
    out.fish_count = undefined
    out.water_conditions = undefined
  }

  return out
}

// ─── POST /api/harvests ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createHarvestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { image_url, ...rest } = sanitizeBySpeciesType(parsed.data)

  const harvest = await prisma.harvest.create({
    data: rest,
  })

  if (image_url) {
    await prisma.harvestImage.create({
      data: {
        harvest_id: harvest.id,
        url: image_url,
        storage_key: image_url,
        display_order: 0,
        is_primary: true,
      },
    })
  }

  return NextResponse.json(harvest, { status: 201 })
}

// ─── GET /api/harvests ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const species_type = searchParams.get('species_type')
  const user_id = searchParams.get('user_id')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  // TODO: replace with real Prisma call:
  //
  // const where = {
  //   ...(species_type ? { species_type: species_type as SpeciesType } : {}),
  //   ...(user_id ? { user_id } : {}),
  // }
  // const [harvests, total] = await Promise.all([
  //   prisma.harvest.findMany({ where, orderBy: { created_at: 'desc' }, take: limit, skip: offset,
  //     include: { images: true, user: true, _count: { select: { likes: true, comments: true } } } }),
  //   prisma.harvest.count({ where }),
  // ])
  // return NextResponse.json({ harvests, total, limit, offset })

  // Mock response
  return NextResponse.json({
    harvests: [],
    total: 0,
    limit,
    offset,
    filters: { species_type, user_id },
  })
}
