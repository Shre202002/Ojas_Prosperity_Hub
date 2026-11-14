import Link from 'next/link';
import { ProductImage } from '@/components/ProductImage';
import { formatPrice } from '@/lib/money';
import type { ShopProduct } from '@/lib/catalog';
import type { PickerProduct } from '@/lib/picker-products';
import { Skeleton } from '@/components/ui/skeleton';
import { AddToCartButton } from './AddToCartButton';
import { BvBadge } from './BvBadge';
import { BvLeftHint } from './BvLeftHint';

// Marketplace-style card: photo on white, two-line name, price row with MRP and percent off, BV under the price, one-tap add to cart.
export function ProductCard({ product, priority = false, highlight = false }: { product: ShopProduct | PickerProduct; priority?: boolean; highlight?: boolean }) {
  const lowStock = product.stock !== null && product.stock > 0 && product.stock <= 5;
  return (
    <article className={`group relative flex h-full flex-col rounded-lg border bg-card p-3 transition-shadow duration-200 hover:shadow-lg sm:p-4 ${highlight ? 'ring-2 ring-primary shadow-lg' : ''}`}>
      {highlight && <span className="absolute -top-2 left-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">Completes your plan</span>}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden rounded-md bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`${product.name}, ${formatPrice(product.price)}`}
      >
        <ProductImage src={product.image} alt={product.name} priority={priority} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw" className="object-contain p-2 transition-transform duration-300 ease-out group-hover:scale-105" />
        {product.isBestSeller && <span className="absolute left-0 top-2 rounded-r bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Bestseller</span>}
        {!product.inStock && <span className="absolute inset-0 grid place-items-center bg-white/75 text-sm font-semibold text-foreground">Out of stock</span>}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <p className="truncate text-xs text-muted-foreground">{product.category}{product.packSize ? ` · ${product.packSize}` : ''}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-foreground sm:text-[15px]">
          <Link href={`/products/${product.slug}`} className="hover:text-primary hover:underline underline-offset-2">{product.name}</Link>
        </h3>

        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-semibold sm:text-xl">{formatPrice(product.price)}</span>
          {product.mrp && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.mrp)}</span>}
          {product.discountPct > 0 && <span className="text-sm font-semibold text-primary">{product.discountPct}% off</span>}
        </p>
        <BvBadge bv={product.bv} className="mt-1.5 self-start" />
        <BvLeftHint bv={product.bv} />
        {lowStock && <p className="mt-1.5 text-xs font-medium text-destructive">Only {product.stock} left</p>}

        <div className="mt-auto pt-3">
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ShopProduct[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < priorityCount} />)}
    </div>
  );
}

/** Placeholder shown while the catalogue loads (same footprint as a ProductCard so the layout doesn't jump). */
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-3 sm:p-4" aria-hidden>
      <Skeleton className="aspect-square w-full rounded-md" />
      <Skeleton className="mt-3 h-3 w-1/2" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-1 h-4 w-2/3" />
      <Skeleton className="mt-3 h-6 w-1/3" />
      <Skeleton className="mt-2 h-6 w-1/2" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}
