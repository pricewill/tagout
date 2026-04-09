"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function OwnerActions({ harvestId }: { harvestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/harvests/${harvestId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to delete");
        }
        router.push("/feed");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/harvest/${harvestId}/edit`}
        className="rounded-lg border border-[#2D4A2D] bg-[#1a2a1a] px-3 py-1.5 text-sm text-[#c8d8c8] hover:border-[#C17F24] hover:text-white transition-colors"
      >
        Edit
      </a>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/40 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
