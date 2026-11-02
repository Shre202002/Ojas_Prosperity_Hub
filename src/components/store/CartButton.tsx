'use client';

import Link from 'next/link';
import Image from '@/components/SiteImage';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/lib/cart';
import { formatPrice } from '@/lib/money';

export function CartButton() {
  const { items, count, subtotal, hydrated, setQty, remove } = useCart();
  const shown = hydrated ? count : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={shown ? `Cart, ${shown} item${shown === 1 ? '' : 's'}` : 'Cart, empty'}>
          <ShoppingBag className="w-5 h-5" />
          {shown > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold leading-none text-accent-foreground" aria-hidden>{shown}</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-headline text-2xl text-primary">Your cart</SheetTitle>
          <SheetDescription>{shown ? 'Review your items, then send your order enquiry.' : 'Nothing here yet.'}</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-muted-foreground">Your cart is empty. Add a product to get started.</p>
            <Button asChild><Link href="/shop">Browse products</Link></Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-t-full bg-secondary">
                    {item.image && <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.slug}`} className="block truncate font-medium hover:underline">{item.name}</Link>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(item.id, item.qty - 1)} disabled={item.qty <= 1} aria-label={`Decrease ${item.name}`}><Minus className="w-3 h-3" /></Button>
                      <span className="w-8 text-center text-sm tabular-nums">{item.qty}</span>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setQty(item.id, item.qty + 1)} aria-label={`Increase ${item.name}`}><Plus className="w-3 h-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatPrice(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <SheetFooter className="flex-col gap-3 sm:flex-col border-t pt-4">
              <p className="flex justify-between text-base font-semibold"><span>Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span></p>
              <p className="text-xs text-muted-foreground">Delivery and any taxes are confirmed by our team when they contact you.</p>
              <Button asChild className="h-12 font-semibold"><Link href="/cart">Review and place order</Link></Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
