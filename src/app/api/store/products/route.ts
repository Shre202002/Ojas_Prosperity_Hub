import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/catalog';

export const runtime = 'nodejs';

// Public catalog for the plan picker (same data the shop pages render).
export async function GET() {
  return NextResponse.json({ data: await getProducts() });
}
