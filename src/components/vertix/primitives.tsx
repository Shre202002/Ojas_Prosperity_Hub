'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Staggered fade-up used by every page: the parent staggers, children rise and un-blur. */
export const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
export const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
};

export function GlassCard({ children, className, hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div data-vx-motion variants={item} whileHover={hover ? { y: -4 } : undefined} className={cn('vx-card p-5 sm:p-6', className)}>
      {children}
    </motion.div>
  );
}

/** Counts from the previous value (or `from`) to `value` with an ease-out curve. */
export function CountUp({ value, from = 0, duration = 1400, prefix = '', decimals = 0 }: { value: number; from?: number; duration?: number; prefix?: string; decimals?: number }) {
  const [n, setN] = useState(from);
  const last = useRef(from);
  useEffect(() => {
    const start = last.current, t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration), e = 1 - Math.pow(1 - p, 3);
      const v = start + (value - start) * e;
      setN(v); last.current = v;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{prefix}{n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

export function ProgressBar({ pct, className, fill = 'var(--vx-accent)', onOrange = false }: { pct: number; className?: string; fill?: string; onOrange?: boolean }) {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full', onOrange ? 'bg-white/25' : '')} style={onOrange ? undefined : { background: 'var(--vx-soft)' }}>
      <motion.div data-vx-motion className={cn('absolute inset-y-0 left-0 rounded-full', className)} style={{ background: onOrange ? '#fff' : fill }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.3, ease: [0.2, 0.8, 0.2, 1], delay: 0.3 }} />
    </div>
  );
}

export function Delta({ text, down, onDark }: { text: string; down?: boolean; onDark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold', onDark ? 'bg-white/20 text-white' : down ? 'bg-red-500/10 text-[var(--vx-bad)]' : 'bg-green-500/10 text-[var(--vx-good)]')}>{text}</span>
  );
}

/** Shimmer skeleton shown on first paint, then swapped for the real page. */
export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="vx-skel h-10 w-72" />
      <div className="vx-skel h-4 w-96 max-w-full" />
      <div className="grid gap-5 lg:grid-cols-3"><div className="vx-skel h-72" /><div className="vx-skel h-72" /><div className="vx-skel h-72" /></div>
      <div className="vx-skel h-56" />
    </div>
  );
}

export function PageHead({ title, sub }: { title: string; sub: string }) {
  return (
    <motion.div variants={item} className="mb-6">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm" style={{ color: 'var(--vx-mute)' }}>{sub}</p>
    </motion.div>
  );
}
