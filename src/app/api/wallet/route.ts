import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

function paging(request: NextRequest) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || 20)));
  return { page, limit, skip: (page - 1) * limit };
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireUser(request);
    const db = await getMongoDb();
    const { page, limit, skip } = paging(request);
    const [distributor, transactions, commissions, conversions, withdrawals, transactionCount, commissionCount] = await Promise.all([
      db.collection('distributors').findOne({ uid: session.uid }),
      db.collection('transactions').find({ distributorId: session.uid }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('commissions').find({ beneficiaryId: session.uid }).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('conversions').find({ userId: session.uid }).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection('withdrawals').find({ userId: session.uid }).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection('transactions').countDocuments({ distributorId: session.uid }),
      db.collection('commissions').countDocuments({ beneficiaryId: session.uid }),
    ]);
    if (!distributor) return NextResponse.json({ error: 'Distributor profile not found.' }, { status: 404 });

    const [paid, credited, pending, failed] = await Promise.all([
      db.collection('transactions').aggregate([{ $match: { distributorId: session.uid, status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).toArray(),
      db.collection('commissions').aggregate([{ $match: { beneficiaryId: session.uid, status: 'credited' } }, { $group: { _id: null, amount: { $sum: '$commissionAmount' } } }]).toArray(),
      db.collection('transactions').countDocuments({ distributorId: session.uid, status: { $in: ['created', 'pending'] } }),
      db.collection('transactions').countDocuments({ distributorId: session.uid, status: { $in: ['failed', 'refunded'] } }),
    ]);
    const purchasedBvBalance = Number(distributor.bvBalance || 0);
    const commissionBvBalance = Number(distributor.commissionBvBalance || 0);
    const convertedIncentiveBalance = Number(distributor.convertedIncentiveBalance || 0);
    return NextResponse.json({
      data: { purchasedBvBalance, commissionBvBalance, convertedIncentiveBalance, shoppingWallet: distributor.shoppingBalance || 0, withdrawableBalance: convertedIncentiveBalance, personalPaidPurchases: paid[0]?.amount || 0, personalCommissions: credited[0]?.amount || 0, balances: { purchasedBvBalance, commissionBvBalance, convertedIncentiveBalance, shoppingWallet: distributor.shoppingBalance || 0, withdrawableBalance: convertedIncentiveBalance }, totals: { personalPaidPurchases: paid[0]?.amount || 0, personalCommissions: credited[0]?.amount || 0, paidPurchases: paid[0]?.amount || 0, creditedIncome: credited[0]?.amount || 0, pendingCount: pending, failedCount: failed }, transactions, commissions, conversions, withdrawals },
      pagination: { page, limit, transactionCount, commissionCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not load wallet.' }, { status: error.message?.includes('Authentication') ? 401 : 403 });
  }
}
