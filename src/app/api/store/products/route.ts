import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/catalog';

export const runtime = 'nodejs';

// Public catalog. `?view=picker` returns only what the plan picker needs and is cacheable at the edge.
export async function GET(request: NextRequest) {
  const products = await getProducts();
  if (new URL(request.url).searchParams.get('view') === 'picker') {
    const data = products.filter((p) => p.bv > 0).map((p) => ({
      id: p.id, slug: p.slug, name: p.name, category: p.category, packSize: p.packSize, price: p.price, mrp: p.mrp,
      discountPct: p.discountPct, image: p.image, bv: p.bv, inStock: p.inStock, stock: p.stock, maxOrderQty: p.maxOrderQty, isBestSeller: p.isBestSeller,
    }));
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  }
  return NextResponse.json({ data: products });
}
