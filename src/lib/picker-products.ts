import type { ShopProduct } from '@/lib/catalog';

/** The few product fields the plan picker needs (keeps the payload small and the popup fast). */
export type PickerProduct = Pick<ShopProduct, 'id' | 'slug' | 'name' | 'category' | 'packSize' | 'price' | 'mrp' | 'discountPct' | 'image' | 'bv' | 'inStock' | 'stock' | 'maxOrderQty' | 'isBestSeller'>;

let cache: Promise<PickerProduct[]> | null = null;

/** Fetches once and reuses the result, so the popup opens with data already in hand. */
export function getPickerProducts(): Promise<PickerProduct[]> {
  cache ??= fetch('/api/store/products?view=picker')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load products.'))))
    .then((j) => (j.data || []) as PickerProduct[])
    .catch((error) => { cache = null; throw error; });
  return cache;
}

export const prefetchPickerProducts = () => { void getPickerProducts().catch(() => undefined); };
