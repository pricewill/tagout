"use client";

import { cn, SPECIES_TYPE_COLORS, SPECIES_TYPE_LABELS } from "@/lib/utils";

interface SpeciesBadgeProps {
  type: string;
  className?: string;
}

export function SpeciesBadge({ type, className }: SpeciesBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
        SPECIES_TYPE_COLORS[type] ?? "bg-slate-600/80 text-slate-100 border-slate-500",
        className
      )}
    >
      {SPECIES_TYPE_LABELS[type] ?? type}
    </span>
  );
}
