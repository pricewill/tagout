"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export const REACTIONS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "😮", label: "Impressive" },
  { emoji: "🎯", label: "Clean Shot" },
  { emoji: "🐟", label: "Nice Fish" },
  { emoji: "👏", label: "Respect" },
] as const;

export type ReactionEmoji = (typeof REACTIONS)[number]["emoji"];

export interface ReactionCount {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface ReactionBarProps {
  harvestId: string;
  initialReactions: ReactionCount[];
  currentUserId?: string | null;
  size?: "sm" | "lg";
}

function buildState(data: ReactionCount[]): ReactionCount[] {
  const map = new Map(data.map((r) => [r.emoji, r]));
  return REACTIONS.map(({ emoji }) => ({
    emoji,
    count: map.get(emoji)?.count ?? 0,
    userReacted: map.get(emoji)?.userReacted ?? false,
  }));
}

export function ReactionBar({
  harvestId,
  initialReactions,
  currentUserId,
  size = "sm",
}: ReactionBarProps) {
  const [reactions, setReactions] = useState(() => buildState(initialReactions));
  const [isPending, startTransition] = useTransition();

  const toggle = (emoji: string) => {
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }

    // Optimistic update
    setReactions((prev) =>
      prev.map((r) =>
        r.emoji === emoji
          ? {
              ...r,
              count: r.userReacted ? r.count - 1 : r.count + 1,
              userReacted: !r.userReacted,
            }
          : r
      )
    );

    startTransition(async () => {
      try {
        const res = await fetch(`/api/harvests/${harvestId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        if (!res.ok) throw new Error("Failed");
      } catch {
        // Revert on failure
        setReactions((prev) =>
          prev.map((r) =>
            r.emoji === emoji
              ? {
                  ...r,
                  count: r.userReacted ? r.count - 1 : r.count + 1,
                  userReacted: !r.userReacted,
                }
              : r
          )
        );
      }
    });
  };

  const isLg = size === "lg";

  return (
    <div className={cn("flex flex-wrap", isLg ? "gap-2" : "gap-1.5")}>
      {reactions.map(({ emoji, count, userReacted }) => {
        const reaction = REACTIONS.find((r) => r.emoji === emoji);
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={isPending}
            title={reaction?.label}
            className={cn(
              "flex items-center gap-1 rounded-full border font-medium transition-all duration-150",
              isLg ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
              userReacted
                ? "bg-amber-900/40 border-amber-600/50 text-amber-300 scale-105 shadow-sm shadow-amber-900/30"
                : "bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 hover:bg-slate-700/60"
            )}
          >
            <span className={isLg ? "text-base" : "text-sm"}>{emoji}</span>
            {count > 0 && (
              <span
                className={cn(
                  "tabular-nums",
                  userReacted ? "text-amber-300" : "text-slate-500"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
