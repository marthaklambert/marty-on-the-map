"use client";

import CountUp from "@/app/components/CountUp";

interface ArchiveStatsProps {
  cities: number;
  countries: number;
  days: number;
}

export default function ArchiveStats({ cities, countries, days }: ArchiveStatsProps) {
  return (
    <span className="text-xs font-mono text-black/60 tracking-wide">
      <CountUp target={cities} duration={4000} /> cities / <CountUp target={countries} duration={4000} /> countries / <CountUp target={days} duration={4000} /> days
      <span className="inline-block w-[1ch] animate-blink">_</span>
    </span>
  );
}
