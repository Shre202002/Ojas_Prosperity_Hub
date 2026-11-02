'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Solid header in normal page flow: it takes its own space above the content and never overlaps it. */
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
      setHidden(false);
      last.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      ref={ref}
      data-hidden={hidden}
      className="relative z-40 border-b border-border bg-background shadow-sm"
    >
      {children}
    </header>
  );
}
