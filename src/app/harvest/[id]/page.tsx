import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { SpeciesBadge } from '@/components/ui/SpeciesBadge'
import { ReactionBar } from '@/components/ReactionBar'
import { CommentSection } from './CommentSection'
import { OwnerActions } from './OwnerActions'

interface PageProps {
  params: Promise<{ id: string }>
}

// ─── video embed helpers ───────────────────────────────────────────────────────
function getVideoEmbed(url: string): { type: 'iframe'; src: string } | { type: 'link'; host: string } | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace('www.', '')
    if (host === 'youtube.com') {
      const id = u.searchParams.get('v')
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}` }
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1)
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}` }
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.replace(/^\//, '')
      if (id) return { type: 'iframe', src: `https://player.vimeo.com/video/${id}` }
    }
    if (host === 'instagram.com' || host === 'tiktok.com') {
      return { type: 'link', host: host === 'instagram.com' ? 'Instagram' : 'TikTok' }
    }
    return null
  } catch {
    return null
  }
}

function fmt(val: string) { return val.replace(/_/g, ' ') }

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#1a2a1a] border border-[#2D4A2D] px-2.5 py-0.5 text-xs text-[#8aaa8a]">
      {fmt(label)}
    </span>
  )
}

function StatTile({ value, unit }: { value: string | number; unit: string }) {
  return (
    <div className="bg-[#1a2a1a] border border-[#2D4A2D] rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-[#C17F24]">{value}</div>
      <div className="text-xs text-[#8aaa8a] uppercase tracking-wide mt-1">{unit}</div>
    </div>
  )
}

export default async function HarvestDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const harvest = await prisma.harvest.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, display_name: true, avatar_url: true } },
      images: { orderBy: { display_order: 'asc' } },
      comments: {
        orderBy: { created_at: 'asc' },
        include: { user: { select: { username: true, display_name: true, avatar_url: true } } },
      },
      reactions: true,
    },
  })

  if (!harvest) notFound()

  const h = harvest
  const primaryImage = h.images[0]
  const isHunting = h.species_type === 'BIG_GAME' || h.species_type === 'BIRD'
  const isFishing = h.species_type === 'FISH'

  // Build reaction counts
  const reactionMap = new Map<string, number>()
  const userReactions = new Set<string>()
  for (const r of h.reactions) {
    reactionMap.set(r.emoji, (reactionMap.get(r.emoji) ?? 0) + 1)
    if (authUser && r.user_id === authUser.id) userReactions.add(r.emoji)
  }
  const initialReactions = Array.from(reactionMap.entries()).map(([emoji, count]) => ({
    emoji,
    count,
    userReacted: userReactions.has(emoji),
  }))

  const videoEmbed = h.video_url ? getVideoEmbed(h.video_url) : null

  return (
    <main className="min-h-screen bg-[#0d1a0d] text-white">
      <header className="sticky top-0 z-10 bg-[#0d1a0d]/95 backdrop-blur border-b border-[#2D4A2D] px-4 py-3 flex items-center gap-4">
        <a href="/feed" className="text-[#8aaa8a] hover:text-white transition-colors">← Feed</a>
        <h1 className="text-lg font-semibold">{h.species}</h1>
        {authUser?.id === h.user_id && (
          <div className="ml-auto">
            <OwnerActions harvestId={h.id} />
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Hero image */}
        {primaryImage && (
          <div className="relative aspect-[4/3] bg-[#0a0a0a]">
            <img src={primaryImage.url} alt={h.species} className="w-full h-full object-contain" />
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              {h.personal_best && (
                <span className="bg-[#C17F24] text-[#0d1a0d] text-xs font-bold px-2.5 py-0.5 rounded-full">⭐ PB</span>
              )}
              {h.catch_release && (
                <span className="bg-blue-800/80 text-blue-100 border border-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">C&R</span>
              )}
            </div>
          </div>
        )}

        <div className="px-4 py-6 space-y-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{h.species}</h2>
                <SpeciesBadge type={h.species_type} />
              </div>
            </div>
            {h.ai_id_confidence && (
              <div className="shrink-0 bg-[#1a2a1a] border border-[#2D4A2D] rounded-lg px-3 py-1.5 text-right">
                <div className="text-[10px] text-[#6a8a6a] uppercase tracking-wider">AI ID</div>
                <div className="text-sm font-semibold text-[#C17F24]">{Math.round(h.ai_id_confidence * 100)}%</div>
              </div>
            )}
          </div>

          {/* Measurements */}
          {(h.weight_lbs || h.length_in) && (
            <div className="grid grid-cols-2 gap-3">
              {h.weight_lbs && <StatTile value={h.weight_lbs} unit="Pounds" />}
              {h.length_in && <StatTile value={`${h.length_in}"`} unit="Inches" />}
            </div>
          )}

          {/* Core metadata */}
          <div className="space-y-2 text-[#8aaa8a] text-sm">
            {h.state && <div>📍 {h.state}{h.land_type ? <> · <Pill label={h.land_type} /></> : null}</div>}
            <div>📅 {new Date(h.harvested_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {h.time_of_day && <> · <Pill label={h.time_of_day} /></>}
            </div>
            {h.companions && <div>👥 {h.companions}</div>}
          </div>

          {/* Conditions */}
          {(h.weather || h.moon_phase) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#4a7a4a] mb-2">Conditions</p>
              <div className="flex gap-2 flex-wrap">
                {h.weather && <Pill label={h.weather} />}
                {h.moon_phase && <Pill label={`🌙 ${h.moon_phase}`} />}
              </div>
            </div>
          )}

          {/* Hunting details */}
          {isHunting && (h.season_type || h.tag_type || h.animal_age || h.shot_distance_yards || h.point_count || h.score) && (
            <div className="rounded-xl border border-[#2D4A2D] bg-[#111f11] p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4a7a4a]">🦌 Hunt Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {h.season_type && <><span className="text-[#6a8a6a]">Season</span><span>{fmt(h.season_type)}</span></>}
                {h.tag_type && <><span className="text-[#6a8a6a]">Tag</span><span>{fmt(h.tag_type)}</span></>}
                {h.animal_age && <><span className="text-[#6a8a6a]">Age</span><span>{fmt(h.animal_age)}</span></>}
                {h.shot_distance_yards != null && <><span className="text-[#6a8a6a]">Shot Distance</span><span>{h.shot_distance_yards} yds</span></>}
                {h.point_count != null && <><span className="text-[#6a8a6a]">Points</span><span>{h.point_count}</span></>}
                {h.score != null && <><span className="text-[#6a8a6a]">Score</span><span>{h.score}</span></>}
              </div>
            </div>
          )}

          {/* Fishing details */}
          {isFishing && (h.technique || h.water_type || h.water_conditions || h.fly_pattern || h.fish_count || h.catch_release) && (
            <div className="rounded-xl border border-[#2D4A2D] bg-[#111f11] p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4a7a4a]">🎣 Fishing Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {h.technique && <><span className="text-[#6a8a6a]">Technique</span><span>{fmt(h.technique)}</span></>}
                {h.water_type && <><span className="text-[#6a8a6a]">Water</span><span>{fmt(h.water_type)}</span></>}
                {h.water_conditions && <><span className="text-[#6a8a6a]">Conditions</span><span>{fmt(h.water_conditions)}</span></>}
                {h.fly_pattern && <><span className="text-[#6a8a6a]">Fly Pattern</span><span>{h.fly_pattern}</span></>}
                {h.fish_count != null && <><span className="text-[#6a8a6a]">Fish Count</span><span>{h.fish_count}</span></>}
                {h.catch_release && <><span className="text-[#6a8a6a]">C&amp;R</span><span className="text-blue-400">Yes ✓</span></>}
              </div>
            </div>
          )}

          {/* Video */}
          {videoEmbed && (
            videoEmbed.type === 'iframe' ? (
              <div className="rounded-xl overflow-hidden border border-[#2D4A2D] bg-black aspect-video">
                <iframe src={videoEmbed.src} className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen title="Adventure video" />
              </div>
            ) : (
              <a href={h.video_url!} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#2D4A2D] bg-[#1a2a1a] px-4 py-3 hover:border-[#C17F24] transition-colors">
                <span className="text-sm font-semibold text-white">Watch on {videoEmbed.host}</span>
              </a>
            )
          )}

          {/* Caption */}
          {h.caption && (
            <p className="text-[#c8d8c8] leading-relaxed border-l-2 border-[#2D4A2D] pl-4">{h.caption}</p>
          )}

          {/* Author */}
          <a href={`/profile/${h.user.username}`}
            className="flex items-center gap-3 bg-[#1a2a1a] border border-[#2D4A2D] rounded-xl p-3 hover:border-[#C17F24] transition-colors">
            <div className="h-10 w-10 rounded-full bg-[#2D4A2D] flex items-center justify-center font-bold text-[#8aaa8a]">
              {h.user.display_name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-sm">{h.user.display_name}</div>
              <div className="text-[#6a8a6a] text-xs">@{h.user.username}</div>
            </div>
          </a>

          {/* Reactions */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#4a7a4a]">Reactions</p>
            <ReactionBar harvestId={h.id} initialReactions={initialReactions} size="lg" currentUserId={authUser?.id ?? null} />
          </div>

          {/* Comments */}
          <CommentSection
            harvestId={h.id}
            initialComments={h.comments.map(c => ({
              id: c.id,
              body: c.body,
              created_at: c.created_at,
              user: c.user,
            }))}
            currentUserId={authUser?.id ?? null}
          />
        </div>
      </div>
    </main>
  )
}
