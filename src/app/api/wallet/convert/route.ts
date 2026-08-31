import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { collection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const session = await requireUser(request); const amount = Number((await request.json()).bvAmount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid BV amount.');
    const distributors = await collection<any>('distributors'); const settings = await (await collection<any>('settings')).findOne({ _id: 'platform' }); const rate = Number(settings?.bvRate || 1);
    const result = await distributors.updateOne({ uid: session.uid, commissionBvBalance: { $gte: amount } }, { $inc: { commissionBvBalance: -amount, convertedIncentiveBalance: amount * rate }, $set: { updatedAt: new Date() } });
    if (!result.modifiedCount) throw new Error('Insufficient earned commission BV. Purchased / Product BV is not withdrawable.');
    await (await collection<any>('conversions')).insertOne({ userId: session.uid, source: 'sponsor_commission', bvAmount: amount, rate, rupeeAmount: amount * rate, createdAt: new Date() });
    return NextResponse.json({ success: true, bvAmount: amount, rate, rupeeAmount: amount * rate });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Conversion failed.' }, { status: error.message?.includes('Authentication') ? 401 : 400 }); }
}
