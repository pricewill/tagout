import { HarvestCard } from '@/components/HarvestCard'

// TODO: replace with real data fetch once Supabase/Prisma is wired up:
// const { data: harvests } = await supabase.from('harvests').select(...)
const harvests: HarvestCardData[] = []

export default function FeedPage() {
  return (
    <main className="min-h-screen bg-[#0d1a0d] text-white">
      <header className="sticky top-0 z-10 bg-[#0d1a0d]/95 backdrop-blur border-b border-[#2D4A2D] px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-[#C17F24]">TagOut</h1>
        <nav className="flex items-center gap-4 text-sm text-[#8aaa8a]">
          <a href="/feed" className="text-white font-medium">Feed</a>
          <a href="/leaderboard" className="hover:text-white transition-colors">Leaderboard</a>
          <a href="/post/new" className="bg-[#C17F24] text-[#0d1a0d] px-3 py-1.5 rounded-full font-semibold hover:bg-[#d4912a] transition-colors">
            + Post
          </a>
        </nav>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#c8d8c8]">Recent Harvests</h2>
          {harvests.length > 0 && (
            <span className="text-sm text-[#6a8a6a]">{harvests.length} posts</span>
          )}
        </div>

        {harvests.length === 0 ? (
          <EmptyFeed />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {harvests.map((harvest) => (
              <HarvestCard key={harvest.id} harvest={harvest} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="h-20 w-20 rounded-full bg-[#1a2a1a] border border-[#2D4A2D] flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-[#3a5a3a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-[#c8d8c8] mb-2">No posts yet</h3>
      <p className="text-[#6a8a6a] text-sm mb-8 max-w-xs">
        Be the first to share a harvest. Tag your catch, track your season, and connect with other hunters and anglers.
      </p>
      <a
        href="/post/new"
        className="bg-[#C17F24] text-[#0d1a0d] px-6 py-3 rounded-full font-semibold hover:bg-[#d4912a] transition-colors"
      >
        Share Your First Harvest
      </a>
    </div>
  )
}
