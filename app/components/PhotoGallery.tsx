"use client";

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface GalleryImage {
  src: string;
  caption?: string;
}

interface PhotoGalleryProps {
  images: (string | { src: string; caption?: string })[];
  alt: string;
}

function normalizeImages(images: (string | { src: string; caption?: string })[]): GalleryImage[] {
  return images.map((img) =>
    typeof img === 'string' ? { src: img } : img
  );
}

export default function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const normalized = normalizeImages(images);
  const perPage = 3;
  const totalPages = Math.ceil(normalized.length / perPage);
  const visible = normalized.slice(page * perPage, page * perPage + perPage);

  const goNext = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex + 1) % normalized.length);
  }, [selectedIndex, normalized.length]);

  const goPrev = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((selectedIndex - 1 + normalized.length) % normalized.length);
  }, [selectedIndex, normalized.length]);

  const close = useCallback(() => setSelectedIndex(null), []);

  useEffect(() => {
    if (selectedIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedIndex, close, goNext, goPrev]);

  if (!images || images.length === 0) return null;

  const selected = selectedIndex !== null ? normalized[selectedIndex] : null;

  return (
    <>
      {/* Gallery card */}
      <div className="bg-[#ECECEC] border border-[#D0D0D0] p-2 sm:p-3">
        {/* Thumbnails */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {visible.map((img, i) => {
            const globalIndex = page * perPage + i;
            return (
              <div key={globalIndex}>
                <div
                  className="border-t-[3px] border-l-[3px] border-[#808080] border-r-[3px] border-b-[3px] border-r-white border-b-white cursor-pointer-custom"
                  onClick={() => setSelectedIndex(globalIndex)}
                >
                  <div className="relative aspect-square bg-gray-200">
                    <Image
                      src={img.src}
                      alt={img.caption || `${alt} - Photo ${globalIndex + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                {img.caption && (
                  <p className="text-[10px] font-mono text-black/50 uppercase tracking-wide mt-1.5 px-0.5">
                    {img.caption}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-[#D0D0D0]">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-3 py-1 text-xs font-mono font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white disabled:opacity-30"
            >
              &lt;
            </button>
            <span className="text-[9px] font-mono text-black/40 uppercase tracking-wide">
              {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-3 py-1 text-xs font-mono font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white disabled:opacity-30"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="bg-[#ECECEC] border-t-[3px] border-l-[3px] border-white border-r-[3px] border-b-[3px] border-r-[#808080] border-b-[#808080] max-w-4xl w-full p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image in inset frame */}
            <div className="border-t-[3px] border-l-[3px] border-[#808080] border-r-[3px] border-b-[3px] border-r-white border-b-white">
              <div className="relative w-full bg-[#ECECEC]" style={{ aspectRatio: '4/3' }}>
                <Image
                  src={selected.src}
                  alt={selected.caption || alt}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Caption and nav */}
            <div className="px-1 pt-2 sm:pt-3 pb-1 flex items-center justify-between">
              <div>
                <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-black/50">
                  📍 {selected.caption || `${alt} - Photo ${selectedIndex! + 1}`}
                </div>
                <div className="text-[9px] font-mono text-black/30 uppercase tracking-wide mt-0.5">
                  {selectedIndex! + 1} of {normalized.length}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={goPrev}
                  className="bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-3 sm:px-4 py-1.5 text-xs font-mono font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                >
                  &lt;&lt;
                </button>
                <button
                  onClick={goNext}
                  className="bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-3 sm:px-4 py-1.5 text-xs font-mono font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                >
                  &gt;&gt;
                </button>
                <button
                  onClick={close}
                  className="hidden sm:block bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-4 py-1.5 text-xs font-mono font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
