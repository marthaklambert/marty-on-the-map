import Link from 'next/link';
import { getAllPosts, getTravelStats } from '@/lib/posts';
import PostCard from './components/PostCard';
import ArchiveStats from './components/ArchiveStats';

export default async function BlogPage() {
  const posts = await getAllPosts();
  const stats = await getTravelStats();

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <nav className="bg-[#FAF8F3]">
        <div className="px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
          <div>
            <div className="flex items-baseline gap-5">
              <h1 className="text-xl sm:text-2xl font-display font-bold lowercase tracking-tight">
                archive
              </h1>
              <span className="hidden sm:inline">
                <ArchiveStats cities={stats.cities} countries={stats.countries} days={stats.days} />
              </span>
            </div>
            <div className="sm:hidden text-[10px] font-mono text-black/60 tracking-wide mt-0.5 whitespace-nowrap">
              <ArchiveStats cities={stats.cities} countries={stats.countries} days={stats.days} />
            </div>
          </div>
          <Link
            href="/"
            className="bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wide active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white shadow-md shrink-0 ml-3"
          >
            <span className="sm:hidden">&lt;&lt;</span><span className="hidden sm:inline">&lt;&lt; Back to Map</span>
          </Link>
        </div>
      </nav>
      <div className="h-[3px] bg-[#FCC0DB]" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-700 font-mono text-sm">No posts yet. Start your travel journey!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
