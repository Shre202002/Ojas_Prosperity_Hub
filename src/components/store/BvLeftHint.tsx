'use client';

import { useCart } from '@/lib/cart';
import { bvLeft, canAddBv } from '@/lib/bv-plan';

// Shows how many BV would remain if this product were added to the selected plan.
export function BvLeftHint({ bv }: { bv: number }) {
  const { plan, totalBv } = useCart();
  if (!plan || bv <= 0) return null;
  const fits = canAddBv(plan, totalBv, bv);
  return (
    <p className={`mt-1 text-xs font-medium ${fits ? 'text-primary' : 'text-destructive'}`}>
      {fits ? `Adds ${bv} BV → ${bvLeft(plan, totalBv + bv)} BV left` : `Too high: only ${bvLeft(plan, totalBv)} BV left`}
    </p>
  );
}
