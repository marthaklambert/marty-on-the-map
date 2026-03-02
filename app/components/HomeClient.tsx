"use client";

import { useRef } from 'react';
import Link from 'next/link';
import WorldMap from "./WorldMap";
import CountUp from "./CountUp";
import type { PostLocation, TravelRoute } from '@/types/blog';

interface TravelStats {
  cities: number;
  countries: number;
  days: number;
}

interface HomeClientProps {
  locations: PostLocation[];
  routes: TravelRoute[];
  stats: TravelStats;
}

export default function HomeClient({ locations, routes, stats }: HomeClientProps) {
  const resetViewRef = useRef<(() => void) | null>(null);

  const handleResetView = () => {
    if (resetViewRef.current) {
      resetViewRef.current();
    }
  };

  return (
    <div className="relative">
      {/* Preload cursor images */}
      <link rel="preload" href="/cursors/custom-cursor-50.png" as="image" />
      <link rel="preload" href="/cursors/hand-pointer-50.png" as="image" />
      <nav className="absolute top-0 left-0 right-0 z-10 pointer-events-none"
        style={{ cursor: "url('/cursors/custom-cursor-50.png?t=1738430400') 12 5, auto" }}
      >
        <div className="px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-start sm:items-center">
          <div className="pointer-events-auto">
            <div className="flex items-baseline gap-5">
              <button
                onClick={handleResetView}
                className="text-xl sm:text-2xl font-display font-bold lowercase tracking-tight hover:opacity-60 transition-opacity"
              >
                marty on the map
              </button>
              <span className="hidden sm:inline text-xs font-mono text-black/60 tracking-wide">
                <CountUp target={stats.cities} duration={4000} /> cities / <CountUp target={stats.countries} duration={4000} /> countries / <CountUp target={stats.days} duration={4000} /> days
                <span className="inline-block w-[1ch] animate-blink">_</span>
              </span>
            </div>
            <span className="sm:hidden block text-[10px] font-mono text-black/60 tracking-wide mt-0.5">
              <CountUp target={stats.cities} duration={4000} /> cities / <CountUp target={stats.countries} duration={4000} /> countries / <CountUp target={stats.days} duration={4000} /> days
              <span className="inline-block w-[1ch] animate-blink">_</span>
            </span>
          </div>
          <Link
            href="/blog"
            className="bg-[#E0E0E0] border-t-2 border-l-2 border-white border-r-2 border-b-2 border-r-[#808080] border-b-[#808080] px-4 sm:px-6 py-2 sm:py-2.5 text-xs font-mono font-bold uppercase tracking-wide active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white shadow-md pointer-events-auto shrink-0"
          >
            Archive
          </Link>
        </div>
      </nav>
      <WorldMap
        locations={locations}
        routes={routes}
        onResetView={(resetFn) => { resetViewRef.current = resetFn; }}
      />
    </div>
  );
}
