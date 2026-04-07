'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSpeciesId } from '@/hooks/useSpeciesId'
import { SpeciesBadge } from '@/components/SpeciesBadge'

// ─── helpers ──────────────────────────────────────────────────────────────────
const optNum = z.union([z.coerce.number().positive(), z.literal('')]).optional()
const optStr = z.string().optional()

const harvestSchema = z.object({
  // core
  species:        z.string().min(1, 'Species is required'),
  species_type:   z.enum(['FISH', 'BIG_GAME', 'BIRD', 'OTHER']),
  method:         z.string().min(1, 'Method is required'),
  location_label: z.string().min(1, 'Location is required'),
  weight_lbs:     optNum,
  length_in:      optNum,
  harvested_at:   z.string().min(1, 'Date is required'),
  caption:        optStr,

  // general
  companions:      optStr,
  state:           optStr,
  land_type:       optStr,
  weather:         optStr,
  moon_phase:      optStr,
  time_of_day:     optStr,
  personal_best:   z.boolean().optional(),
  harvest_success: z.boolean().optional(),
  video_url:       optStr,

  // hunting
  shot_distance_yards: optNum,
  season_type:         optStr,
  tag_type:            optStr,
  animal_age:          optStr,
  point_count:         optNum,
  score:               optNum,

  // fishing
  fly_pattern:      optStr,
  water_type:       optStr,
  technique:        optStr,
  catch_release:    z.boolean().optional(),
  fish_count:       optNum,
  water_conditions: optStr,
})

type HarvestFormValues = z.infer<typeof harvestSchema>

const STEPS = ['Photo', 'Details', 'Conditions', 'Caption']

// ─── small reusable atoms ─────────────────────────────────────────────────────
const inputCls = 'w-full bg-[#1a2a1a] border border-[#2D4A2D] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C17F24]'
const selectCls = `${inputCls} appearance-none`
const labelCls = 'block text-xs font-medium text-[#8aaa8a] mb-1 uppercase tracking-wide'
const sectionCls = 'rounded-xl border border-[#2D4A2D] bg-[#111f11] p-4 space-y-4'
const sectionTitleCls = 'text-xs font-bold uppercase tracking-widest text-[#4a7a4a] mb-1'

function SelectField({ label, name, options, register }: {
  label: string; name: string; options: string[]; register: any
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select {...register(name)} className={selectCls}>
        <option value="">— optional —</option>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  )
}

function CheckboxField({ label, name, register }: { label: string; name: string; register: any }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" {...register(name)} className="h-4 w-4 rounded border-[#2D4A2D] bg-[#1a2a1a] accent-[#C17F24]" />
      <span className="text-sm text-[#c8d8c8]">{label}</span>
    </label>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function NewPostPage() {
  const [step, setStep] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [aiBannerDismissed, setAiBannerDismissed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const { identify, result: aiResult, loading: aiLoading } = useSpeciesId()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema) as any,
    defaultValues: { species_type: 'FISH', harvest_success: true, personal_best: false, catch_release: false },
  })

  const speciesType = watch('species_type')
  const isHunting = speciesType === 'BIG_GAME' || speciesType === 'BIRD'
  const isFishing = speciesType === 'FISH'

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = (file: File) => {
    if (!file.type.match(/image\/(jpeg|png)/)) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      setAiBannerDismissed(false)
      identify('https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600')
    }
    reader.readAsDataURL(file)
  }

  const handleAiAccept = () => {
    if (aiResult?.species) setValue('species', aiResult.species)
    if (aiResult?.species_type) setValue('species_type', aiResult.species_type)
  }

  const onSubmit = (data: unknown) => {
    console.log('Mock submit:', data)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#0d1a0d] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">🎯</div>
          <h2 className="text-2xl font-bold text-[#C17F24]">Harvest Tagged!</h2>
          <p className="text-[#8aaa8a]">Your post has been submitted (mock).</p>
          <a href="/feed" className="inline-block bg-[#C17F24] text-[#0d1a0d] px-6 py-2 rounded-full font-semibold hover:bg-[#d4912a] transition-colors">
            Back to Feed
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0d1a0d] text-white">
      <header className="sticky top-0 z-10 bg-[#0d1a0d]/95 backdrop-blur border-b border-[#2D4A2D] px-4 py-3 flex items-center gap-4">
        <a href="/feed" className="text-[#8aaa8a] hover:text-white transition-colors">← Back</a>
        <h1 className="text-lg font-semibold">New Harvest Post</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                ${i < step ? 'bg-[#2D4A2D] text-[#8aaa8a]' : i === step ? 'bg-[#C17F24] text-[#0d1a0d]' : 'bg-[#1a2a1a] text-[#4a6a4a]'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block truncate ${i === step ? 'text-white' : 'text-[#4a6a4a]'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ml-1 ${i < step ? 'bg-[#2D4A2D]' : 'bg-[#1a2a1a]'}`} />}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Photo ── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upload Photo</h2>

            {aiLoading && (
              <div className="bg-[#1a2a1a] border border-[#2D4A2D] rounded-lg p-3 text-sm text-[#8aaa8a] flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-[#C17F24] border-t-transparent animate-spin" />
                AI is analyzing your catch…
              </div>
            )}

            {aiResult && !aiBannerDismissed && (
              <div className="bg-[#1a2a1a] border border-[#2D4A2D] rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="flex-1 text-sm">
                  {aiResult.species ? (
                    <>
                      <span className="text-[#C17F24] font-semibold">AI identified: </span>
                      <span className="text-white">{aiResult.species}</span>
                      <span className="text-[#8aaa8a]"> — {Math.round(aiResult.confidence * 100)}% confidence</span>
                      <div className="mt-2">
                        <button onClick={handleAiAccept} className="text-xs bg-[#2D4A2D] text-[#8aaa8a] px-3 py-1 rounded-full hover:text-white transition-colors">
                          Use this
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-[#8aaa8a]">{aiResult.error ?? 'No species detected'}</span>
                  )}
                </div>
                <button onClick={() => setAiBannerDismissed(true)} className="text-[#4a6a4a] hover:text-white text-lg leading-none">×</button>
              </div>
            )}

            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative border-2 border-dashed border-[#2D4A2D] rounded-xl aspect-[4/3] flex items-center justify-center cursor-pointer hover:border-[#C17F24] transition-colors bg-[#0f1a0f] overflow-hidden"
            >
              <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[#4a6a4a] space-y-2 p-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Drop your photo here</p>
                  <p className="text-xs">or click to browse — JPG / PNG</p>
                </div>
              )}
            </div>

            <button onClick={() => setStep(1)} disabled={!previewUrl}
              className="w-full bg-[#C17F24] text-[#0d1a0d] py-3 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4912a] transition-colors">
              Continue
            </button>
          </div>
        )}

        {/* ── STEP 1: Core Details ── */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Harvest Details</h2>

            {/* ── Species ── */}
            <div className={sectionCls}>
              <p className={sectionTitleCls}>Species</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Species *</label>
                  <input {...register('species')} placeholder="e.g. Cutthroat Trout"
                    className={inputCls} />
                  {errors.species && <p className="text-red-400 text-xs mt-1">{errors.species.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Species Type *</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['FISH', 'BIG_GAME', 'BIRD', 'OTHER'] as const).map((type) => (
                      <label key={type} className="cursor-pointer">
                        <input type="radio" value={type} {...register('species_type')} className="sr-only" />
                        <SpeciesBadge species_type={type}
                          className={`cursor-pointer transition-opacity ${speciesType === type ? 'opacity-100 ring-2 ring-white/30' : 'opacity-50'}`} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Where / When ── */}
            <div className={sectionCls}>
              <p className={sectionTitleCls}>Where &amp; When</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Location *</label>
                  <input {...register('location_label')} placeholder="e.g. Snake River, WY" className={inputCls} />
                  {errors.location_label && <p className="text-red-400 text-xs mt-1">{errors.location_label.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input {...register('state')} placeholder="WY" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Date *</label>
                  <input {...register('harvested_at')} type="date"
                    className={`${inputCls} [color-scheme:dark]`} />
                  {errors.harvested_at && <p className="text-red-400 text-xs mt-1">{errors.harvested_at.message}</p>}
                </div>
                <div className="col-span-2">
                  <SelectField label="Land Type" name="land_type" options={['PUBLIC', 'PRIVATE', 'UNKNOWN']} register={register} />
                </div>
              </div>
            </div>

            {/* ── Measurements ── */}
            <div className={sectionCls}>
              <p className={sectionTitleCls}>Measurements</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Weight (lbs)</label>
                  <input {...register('weight_lbs')} type="number" step="0.1" min="0" placeholder="0.0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Length (in)</label>
                  <input {...register('length_in')} type="number" step="0.1" min="0" placeholder="0.0" className={inputCls} />
                </div>
              </div>
            </div>

            {/* ── Method ── */}
            <div className={sectionCls}>
              <p className={sectionTitleCls}>Method</p>
              <div>
                <label className={labelCls}>Method *</label>
                <input {...register('method')} placeholder="e.g. Fly fishing, Rifle, Archery…" className={inputCls} />
                {errors.method && <p className="text-red-400 text-xs mt-1">{errors.method.message}</p>}
              </div>
            </div>

            <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </div>
        )}

        {/* ── STEP 2: Conditions (general + sport-specific) ── */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Conditions &amp; Details</h2>

            {/* ── General conditions ── */}
            <div className={sectionCls}>
              <p className={sectionTitleCls}>Conditions</p>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Time of Day" name="time_of_day" options={['MORNING', 'MIDDAY', 'EVENING', 'NIGHT']} register={register} />
                <SelectField label="Weather" name="weather" options={['SUNNY', 'OVERCAST', 'WIND', 'RAIN', 'SNOW']} register={register} />
                <SelectField label="Moon Phase" name="moon_phase"
                  options={['NEW', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS', 'FULL', 'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT']}
                  register={register} />
                <div>
                  <label className={labelCls}>Companions</label>
                  <input {...register('companions')} placeholder="Solo, or names…" className={inputCls} />
                </div>
                <div className="col-span-2 flex gap-4 pt-1">
                  <CheckboxField label="Personal best" name="personal_best" register={register} />
                  <CheckboxField label="Successful harvest" name="harvest_success" register={register} />
                </div>
              </div>
            </div>

            {/* ── Hunting-specific ── */}
            {isHunting && (
              <div className={sectionCls}>
                <p className={sectionTitleCls}>🦌 Hunting Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Season Type" name="season_type"
                    options={['ARCHERY', 'MUZZLELOADER', 'RIFLE', 'GENERAL', 'SHOTGUN']} register={register} />
                  <SelectField label="Tag Type" name="tag_type"
                    options={['GENERAL', 'LIMITED_ENTRY', 'OTC', 'PRIVATE']} register={register} />
                  <SelectField label="Animal Age" name="animal_age"
                    options={['MATURE', 'YOUNG', 'UNKNOWN']} register={register} />
                  <div>
                    <label className={labelCls}>Shot Distance (yds)</label>
                    <input {...register('shot_distance_yards')} type="number" min="0" placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Point Count</label>
                    <input {...register('point_count')} type="number" min="0" placeholder="e.g. 6" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Score (B&amp;C / P&amp;Y)</label>
                    <input {...register('score')} type="number" step="0.1" min="0" placeholder="0.0" className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Fishing-specific ── */}
            {isFishing && (
              <div className={sectionCls}>
                <p className={sectionTitleCls}>🎣 Fishing Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Technique" name="technique"
                    options={['DRY_FLY', 'NYMPH', 'STREAMER', 'SPIN', 'BAITCAST', 'TROLLING', 'ICE_FISHING', 'FLY']} register={register} />
                  <SelectField label="Water Type" name="water_type"
                    options={['RIVER', 'LAKE', 'RESERVOIR', 'STREAM', 'POND', 'BAY_ESTUARY', 'OCEAN_OFFSHORE', 'OCEAN_FLATS']} register={register} />
                  <SelectField label="Water Conditions" name="water_conditions"
                    options={['CLEAR', 'MURKY', 'HIGH', 'LOW']} register={register} />
                  <div>
                    <label className={labelCls}>Fly Pattern</label>
                    <input {...register('fly_pattern')} placeholder="e.g. PMD #16" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Fish Count</label>
                    <input {...register('fish_count')} type="number" min="1" placeholder="1" className={inputCls} />
                  </div>
                  <div className="col-span-2 pt-1">
                    <CheckboxField label="Catch &amp; release" name="catch_release" register={register} />
                  </div>
                </div>
              </div>
            )}

            <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {/* ── STEP 3: Caption & Submit ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <h2 className="text-xl font-semibold">Caption &amp; Submit</h2>

            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-full aspect-video object-cover rounded-xl" />
            )}

            <div>
              <label className={labelCls}>Caption (optional)</label>
              <textarea {...register('caption')} rows={4}
                placeholder="Share the story behind this harvest…"
                className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className={labelCls}>Video URL (optional)</label>
              <input {...register('video_url')} placeholder="https://…" className={inputCls} />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)}
                className="flex-1 bg-[#1a2a1a] border border-[#2D4A2D] text-[#8aaa8a] py-3 rounded-xl font-semibold hover:text-white transition-colors">
                Back
              </button>
              <button type="submit"
                className="flex-1 bg-[#C17F24] text-[#0d1a0d] py-3 rounded-xl font-semibold hover:bg-[#d4912a] transition-colors">
                Tag It
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

// ─── nav buttons ──────────────────────────────────────────────────────────────
function NavButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onBack}
        className="flex-1 bg-[#1a2a1a] border border-[#2D4A2D] text-[#8aaa8a] py-3 rounded-xl font-semibold hover:text-white transition-colors">
        Back
      </button>
      <button type="button" onClick={onNext}
        className="flex-1 bg-[#C17F24] text-[#0d1a0d] py-3 rounded-xl font-semibold hover:bg-[#d4912a] transition-colors">
        Continue
      </button>
    </div>
  )
}
