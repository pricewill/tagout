'use client'

import { useState } from 'react'

export type SpeciesIdResult = {
  species: string | null
  scientific_name?: string
  species_type?: 'FISH' | 'BIG_GAME' | 'BIRD' | 'OTHER'
  confidence: number
  distinguishing_features?: string
  common_range?: string
  notes?: string
  error?: string
}

export function useSpeciesId() {
  const [result, setResult] = useState<SpeciesIdResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function identify(imageUrl: string) {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/ai-identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      const data: SpeciesIdResult = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to identify species')
        return
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { identify, result, loading, error }
}
