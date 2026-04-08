"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvitePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid invite code.");
        setLoading(false);
        return;
      }

      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <span className="text-4xl">🧬</span>
          <h1 className="text-2xl font-bold text-amber-400 mt-2 tracking-tight">
            Defective Gene Club
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            This community is invite-only.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-white mb-1">Enter your invite code</h2>
            <p className="text-slate-400 text-sm">
              You need a valid invite code to create an account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DGC-XXXX-XXXX"
                required
                autoFocus
                autoCapitalize="characters"
                spellCheck={false}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white text-center text-lg font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length === 0}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Checking…" : "Continue"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Don&apos;t have a code? Ask an existing member to invite you.
        </p>
      </div>
    </main>
  );
}
