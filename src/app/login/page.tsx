"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `https://defectivegene.club/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🎯</span>
          <h1 className="text-2xl font-bold text-amber-400 mt-2 tracking-tight">
            Defective Gene Club
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Share your adventure with the world
          </p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✉️</div>
              <h2 className="font-semibold text-white mb-1">Check your email</h2>
              <p className="text-slate-400 text-sm">
                We sent a magic link to <strong className="text-slate-200">{email}</strong>.
                Click the link to sign in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-amber-400 hover:underline text-sm"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <h2 className="font-semibold text-white mb-4">Sign in to Defective Gene Club</h2>
                <label className="block text-sm text-slate-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Send Magic Link
              </Button>

              <p className="text-xs text-slate-500 text-center">
                No password needed — we&apos;ll email you a sign-in link.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
