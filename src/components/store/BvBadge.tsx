import { cn } from '@/lib/utils';

/** Business volume earned per unit. Sits directly under the price; renders nothing when a product has no BV. */
export function BvBadge({ bv, size = 'sm', className }: { bv: number; size?: 'sm' | 'lg'; className?: string }) {
  if (!bv || bv <= 0) return null;
  return (
    <p
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-accent font-semibold text-primary',
        size === 'lg' ? 'px-3 py-1.5 text-base' : 'px-2 py-0.5 text-sm',
        className,
      )}
    >
      <span className="tabular-nums">{`${bv.toLocaleString('en-IN')} BV`}</span>
      <span className="font-normal text-foreground/70">per unit</span>
    </p>
  );
}
