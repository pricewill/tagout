import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl mb-6">🎯</p>
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-slate-400 mb-6">This page shot off into the woods.</p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    </main>
  );
}
