"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HarvestCard } from "@/components/HarvestCard";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { ReactionCount } from "@/components/ReactionBar";

interface HarvestData {
  id: string;
  species: string;
  species_type: string;
  method: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  caption: string | null;
  harvested_at: string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  images: { url: string; display_order: number }[];
  _count?: { comments: number };
}

interface FeedInfiniteScrollProps {
  initialHarvests: HarvestData[];
  initialReactions: Record<string, ReactionCount[]>;
  initialHasMore: boolean;
  currentUserId?: string | null;
}

export function FeedInfiniteScroll({
  initialHarvests,
  initialReactions,
  initialHasMore,
  currentUserId,
}: FeedInfiniteScrollProps) {
  const [harvests, setHarvests] = useState<HarvestData[]>(initialHarvests);
  const [reactions, setReactions] =
    useState<Record<string, ReactionCount[]>>(initialReactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?offset=${harvests.length}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setHarvests((prev) => [...prev, ...data.harvests]);
      setReactions((prev) => ({ ...prev, ...data.reactions }));
      setHasMore(data.hasMore);
    } catch {
      // Allow retry on next intersection
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, harvests.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {harvests.map((harvest) => (
          <HarvestCard
            key={harvest.id}
            harvest={harvest}
            reactions={reactions[harvest.id] ?? []}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {/* Sentinel / loading / end message */}
      <div ref={sentinelRef} className="mt-8 flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading more adventures…</span>
          </div>
        )}
        {!hasMore && harvests.length > 0 && !loading && (
          <div className="flex items-center gap-2 text-slate-500 py-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm">You&apos;re all caught up!</span>
          </div>
        )}
      </div>
    </>
  );
}
