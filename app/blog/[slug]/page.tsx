import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug } from '@/lib/posts';
import { formatDate } from '@/lib/utils';
import PhotoGallery from '@/app/components/PhotoGallery';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: `${post.title} - ${post.city}`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <nav className="bg-[#FAF8F3]">
        <div className="px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
          <Link href="/" className="text-xl sm:text-2xl font-display font-bold lowercase tracking-tight hover:opacity-60 transition-opacity">
            marty on the map
          </Link>
          <Link
            href="/blog"
            className="bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-4 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wide active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white shadow-md shrink-0 ml-3"
          >
            <span className="sm:hidden">&lt;&lt;</span><span className="hidden sm:inline">&lt;&lt; Back to Archive</span>
          </Link>
        </div>
      </nav>
      <div className="h-[3px] bg-[#FCC0DB]" />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Cover image card */}
        <div className="bg-[#ECECEC] border border-[#D0D0D0] p-2.5">
          <div className="border-t-[3px] border-l-[3px] border-[#808080] border-r-[3px] border-b-[3px] border-r-white border-b-white">
            <div className="relative w-full bg-gray-200" style={{aspectRatio: post.tallCoverImage ?.startsWith('tall|') ? '4/5' : '3/2', maxHeight: post.tallCoverImage?.startsWith('tall|') ? '600px' : '480px'}}>
              <Image
                src={post.coverImage}
                alt={post.city}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-black/70 pt-2 px-0.5">
            📍 {post.city}, {post.country}
          </p>
        </div>

        {/* Post header */}
        <div className="mt-6 mb-8">
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] mb-2 text-black/50">
            {formatDate(post.date)}
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-black leading-tight">
            {post.title}
          </h1>
        </div>

        {/* Post content */}
        <div
          className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-black prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-[#E03030] prose-a:no-underline hover:prose-a:underline prose-strong:text-black prose-blockquote:border-l-[#FCC0DB] prose-blockquote:border-l-[3px] prose-blockquote:bg-[#ECECEC] prose-blockquote:py-1 prose-blockquote:px-4 prose-figure:my-8 prose-img:m-0 prose-img:rounded-none prose-ul:marker:text-[#FCC0DB]"
          style={{ fontFamily: 'Tahoma, Verdana, -apple-system, sans-serif' }}
          dangerouslySetInnerHTML={{ __html: post.htmlContent }}
        />

        {post.images && post.images.length > 0 && (
          <div className="mt-10 pt-8 border-t-[3px] border-[#ECECEC]">
            <h2 className="text-xl font-display font-bold text-black mb-4">Photo Gallery</h2>
            <PhotoGallery images={post.images} alt={post.city} />
          </div>
        )}
      </article>
    </div>
  );
}
