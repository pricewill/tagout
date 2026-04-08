import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

// ─── validation schema ────────────────────────────────────────────────────────
const optNum = z.coerce.number().optional()
const optStr = z.string().optional()
const optBool = z.boolean().optional()
const optEnum = <T extends string>(values: readonly [T, ...T[]]) =>
  z.enum(values).optional().or(z.literal('')).transform(v => v === '' ? undefined : v as T)

const createHarvestSchema = z.object({
  // required core
  species:        z.string().min(1),
  species_type:   z.enum(['FISH', 'BIG_GAME', 'BIRD', 'OTHER']),
  method:         optStr,
  harvested_at:   z.string().min(1).transform(v => new Date(v).toISOString()),

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
  land_type:       optEnum(['PUBLIC', 'PRIVATE', 'UNKNOWN'] as const),
  weather:         optEnum(['SUNNY', 'OVERCAST', 'WIND', 'RAIN', 'SNOW'] as const),
  moon_phase:      optEnum(['NEW', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS', 'FULL',
                            'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT'] as const),
  time_of_day:     optEnum(['MORNING', 'MIDDAY', 'EVENING', 'NIGHT'] as const),
  personal_best:   optBool,
  harvest_success: optBool,
  video_url:       optStr,

  // hunting-specific (BIG_GAME | BIRD)
  shot_distance_yards: optNum,
  season_type:         optEnum(['ARCHERY', 'MUZZLELOADER', 'RIFLE', 'GENERAL', 'SHOTGUN'] as const),
  tag_type:            optEnum(['GENERAL', 'LIMITED_ENTRY', 'OTC', 'PRIVATE'] as const),
  animal_age:          optEnum(['MATURE', 'YOUNG', 'UNKNOWN'] as const),
  point_count:         z.coerce.number().int().optional(),
  score:               optNum,

  // fishing-specific (FISH)
  fly_pattern:      optStr,
  water_type:       optEnum(['RIVER', 'LAKE', 'RESERVOIR', 'STREAM', 'POND',
                             'BAY_ESTUARY', 'OCEAN_OFFSHORE', 'OCEAN_FLATS'] as const),
  technique:        optEnum(['DRY_FLY', 'NYMPH', 'STREAMER', 'SPIN', 'BAITCAST',
                             'TROLLING', 'ICE_FISHING', 'FLY'] as const),
  catch_release:    optBool,
  fish_count:       z.coerce.number().int().optional(),
  water_conditions: optEnum(['CLEAR', 'MURKY', 'HIGH', 'LOW'] as const),
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createHarvestSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    console.error('Validation failed:', JSON.stringify(fieldErrors))
    return NextResponse.json(
      { error: 'Validation failed: ' + Object.entries(fieldErrors).map(([k, v]) => `${k}: ${v}`).join(', ') },
      { status: 422 }
    )
  }

  const { image_url, ...rest } = sanitizeBySpeciesType(parsed.data)

  const harvest = await prisma.harvest.create({
    data: { ...rest, user_id: user.id },
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
