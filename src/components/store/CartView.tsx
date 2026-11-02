'use client';

import Link from 'next/link';
import Image from '@/components/SiteImage';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BV_TOLERANCE, isPlanFilled, planMatch } from '@/lib/bv-plan';
import { usePlans } from '@/lib/use-plans';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/money';

export function CartView() {
  const router = useRouter();
  const { items, hydrated, subtotal, totalBv, setQty, remove, setPlan } = useCart();
  const { plans } = usePlans();
  const matched = planMatch(totalBv, plans);

  if (!hydrated) return <div className="py-24 text-center text-muted-foreground" aria-live="polite">Loading your cart…</div>;

  if (items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-headline text-4xl font-semibold text-primary">Your cart is empty.</p>
        <p className="mt-2 text-muted-foreground">Add a product and it will appear here.</p>
        <Button asChild className="mt-6 h-12 px-8"><Link href="/shop">Browse products</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-12 py-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <section aria-labelledby="items-heading">
        <h2 id="items-heading" className="font-headline text-3xl font-semibold text-primary">Your items</h2>
        <ul className="mt-4 divide-y border-y">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="relative h-28 w-[88px] shrink-0 overflow-hidden rounded-t-full bg-secondary">
                {item.image && <Image src={item.image} alt="" fill sizes="88px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${item.slug}`} className="font-headline text-2xl font-semibold text-primary hover:underline">{item.name}</Link>
                <p className="text-sm text-muted-foreground">{formatPrice(item.price)} each</p>
                <div className="mt-3 flex items-center gap-1">
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(item.id, item.qty - 1)} disabled={item.qty <= 1} aria-label={`Decrease ${item.name}`}><Minus className="w-3 h-3" /></Button>
                  <span className="w-10 text-center tabular-nums">{item.qty}</span>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(item.id, item.qty + 1)} disabled={!!item.maxQty && item.qty >= item.maxQty} aria-label={`Increase ${item.name}`}><Plus className="w-3 h-3" /></Button>
                  <Button type="button" variant="ghost" className="ml-3 h-9 gap-1 text-muted-foreground" onClick={() => remove(item.id)}><Trash2 className="w-4 h-4" />Remove</Button>
                </div>
              </div>
              <p className="font-semibold tabular-nums">{formatPrice(item.price * item.qty)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 flex justify-between text-xl font-semibold"><span>Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span></p>
        <p className="mt-1 text-sm text-muted-foreground">Your plan price is fixed and covers the products in your cart.</p>
      </section>

      <section aria-labelledby="plan-heading" className="lg:border-l lg:pl-12">
        <h2 id="plan-heading" className="font-headline text-3xl font-semibold text-primary">Checkout</h2>
        <p className="mt-1 text-muted-foreground">Fill one BV plan with your products to check out.</p>
        <p className="mt-4 flex justify-between text-lg font-semibold"><span>Cart BV</span><span className="tabular-nums">{totalBv}</span></p>
        <ul className="mt-3 space-y-2">
          {plans.map((p) => {
            const match = isPlanFilled(p, totalBv);
            return (
              <li key={p.id} className={`rounded-md border p-3 text-sm ${match ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex justify-between font-medium"><span>{p.name} · {p.bv} BV</span><span>{formatPrice(p.price)}</span></div>
                <Progress value={Math.min(100, (totalBv / p.bv) * 100)} className="mt-2 h-2" />
                <p className="mt-1 text-xs text-muted-foreground">{match ? 'Plan filled' : totalBv > p.bv ? `${totalBv - p.bv} BV over, remove items` : `Add ${p.bv - BV_TOLERANCE - totalBv > 0 ? `${p.bv - BV_TOLERANCE - totalBv}–${p.bv - totalBv}` : p.bv - totalBv} more BV`}</p>
              </li>
            );
          })}
        </ul>
        <Button disabled={!matched} onClick={() => { if (matched) { setPlan({ id: matched.id, bv: matched.bv }); router.push('/register'); } }} className="mt-5 h-12 w-full text-base font-semibold">
          {matched ? `Checkout · ${formatPrice(matched.price)}` : 'Fill a plan to check out'}
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">You pay the fixed plan price. By continuing you agree to our <Link href="/terms" className="underline underline-offset-4">terms</Link> and <Link href="/privacy" className="underline underline-offset-4">privacy policy</Link>.</p>
      </section>
    </div>
  );
}
