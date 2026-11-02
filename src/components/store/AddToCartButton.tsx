'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MAX_QTY, useCart } from '@/lib/cart';
import { canAddBv } from '@/lib/bv-plan';
import type { ShopProduct } from '@/lib/catalog';

type Props = { product: Pick<ShopProduct, 'id' | 'slug' | 'name' | 'price' | 'bv' | 'image' | 'inStock' | 'maxOrderQty'>; variant?: 'card' | 'detail' | 'buybox' };

export function AddToCartButton({ product, variant = 'card' }: Props) {
  const { add, plan, totalBv } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return <Button disabled variant="outline" className={variant === 'card' ? 'w-full' : 'h-12 w-full sm:w-auto'}>Out of stock</Button>;
  }

  // With a plan selected, block any add that would push the cart past the plan's BV.
  const overPlan = !!plan && !canAddBv(plan, totalBv, product.bv * (variant === 'card' ? 1 : qty));

  const handleAdd = () => {
    if (overPlan) return;
    add({ id: product.id, slug: product.slug, name: product.name, price: product.price, bv: product.bv, image: product.image, maxQty: product.maxOrderQty ?? undefined }, variant === 'card' ? 1 : qty);
    setAdded(true);
    toast({ title: 'Added to cart', description: `${variant === 'card' ? '' : `${qty} x `}${product.name}` });
    window.setTimeout(() => setAdded(false), 2200);
  };

  if (variant === 'card') {
    return (
      <Button onClick={handleAdd} disabled={overPlan} variant={added ? 'secondary' : 'default'} className="h-10 w-full gap-2 rounded-md font-semibold" aria-label={`Add ${product.name} to cart`}>
        {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
        {added ? 'Added' : overPlan ? 'Exceeds plan BV' : 'Add to cart'}
      </Button>
    );
  }

  if (variant === 'buybox') {
    const max = product.maxOrderQty ? Math.min(product.maxOrderQty, MAX_QTY) : MAX_QTY;
    return (
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 text-sm">
          <span className="font-medium">Quantity</span>
          <select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-10 rounded-md border bg-secondary px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <Button onClick={handleAdd} disabled={overPlan} className="h-11 w-full gap-2 rounded-full font-semibold">
          {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          {added ? 'Added to cart' : 'Add to cart'}
        </Button>
        <Button asChild variant="outline" className="h-11 w-full rounded-full bg-transparent font-semibold"><Link href="/cart" onClick={() => add({ id: product.id, slug: product.slug, name: product.name, price: product.price, bv: product.bv, image: product.image, maxQty: product.maxOrderQty ?? undefined }, qty)}>Order now</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="inline-flex items-center rounded-md border bg-card self-start" role="group" aria-label="Quantity">
        <Button type="button" variant="ghost" size="icon" className="h-12 w-12" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="w-4 h-4" /></Button>
        <span className="w-10 text-center font-medium tabular-nums" aria-live="polite">{qty}</span>
        <Button type="button" variant="ghost" size="icon" className="h-12 w-12" onClick={() => setQty((q) => Math.min(product.maxOrderQty ? Math.min(product.maxOrderQty, MAX_QTY) : MAX_QTY, q + 1))} aria-label="Increase quantity"><Plus className="w-4 h-4" /></Button>
      </div>
      <Button onClick={handleAdd} disabled={overPlan} className="h-12 px-8 gap-2 font-semibold">
        {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
        {added ? 'Added to cart' : 'Add to cart'}
      </Button>
      {added && <Button asChild variant="outline" className="h-12"><Link href="/cart">View cart</Link></Button>}
    </div>
  );
}
