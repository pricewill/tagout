"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    home_state: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        router.push("/feed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🎯</span>
          <h1 className="text-2xl font-bold text-amber-400 mt-2">Welcome to Defective Gene Club!</h1>
          <p className="text-slate-400 text-sm mt-1">Set up your hunter profile</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="buckhunter99"
                maxLength={30}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <p className="text-xs text-slate-500 mt-1">Letters, numbers, underscores only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Display Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.display_name}
                onChange={(e) => update("display_name", e.target.value)}
                placeholder="John Smith"
                maxLength={60}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Where are you based?
              </label>
              <input
                type="text"
                value={form.home_state}
                onChange={(e) => update("home_state", e.target.value)}
                placeholder="e.g. Montana, New Zealand, Bahamas..."
                maxLength={100}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="Avid bass fisherman & whitetail hunter…"
                rows={3}
                maxLength={300}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Create Profile
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
