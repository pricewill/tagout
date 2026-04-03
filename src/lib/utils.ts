import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(lbs: number | null | undefined): string {
  if (lbs == null) return "";
  return `${lbs} lbs`;
}

export function formatLength(inches: number | null | undefined): string {
  if (inches == null) return "";
  return `${inches}"`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SPECIES_TYPE_LABELS: Record<string, string> = {
  FISH: "Fish",
  BIG_GAME: "Big Game",
  BIRD: "Bird",
  OTHER: "Other",
};

export const SPECIES_TYPE_COLORS: Record<string, string> = {
  FISH:      "bg-blue-700/80 text-blue-100 border-blue-600",
  BIG_GAME:  "bg-amber-700/80 text-amber-100 border-amber-600",
  BIRD:      "bg-forest-700/80 text-forest-100 border-forest-600",
  OTHER:     "bg-slate-600/80 text-slate-100 border-slate-500",
};

export const METHOD_OPTIONS = [
  "Fly rod",
  "Spinning rod",
  "Baitcasting",
  "Ice fishing",
  "Bow and arrow",
  "Archery",
  "Crossbow",
  "Rifle",
  "Shotgun",
  "Muzzleloader",
  "Handgun",
  "Trap",
  "Snare",
  "Other",
];

export const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];
