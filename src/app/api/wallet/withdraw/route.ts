import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireUser } from '@/lib/server-auth';
import { collection, getMongoClient, getMongoDb } from '@/lib/mongodb';
import { getWithdrawalSettings, getWindowUsage, round2, UPI_PATTERN } from '@/lib/withdrawal-limits';
import { payoutsConfigured } from '@/lib/razorpayx';
import { startPayout } from '@/lib/withdrawal-state';
import { recordWalletTransaction, withdrawalEntry } from '@/lib/wallet-transactions';

export const runtime = 'nodejs';

class WithdrawalError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) { super(message); }
}
const inr = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export async function GET(request: NextRequest) {
  try {
    const session = await requireUser(request);
    const { cap, min } = await getWithdrawalSettings();
    const [data, usage] = await Promise.all([
      (await collection<any>('withdrawals')).find({ userId: session.uid }).sort({ createdAt: -1 }).limit(50).toArray(),
      getWindowUsage(session.uid, cap),
    ]);
    return NextResponse.json({ data, limits: { ...usage, min, autoPayout: payoutsConfigured() } });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 401 }); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser(request);
    const body = await request.json();
    const raw = Number(body.amount);
    const amount = round2(raw);
    if (!Number.isFinite(raw) || raw <= 0 || Math.abs(raw * 100 - Math.round(raw * 100)) > 1e-6) throw new WithdrawalError('Enter a valid amount with at most 2 decimals.');
    const upi = String(body.accountDetails?.upi || '').trim().toLowerCase();
    if (!UPI_PATTERN.test(upi)) throw new WithdrawalError('Enter a valid UPI ID, for example name@bank.');

    const { cap, min } = await getWithdrawalSettings();
    if (amount < min) throw new WithdrawalError(`The minimum withdrawal is ${inr(min)}.`);

    const distributor = await (await collection<any>('distributors')).findOne({ uid: session.uid });
    if (!distributor) throw new WithdrawalError('Distributor profile not found.');
    if (distributor.rank !== 'Admin' && distributor.kycStatus !== 'verified') throw new WithdrawalError('Verified KYC is required before withdrawal.');

    const auto = payoutsConfigured();
    const withdrawal = { _id: new ObjectId(), userId: session.uid, amount, accountDetails: { upi }, status: auto ? 'processing' : 'pending', createdAt: new Date() };

    const db = await getMongoDb();
    const mongoSession = (await getMongoClient()).startSession();
    try {
      await mongoSession.withTransaction(async () => {
        // Debit first: it write-locks this member's document, so two simultaneous requests are serialised
        // and the second one sees the first one's withdrawal when it sums the window below.
        const debited = await db.collection<any>('distributors').updateOne(
          { uid: session.uid, convertedIncentiveBalance: { $gte: amount } },
          { $inc: { convertedIncentiveBalance: -amount }, $set: { updatedAt: new Date() } }, { session: mongoSession });
        if (!debited.modifiedCount) throw new WithdrawalError('Insufficient withdrawable INR balance. Convert earned commission BV first.');

        const usage = await getWindowUsage(session.uid, cap, mongoSession);
        if (usage.used + amount > cap) {
          throw new WithdrawalError(
            usage.remaining > 0
              ? `The ${inr(cap)} per 12 hours limit allows ${inr(usage.remaining)} more right now.`
              : `You have reached the ${inr(cap)} per 12 hours limit.`,
            { remaining: usage.remaining, nextAvailableAt: usage.nextAvailableAt });
        }
        await db.collection<any>('withdrawals').insertOne(withdrawal, { session: mongoSession });
        await recordWalletTransaction(withdrawalEntry({ userId: session.uid, withdrawalId: String(withdrawal._id), amount, upi, status: 'pending', at: withdrawal.createdAt }), mongoSession);
      });
    } finally { await mongoSession.endSession(); }

    if (auto) { const payout = await startPayout(String(withdrawal._id)); if (payout.refunded) throw new WithdrawalError(`The payout was rejected: ${payout.reason} Your balance was refunded.`); }
    const saved = await (await collection<any>('withdrawals')).findOne({ _id: withdrawal._id });
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes('Authentication') ? 401 : 400;
    return NextResponse.json({ error: error.message || 'Withdrawal failed.', ...(error.details || {}) }, { status });
  }
}
