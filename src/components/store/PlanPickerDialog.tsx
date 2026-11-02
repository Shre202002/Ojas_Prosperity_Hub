'use client';

import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { bvLeft, isPlanFilled } from '@/lib/bv-plan';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/money';
import type { PackageView } from '@/lib/package-config';
import type { ShopProduct } from '@/lib/catalog';
import { ProductGrid } from './ProductCard';

/** Pick products until the plan's BV is filled, then confirm to pay. The cart's plan drives the per-card hints and disabled buttons. */
export function PlanPickerDialog({ plan, open, onOpenChange, onConfirm, busy }: { plan: PackageView | null; open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; busy?: boolean }) {
  const { totalBv, setPlan, items, remove } = useCart();
  const [products, setProducts] = useState<ShopProduct[]>([]);

  useEffect(() => { if (plan) setPlan({ id: plan.id, bv: plan.bv }); }, [plan, setPlan]);
  useEffect(() => {
    if (!open || products.length) return;
    fetch('/api/store/products').then((r) => r.json()).then((j) => setProducts(j.data || [])).catch(() => {});
  }, [open, products.length]);

  if (!plan) return null;
  const filled = isPlanFilled(plan, totalBv);
  const left = bvLeft(plan, totalBv);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-3 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{plan.name}: choose products worth {plan.bv} BV</DialogTitle>
          <DialogDescription>Plan price {formatPrice(plan.price)}. Products that would take you over {plan.bv} BV are disabled.</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-card p-3" aria-live="polite">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{filled ? 'Plan filled, ready to pay' : `${left} BV left`}</span>
            <span className="tabular-nums">{totalBv} / {plan.bv} BV</span>
          </div>
          <Progress value={Math.min(100, (totalBv / plan.bv) * 100)} className="mt-2 h-2" />
          {items.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {items.map((i) => (
                <button key={i.id} type="button" onClick={() => remove(i.id)} className="mr-2 underline-offset-2 hover:underline" title="Remove">{i.qty} x {i.name} ({i.qty * i.bv} BV) ✕</button>
              ))}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <ProductGrid products={products.filter((p) => p.bv > 0)} />
        </div>

        <Button onClick={onConfirm} disabled={!filled || busy} className="h-12 gap-2 font-semibold">
          <CreditCard className="h-5 w-5" />{filled ? `Pay ${formatPrice(plan.price)} & join` : `Add ${left} more BV to continue`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
