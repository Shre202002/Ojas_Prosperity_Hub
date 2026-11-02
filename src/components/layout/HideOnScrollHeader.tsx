'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Sticky translucent header: slides away while scrolling down, returns on any scroll up. */
export function HideOnScrollHeader({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last.current;
      // Ignore tiny jitters and iOS rubber-banding; always show near the top or while focus is inside (keyboard users).
      if (Math.abs(delta) < 8) return;
      setHidden(delta > 0 && y > 80 && !ref.current?.contains(document.activeElement));
      last.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      ref={ref}
      data-hidden={hidden}
      className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/50 transition-transform duration-300 ease-out data-[hidden=true]:-translate-y-full motion-reduce:transition-none"
    >
      {children}
    </header>
  );
}
