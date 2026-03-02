"use client";

import { useRef, useEffect } from 'react';

export default function CountUp({ target, duration }: { target: number; duration: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || target === 0) return;
    const start = performance.now();
    let frame: number;
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(progress * target);
      el.textContent = String(current).padStart(2, '0');
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return <span ref={ref}>00</span>;
}
