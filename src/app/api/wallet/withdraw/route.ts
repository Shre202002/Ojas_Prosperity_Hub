import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { collection } from '@/lib/mongodb';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) { try { const session = await requireUser(request); const data = await (await collection<any>('withdrawals')).find({ userId: session.uid }).sort({ createdAt: -1 }).limit(50).toArray(); return NextResponse.json({ data }); } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }); } }
export async function POST(request: NextRequest) {
  try {
    const session = await requireUser(request); const body = await request.json(); const amount = Number(body.amount); if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid withdrawal amount.');
    const distributors = await collection<any>('distributors'); const distributor = await distributors.findOne({ uid: session.uid }); if (!distributor) throw new Error('Distributor profile not found.');
    if (distributor.rank !== 'Admin' && distributor.kycStatus !== 'verified') throw new Error('Verified KYC is required before withdrawal.');
    const settings = await (await collection<any>('settings')).findOne({ _id: 'platform' }); const cap = Number(settings?.withdrawalLimit12h || 10000); const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const recent = await (await collection<any>('withdrawals')).aggregate([{ $match: { userId: session.uid, createdAt: { $gte: since }, status: { $in: ['pending', 'approved', 'paid'] } } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).toArray();
    if (recent[0]?.amount + amount > cap) throw new Error(`The 12-hour withdrawal limit is ₹${cap.toLocaleString('en-IN')}.`);
    const balance = Number(distributor.convertedIncentiveBalance || 0); if (balance < amount) throw new Error('Insufficient withdrawable INR balance. Convert earned commission BV first.');
    const result = await distributors.updateOne({ uid: session.uid, convertedIncentiveBalance: { $gte: amount } }, { $inc: { convertedIncentiveBalance: -amount }, $set: { updatedAt: new Date() } }); if (!result.modifiedCount) throw new Error('Wallet balance changed. Please retry.');
    const withdrawal = { userId: session.uid, amount, accountDetails: body.accountDetails || {}, status: 'pending', createdAt: new Date() }; const inserted = await (await collection<any>('withdrawals')).insertOne(withdrawal); return NextResponse.json({ data: { ...withdrawal, _id: inserted.insertedId } }, { status: 201 });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Withdrawal failed.' }, { status: error.message?.includes('Authentication') ? 401 : 400 }); }
}
