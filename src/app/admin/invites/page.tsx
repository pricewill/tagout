"use client";

import { useEffect, useState } from "react";

interface InviteCode {
  id: string;
  code: string;
  created_by: string | null;
  used_by_email: string | null;
  used_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminInvitesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [createdBy, setCreatedBy] = useState("");

  async function fetchCodes() {
    const res = await fetch("/api/admin/invites");
    const data = await res.json();
    setCodes(data.codes ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchCodes(); }, []);

  async function generateCode() {
    setGenerating(true);
    await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ created_by: createdBy.trim() || null }),
    });
    setCreatedBy("");
    await fetchCodes();
    setGenerating(false);
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/invites/${id}`, { method: "PATCH" });
    setCodes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_active: false } : c))
    );
  }

  const active = codes.filter((c) => c.is_active && !c.used_at);
  const used = codes.filter((c) => c.used_at);
  const deactivated = codes.filter((c) => !c.is_active && !c.used_at);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🧬</span>
        <div>
          <h1 className="text-xl font-bold text-white">Invite Codes</h1>
          <p className="text-slate-400 text-sm">Defective Gene Club — Admin</p>
        </div>
      </div>

      {/* Generate */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider">
          Generate New Code
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Note (optional, e.g. 'for John')"
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={generateCode}
            disabled={generating}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
          >
            {generating ? "Generating…" : "Generate Code"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active", value: active.length, color: "text-green-400" },
          { label: "Used", value: used.length, color: "text-slate-400" },
          { label: "Deactivated", value: deactivated.length, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Code list */}
      {loading ? (
        <p className="text-slate-500 text-sm">Loading…</p>
      ) : codes.length === 0 ? (
        <p className="text-slate-500 text-sm">No invite codes yet.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((c) => {
            const isUsed = !!c.used_at;
            const isActive = c.is_active && !isUsed;

            return (
              <div
                key={c.id}
                className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-4"
              >
                {/* Status dot */}
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isUsed
                      ? "bg-slate-500"
                      : isActive
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />

                {/* Code */}
                <span className="font-mono text-sm font-semibold text-amber-400 tracking-wider flex-1">
                  {c.code}
                </span>

                {/* Meta */}
                <div className="text-xs text-slate-500 text-right hidden sm:block">
                  {isUsed ? (
                    <span className="text-slate-400">
                      Used by {c.used_by_email ?? "unknown"} ·{" "}
                      {new Date(c.used_at!).toLocaleDateString()}
                    </span>
                  ) : isActive ? (
                    <span className="text-green-400">Active</span>
                  ) : (
                    <span className="text-red-400">Deactivated</span>
                  )}
                  {c.created_by && (
                    <div className="text-slate-600 mt-0.5">{c.created_by}</div>
                  )}
                </div>

                {/* Created at */}
                <span className="text-xs text-slate-600 hidden md:block shrink-0">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>

                {/* Deactivate button */}
                {isActive && (
                  <button
                    onClick={() => deactivate(c.id)}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-800/50 hover:border-red-600 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
