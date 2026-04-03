"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  harvestId: string;
  initialCount: number;
  initialLiked: boolean;
  userId?: string | null;
}

export function LikeButton({
  harvestId,
  initialCount,
  initialLiked,
  userId,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  async function handleToggle() {
    if (!userId) {
      window.location.href = "/login";
      return;
    }

    startTransition(async () => {
      const prev = liked;
      setLiked(!prev);
      setCount((c) => (prev ? c - 1 : c + 1));

      try {
        const res = await fetch(`/api/harvests/${harvestId}/like`, {
          method: "POST",
        });
        if (!res.ok) {
          setLiked(prev);
          setCount((c) => (prev ? c + 1 : c - 1));
        }
      } catch {
        setLiked(prev);
        setCount((c) => (prev ? c + 1 : c - 1));
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        liked
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          : "bg-slate-700/60 text-slate-400 hover:text-red-400 hover:bg-slate-700"
      )}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart className={cn("w-5 h-5", liked && "fill-red-400")} />
      <span>{count}</span>
    </button>
  );
}
