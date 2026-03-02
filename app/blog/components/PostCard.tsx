import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import type { BlogPost } from '@/types/blog';

interface PostCardProps {
  post: BlogPost;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <div className="bg-[#ECECEC] border-t-[3px] border-l-[3px] border-white border-r-[3px] border-b-[3px] border-r-[#808080] border-b-[#808080] p-2 active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white h-full">
        {/* Image in recessed frame */}
        <div className="border-t-[3px] border-l-[3px] border-[#808080] border-r-[3px] border-b-[3px] border-r-white border-b-white">
          <div className="relative h-48 bg-gray-200">
            <Image
              src={post.coverImage}
              alt={post.city}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Details */}
        <div className="px-2gre pt-3 pb-2">
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] mb-1">
            📍 <span className="text-black/50">{post.city}, {post.country}</span>
          </div>
          <h2 className="text-base font-display font-bold text-black leading-tight mb-1">
            {post.title}
          </h2>
          <div className="text-[9px] text-gray-500 font-mono font-bold uppercase tracking-[0.15em] mb-2">
            {formatDate(post.date)}
          </div>
          <p className="text-xs text-gray-700 leading-relaxed" style={{ fontFamily: 'Tahoma, Verdana, -apple-system, sans-serif' }}>
            {post.excerpt}
          </p>
        </div>

      </div>
    </Link>
  );
}
