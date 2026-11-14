import { NextResponse } from 'next/server';
import { collection } from '@/lib/mongodb';
import { getMatchingRate } from '@/lib/matching';
export const runtime = 'nodejs';
export async function GET() { const settings = await (await collection<any>('settings')).findOne({ _id: 'platform' }); return NextResponse.json({ data: { bvRate: Number(settings?.bvRate || 1), withdrawalLimit12h: Number(settings?.withdrawalLimit12h ?? 2500), matchingRate: await getMatchingRate() } }); }
