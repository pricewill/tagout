type SpeciesType = 'FISH' | 'BIG_GAME' | 'BIRD' | 'OTHER'

const CONFIG: Record<SpeciesType, { label: string; className: string }> = {
  FISH: {
    label: 'Fish',
    className: 'bg-green-700/80 text-green-100 border border-green-600',
  },
  BIG_GAME: {
    label: 'Big Game',
    className: 'bg-amber-700/80 text-amber-100 border border-amber-600',
  },
  BIRD: {
    label: 'Bird',
    className: 'bg-blue-700/80 text-blue-100 border border-blue-600',
  },
  OTHER: {
    label: 'Other',
    className: 'bg-slate-600/80 text-slate-100 border border-slate-500',
  },
}

interface SpeciesBadgeProps {
  species_type: SpeciesType
  className?: string
}

export function SpeciesBadge({ species_type, className = '' }: SpeciesBadgeProps) {
  const { label, className: colorClass } = CONFIG[species_type] ?? CONFIG.OTHER
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
}
