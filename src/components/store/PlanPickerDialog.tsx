'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CreditCard, Lightbulb, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductImage } from '@/components/ProductImage';
import { bvLeft, isPlanFilled, suggestCompletion, BV_TOLERANCE } from '@/lib/bv-plan';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/money';
import { getPickerProducts, type PickerProduct } from '@/lib/picker-products';
import type { PackageView } from '@/lib/package-config';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

const PAGE = 8;

/** Pick products until the plan's BV is filled, then confirm to pay. The cart's plan drives the per-card hints and disabled buttons. */
export function PlanPickerDialog({ plan, open, onOpenChange, onConfirm, busy }: { plan: PackageView | null; open: boolean; onOpenChange: (open: boolean) => void; onConfirm: () => void; busy?: boolean }) {
  const { totalBv, setPlan, items, remove, setQty, add } = useCart();
  const [products, setProducts] = useState<PickerProduct[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [onlySuggested, setOnlySuggested] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (plan) setPlan({ id: plan.id, bv: plan.bv }); }, [plan, setPlan]);
  useEffect(() => {
    if (!open || products) return;
    setFailed(false);
    getPickerProducts().then(setProducts).catch(() => setFailed(true));
  }, [open, products]);

  const filled = plan ? isPlanFilled(plan, totalBv) : false;
  const left = plan ? bvLeft(plan, totalBv) : 0;
  const suggestion = useMemo(
    () => (plan && products && items.length > 0 && !filled ? suggestCompletion(products, items, plan) : null),
    [plan, products, items, filled],
  );
  const byId = useMemo(() => new Map((products || []).map((p) => [p.id, p])), [products]);
  const suggestedIds = useMemo(() => new Set((suggestion?.add || []).map((a) => a.id)), [suggestion]);
  const stuck = !!suggestion && suggestion.remove.length > 0;
  const nothingFits = !!products && left > BV_TOLERANCE && !products.some((p) => p.inStock && p.bv <= left);

  const list = useMemo(() => {
    const all = products || [];
    return onlySuggested && suggestedIds.size ? all.filter((p) => suggestedIds.has(p.id)) : all;
  }, [products, onlySuggested, suggestedIds]);

  // Reveal the grid progressively so opening the popup never has to paint every product image at once.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !open || visible >= list.length) return;
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) setVisible((v) => v + PAGE); }, { root: scrollRef.current, rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [open, visible, list.length]);
  useEffect(() => { if (!open) { setVisible(PAGE); setOnlySuggested(false); } }, [open]);

  if (!plan) return null;

  const applySuggestion = () => {
    if (!suggestion) return;
    for (const r of suggestion.remove) {
      const item = items.find((i) => i.id === r.id);
      if (!item) continue;
      if (r.qty >= item.qty) remove(item.id); else setQty(item.id, item.qty - r.qty);
    }
    for (const a of suggestion.add) {
      const p = byId.get(a.id);
      if (p) add({ id: p.id, slug: p.slug, name: p.name, price: p.price, bv: p.bv, image: p.image, maxQty: p.maxOrderQty ?? undefined }, a.qty);
    }
    setOnlySuggested(false);
  };

  const pct = Math.min(100, (totalBv / plan.bv) * 100);
  const nearly = !filled && left <= plan.bv * 0.1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-3 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{plan.name}: choose products worth {plan.bv} BV</DialogTitle>
          <DialogDescription>Plan price {formatPrice(plan.price)}. Products that would take you over {plan.bv} BV are disabled.</DialogDescription>
        </DialogHeader>

        <div className={`rounded-lg border p-3 transition-colors ${filled ? 'border-primary/50 bg-accent' : nearly ? 'border-amber-300 bg-amber-50' : 'bg-card'}`} aria-live="polite">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{filled ? 'Plan filled, ready to pay ✓' : `${left} BV left`}</span>
            <span className="tabular-nums">{totalBv} / {plan.bv} BV</span>
          </div>
          <Progress value={pct} className={`mt-2 h-2 ${nearly ? '[&>div]:bg-amber-500' : ''}`} />

          {items.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your selection</p>
              <ul className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 rounded-lg border bg-background py-1 pl-1 pr-1.5 shadow-sm">
                    <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded bg-white"><ProductImage src={i.image} alt="" sizes="36px" className="object-contain" /></span>
                    <span className="max-w-[9rem] sm:max-w-[13rem]">
                      <span className="block truncate text-xs font-medium">{i.name}</span>
                      <span className="block text-[11px] tabular-nums text-muted-foreground">{i.qty} × {i.bv} = {i.qty * i.bv} BV</span>
                    </span>
                    <span className="inline-flex items-center rounded-md border">
                      <button type="button" aria-label={`Decrease ${i.name}`} onClick={() => (i.qty > 1 ? setQty(i.id, i.qty - 1) : remove(i.id))} className="p-1 hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                      <span className="w-5 text-center text-xs tabular-nums">{i.qty}</span>
                      <button type="button" aria-label={`Increase ${i.name}`} disabled={!!plan && left < i.bv} onClick={() => setQty(i.id, i.qty + 1)} className="p-1 hover:bg-secondary disabled:opacity-30"><Plus className="h-3 w-3" /></button>
                    </span>
                    <button type="button" aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {suggestion && (stuck || nothingFits) && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm" role="status">
            <p className="flex items-center gap-2 font-semibold text-amber-900"><Lightbulb className="h-4 w-4" />Stuck at {left} BV left? Here&apos;s how to finish</p>
            <p className="mt-1 text-amber-900/90">
              {suggestion.remove.map((r) => `Remove ${r.qty} × ${items.find((i) => i.id === r.id)?.name ?? 'item'}`).join(' and ')}
              {suggestion.remove.length ? ', then add ' : 'Add '}
              {suggestion.add.map((a) => `${a.qty} × ${byId.get(a.id)?.name ?? 'product'} (${(byId.get(a.id)?.bv ?? 0) * a.qty} BV)`).join(' + ')}
              {` → total ${suggestion.finalBv} BV.`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={applySuggestion}>Apply this suggestion</Button>
              <Button size="sm" variant="outline" onClick={() => setOnlySuggested((v) => !v)}>{onlySuggested ? 'Show all products' : 'Show only that product'}</Button>
            </div>
          </div>
        )}
        {suggestion && !stuck && !nothingFits && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-accent p-3 text-sm">
            <span><b className="text-primary">Quick finish:</b> {suggestion.add.map((a) => `${a.qty} × ${byId.get(a.id)?.name ?? 'product'}`).join(' + ')} completes your plan.</span>
            <Button size="sm" onClick={applySuggestion}>Add them</Button>
          </div>
        )}

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
          {failed ? (
            <div className="grid place-items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              Could not load products.
              <Button size="sm" variant="outline" onClick={() => { setFailed(false); getPickerProducts().then(setProducts).catch(() => setFailed(true)); }}>Try again</Button>
            </div>
          ) : !products ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-busy>
              {Array.from({ length: PAGE }, (_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {list.slice(0, visible).map((p) => <ProductCard key={p.id} product={p} highlight={suggestedIds.has(p.id) && !!suggestion} />)}
              </div>
              {visible < list.length && <div ref={sentinelRef} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>}
            </>
          )}
        </div>

        <Button onClick={onConfirm} disabled={!filled || busy} className="h-12 gap-2 font-semibold">
          <CreditCard className="h-5 w-5" />{filled ? `Pay ${formatPrice(plan.price)} & join` : `Add ${left} more BV to continue`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
