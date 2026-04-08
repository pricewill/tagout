"use client";

import Link from "next/link";
import { MessageCircle, Scale, Ruler } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SpeciesBadge } from "@/components/ui/SpeciesBadge";
import { Avatar } from "@/components/ui/Avatar";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ReactionBar, ReactionCount } from "@/components/ReactionBar";
import { formatWeight, formatLength } from "@/lib/utils";

interface HarvestCardProps {
  harvest: {
    id: string;
    species: string;
    species_type: string;
    method: string;
    weight_lbs: number | null;
    length_in: number | null;
    caption: string | null;
    harvested_at: Date | string;
    user: {
      username: string;
      display_name: string;
      avatar_url: string | null;
    };
    images: { url: string; display_order: number }[];
    _count?: { comments: number };
  };
  reactions?: ReactionCount[];
  currentUserId?: string | null;
}

export function HarvestCard({ harvest, reactions = [], currentUserId }: HarvestCardProps) {
  const sortedImages = [...harvest.images].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <article className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-colors">
      {/* Image */}
      <Link href={`/harvest/${harvest.id}`}>
        <ImageCarousel
          images={sortedImages.map((img) => ({ url: img.url }))}
          aspectRatio="square"
        />
      </Link>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Header: user + badge */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/profile/${harvest.user.username}`}
            className="flex items-center gap-2 group"
          >
            <Avatar
              src={harvest.user.avatar_url}
              alt={harvest.user.display_name}
              size="sm"
            />
            <span className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition-colors">
              {harvest.user.display_name}
            </span>
          </Link>
          <SpeciesBadge type={harvest.species_type} />
        </div>

        {/* Species + method */}
        <div>
          <Link href={`/harvest/${harvest.id}`} className="hover:text-amber-400 transition-colors">
            <h3 className="font-bold text-white text-lg leading-tight">
              {harvest.species}
            </h3>
          </Link>
          <p className="text-slate-400 text-sm">{harvest.method}</p>
        </div>

        {/* Measurements */}
        <div className="flex flex-wrap gap-3 text-sm text-slate-400">
          {harvest.weight_lbs != null && (
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 shrink-0" />
              {formatWeight(harvest.weight_lbs)}
            </span>
          )}
          {harvest.length_in != null && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 shrink-0" />
              {formatLength(harvest.length_in)}
            </span>
          )}
        </div>

        {/* Caption */}
        {harvest.caption && (
          <p className="text-slate-300 text-sm line-clamp-2">{harvest.caption}</p>
        )}

        {/* Reactions */}
        <ReactionBar
          harvestId={harvest.id}
          initialReactions={reactions}
          currentUserId={currentUserId}
          size="sm"
        />

        {/* Footer: comments + time */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
          <Link
            href={`/harvest/${harvest.id}#comments`}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {harvest._count?.comments ?? 0}
          </Link>
          <time className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(harvest.harvested_at), {
              addSuffix: true,
            })}
          </time>
        </div>
      </div>
    </article>
  );
}
