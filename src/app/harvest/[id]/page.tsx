'use client'

import { useState } from 'react'
import { SpeciesBadge } from '@/components/SpeciesBadge'
import { ReactionBar, ReactionCount } from '@/components/ReactionBar'

type SpeciesType = 'FISH' | 'BIG_GAME' | 'BIRD' | 'OTHER'

interface Harvest {
  id: string
  imageUrl: string
  species: string
  species_type: SpeciesType
  method: string
  state?: string
  harvested_at: string
  weight_lbs?: number
  length_in?: number
  caption?: string
  ai_id_result?: string
  ai_id_confidence?: number
  scientific_name?: string
  reactions?: ReactionCount[]
  comment_count: number
  video_url?: string
  // general
  companions?: string
  land_type?: string
  weather?: string
  moon_phase?: string
  time_of_day?: string
  personal_best?: boolean
  harvest_success?: boolean
  // hunting
  season_type?: string
  tag_type?: string
  animal_age?: string
  shot_distance_yards?: number
  point_count?: number
  score?: number
  // fishing
  fly_pattern?: string
  water_type?: string
  technique?: string
  catch_release?: boolean
  fish_count?: number
  water_conditions?: string
  user: { username: string; display_name: string; avatar_url: string | null }
  comments: { id: string; username: string; body: string; created_at: string }[]
}

// TODO: replace with real data fetch once Supabase/Prisma is wired up:
// const harvest = await prisma.harvest.findUnique({ where: { id: params.id }, include: { user: true, images: true, comments: { include: { user: true } }, ... } })
const harvest: Harvest | null = null

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

function VideoEmbed({ url }: { url: string }) {
  const embed = getVideoEmbed(url)
  if (!embed) return null

  if (embed.type === 'iframe') {
    return (
      <div className="rounded-xl overflow-hidden border border-[#2D4A2D] bg-black aspect-video">
        <iframe
          src={embed.src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Harvest video"
        />
      </div>
    )
  }

  // link-only (Instagram / TikTok)
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-[#2D4A2D] bg-[#1a2a1a] px-4 py-3 hover:border-[#C17F24] transition-colors">
      <div className="h-10 w-10 rounded-full bg-[#2D4A2D] flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#C17F24]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-semibold text-white">Watch on {embed.host}</div>
        <div className="text-xs text-[#6a8a6a] truncate max-w-[240px]">{url}</div>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#6a8a6a] ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

// ─── small atoms ──────────────────────────────────────────────────────────────
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

function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[#8aaa8a] text-sm">
      <span className="text-[#4a6a4a] shrink-0">{icon}</span>
      {children}
    </div>
  )
}

const PinIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const CalIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const ScaleIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
const PeopleIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>

// ─── page ─────────────────────────────────────────────────────────────────────
export default function HarvestDetailPage() {
  const h = harvest
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(h?.comments ?? [])

  if (!h) {
    return (
      <main className="min-h-screen bg-[#0d1a0d] text-white">
        <header className="sticky top-0 z-10 bg-[#0d1a0d]/95 backdrop-blur border-b border-[#2D4A2D] px-4 py-3 flex items-center gap-4">
          <a href="/feed" className="text-[#8aaa8a] hover:text-white transition-colors">← Feed</a>
          <h1 className="text-lg font-semibold text-[#8aaa8a]">Harvest</h1>
        </header>
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <div className="h-16 w-16 rounded-full bg-[#1a2a1a] border border-[#2D4A2D] flex items-center justify-center mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#3a5a3a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#c8d8c8] mb-2">Harvest not found</h3>
          <p className="text-[#6a8a6a] text-sm mb-6 max-w-xs">
            This post doesn&apos;t exist or may have been removed.
          </p>
          <a href="/feed" className="text-[#C17F24] text-sm hover:underline">← Back to Feed</a>
        </div>
      </main>
    )
  }

  const isHunting = h.species_type === 'BIG_GAME' || h.species_type === 'BIRD'
  const isFishing = h.species_type === 'FISH'

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setComments((p) => [...p, { id: `c${Date.now()}`, username: 'you', body: comment, created_at: new Date().toISOString() }])
    setComment('')
  }

  return (
    <main className="min-h-screen bg-[#0d1a0d] text-white">
      <header className="sticky top-0 z-10 bg-[#0d1a0d]/95 backdrop-blur border-b border-[#2D4A2D] px-4 py-3 flex items-center gap-4">
        <a href="/feed" className="text-[#8aaa8a] hover:text-white transition-colors">← Feed</a>
        <h1 className="text-lg font-semibold">{h.species}</h1>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="relative aspect-[4/3] bg-[#0f1a0f]">
          <img src={h.imageUrl} alt={h.species} className="w-full h-full object-cover" />
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {h.personal_best && (
              <span className="bg-[#C17F24] text-[#0d1a0d] text-xs font-bold px-2.5 py-0.5 rounded-full">⭐ PB</span>
            )}
            {h.catch_release && (
              <span className="bg-blue-800/80 text-blue-100 border border-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">C&R</span>
            )}
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold">{h.species}</h2>
                <SpeciesBadge species_type={h.species_type} />
              </div>
              {h.scientific_name && <p className="text-[#8aaa8a] text-sm italic">{h.scientific_name}</p>}
            </div>
            {h.ai_id_confidence && (
              <div className="shrink-0 bg-[#1a2a1a] border border-[#2D4A2D] rounded-lg px-3 py-1.5 text-right">
                <div className="text-[10px] text-[#6a8a6a] uppercase tracking-wider">AI ID</div>
                <div className="text-sm font-semibold text-[#C17F24]">{Math.round(h.ai_id_confidence * 100)}%</div>
              </div>
            )}
          </div>

          {/* Measurement tiles */}
          {(h.weight_lbs || h.length_in) && (
            <div className="grid grid-cols-2 gap-3">
              {h.weight_lbs && <StatTile value={h.weight_lbs} unit="Pounds" />}
              {h.length_in && <StatTile value={`${h.length_in}"`} unit="Inches" />}
            </div>
          )}

          {/* Core metadata */}
          <div className="space-y-2">
            {(h.state || h.land_type) && (
              <MetaRow icon={PinIcon}>
                {h.state ?? ''}{h.land_type ? <> · <Pill label={h.land_type} /></> : null}
              </MetaRow>
            )}
            <MetaRow icon={CalIcon}>
              {new Date(h.harvested_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {h.time_of_day && <> · <Pill label={h.time_of_day} /></>}
            </MetaRow>
            <MetaRow icon={ScaleIcon}>{h.method}</MetaRow>
            {h.companions && <MetaRow icon={PeopleIcon}>{h.companions}</MetaRow>}
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

          {/* Hunting-specific */}
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

          {/* Fishing-specific */}
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

          {/* Video embed */}
          {h.video_url && <VideoEmbed url={h.video_url} />}

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
            <ReactionBar
              harvestId={h.id}
              initialReactions={h.reactions ?? []}
              size="lg"
            />
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <h3 className="font-semibold text-[#c8d8c8]">Comments ({comments.length})</h3>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-[#1a2a1a] border border-[#2D4A2D] rounded-xl p-3">
                  <div className="text-xs text-[#C17F24] font-semibold mb-1">@{c.username}</div>
                  <p className="text-sm text-[#c8d8c8]">{c.body}</p>
                </div>
              ))}
            </div>
            <form onSubmit={submitComment} className="flex gap-2">
              <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…"
                className="flex-1 bg-[#1a2a1a] border border-[#2D4A2D] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C17F24]" />
              <button type="submit"
                className="bg-[#C17F24] text-[#0d1a0d] px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#d4912a] transition-colors">
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
