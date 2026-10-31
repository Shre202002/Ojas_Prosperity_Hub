import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireUser } from '@/lib/server-auth';
import { collection, getMongoClient, getMongoDb } from '@/lib/mongodb';
import { recordWalletTransaction, conversionEntries } from '@/lib/wallet-transactions';

export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request); const amount = Number((await request.json()).bvAmount);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid BV amount.');
    const settings = await (await collection<any>('settings')).findOne({ _id: 'platform' }); const rate = Number(settings?.bvRate || 1);
    const db = await getMongoDb(); const conversionId = new ObjectId(); const now = new Date();
    const session = (await getMongoClient()).startSession();
    try {
      // Balance change, conversion record and ledger rows commit together or not at all.
      await session.withTransaction(async () => {
        const result = await db.collection<any>('distributors').updateOne({ uid: user.uid, commissionBvBalance: { $gte: amount } }, { $inc: { commissionBvBalance: -amount, convertedIncentiveBalance: amount * rate }, $set: { updatedAt: now } }, { session });
        if (!result.modifiedCount) throw new Error('Insufficient earned commission BV. Purchased / Product BV is not withdrawable.');
        await db.collection<any>('conversions').insertOne({ _id: conversionId, userId: user.uid, source: 'sponsor_commission', bvAmount: amount, rate, rupeeAmount: amount * rate, createdAt: now }, { session });
        for (const entry of conversionEntries({ userId: user.uid, conversionId: conversionId.toHexString(), bv: amount, rate, rupees: amount * rate, at: now })) await recordWalletTransaction(entry, session);
      });
    } finally { await session.endSession(); }
    return NextResponse.json({ success: true, bvAmount: amount, rate, rupeeAmount: amount * rate });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Conversion failed.' }, { status: error.message?.includes('Authentication') ? 401 : 400 }); }
}
