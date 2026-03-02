"use client";

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { PostLocation } from '@/types/blog';

interface MarkerPopupProps {
  location: PostLocation | null;
  onClose: () => void;
}

export default function MarkerPopup({ location, onClose }: MarkerPopupProps) {
  if (!location) return null;

  return (
    <div
      className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#FCC0DB]/50 rounded-lg shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-48 bg-gray-100">
          <img
            src={location.coverImage}
            alt={location.city}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>
        <div className="p-6">
          <div className="text-sm text-[#FCC0DB] font-medium mb-2 uppercase tracking-wider">
            {location.city}, {location.country}
          </div>
          <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
            {formatDate(location.date)}
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">{location.title}</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{location.excerpt}</p>
          <div className="flex gap-3">
            <Link
              href={`/blog/${location.slug}`}
              className="bg-[#FCC0DB] hover:bg-[#FFD9EB] text-white px-6 py-3 rounded transition-all duration-300 flex-1 text-center font-medium tracking-wide"
            >
              Read
            </Link>
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-6 py-3 rounded transition-all duration-300 font-medium"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
