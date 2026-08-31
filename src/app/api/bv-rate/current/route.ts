import { NextResponse } from 'next/server';
import { getActiveBvRate } from '@/lib/package-config';
export const runtime = 'nodejs';
export async function GET() { try { const rate = await getActiveBvRate(); return NextResponse.json({ data: rate }, { headers: { 'Cache-Control': 'no-store' } }); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 503 }); } }
