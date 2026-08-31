import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

function paging(request: NextRequest) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || 25)));
  return { page, limit, skip: (page - 1) * limit };
}

export async function GET(request: NextRequest) {
  try {
    const { token, distributor: admin } = await requireAdmin(request);
    const db = await getMongoDb();
    const settings = await db.collection<any>('settings').findOne({ _id: 'platform' });
    const bvRate = Number(settings?.bvRate || 1);
    const { page, limit, skip } = paging(request);
    const [adminUser, transactions, commissions, transactionCount, commissionCount] = await Promise.all([
      db.collection('users').findOne({ uid: token.uid }, { projection: { passwordHash: 0 } }),
      db.collection('transactions').find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('commissions').find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection('transactions').countDocuments({}),
      db.collection('commissions').countDocuments({}),
    ]);
    const [sales, credited, failed, pending, adminSales, adminIncome] = await Promise.all([
      db.collection('transactions').aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).toArray(),
      db.collection('commissions').aggregate([{ $match: { status: 'credited' } }, { $group: { _id: null, amount: { $sum: '$commissionAmount' }, bv: { $sum: { $ifNull: ['$bvAmount', '$bv'] } } } }]).toArray(),
      db.collection('transactions').aggregate([{ $match: { status: { $in: ['failed', 'refunded'] } } }, { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]).toArray(),
      db.collection('transactions').countDocuments({ status: { $in: ['created', 'pending'] } }),
      db.collection('transactions').aggregate([{ $match: { distributorId: token.uid, status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).toArray(),
      db.collection('commissions').aggregate([{ $match: { beneficiaryId: token.uid, status: 'credited' } }, { $group: { _id: null, amount: { $sum: '$commissionAmount' } } }]).toArray(),
    ]);
    return NextResponse.json({
      data: {
        admin: { user: adminUser, balances: { purchasedBvBalance: admin?.bvBalance || 0, commissionBvBalance: admin?.commissionBvBalance || 0, convertedIncentiveBalance: admin?.convertedIncentiveBalance || 0, shoppingWallet: admin?.shoppingBalance || 0, withdrawableBalance: admin?.convertedIncentiveBalance || 0 }, totals: { paidPurchases: adminSales[0]?.amount || 0, creditedIncome: adminIncome[0]?.amount || 0 }, transactions: transactions.filter(item => item.distributorId === token.uid), commissions: commissions.filter(item => item.beneficiaryId === token.uid) },
        company: { grossSales: sales[0]?.amount || 0, creditedCommissionBV: credited[0]?.bv || 0, creditedCommissions: credited[0]?.amount || 0, netBalance: (sales[0]?.amount || 0) / 100 - (credited[0]?.amount || 0), bvRate, failedOrRefundedAmount: failed[0]?.amount || 0, failedOrRefundedCount: failed[0]?.count || 0, pendingCount: pending },
        transactions,
        commissions,
      },
      pagination: { page, limit, transactionCount, commissionCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not load admin wallet.' }, { status: error.message?.includes('Authentication') ? 401 : 403 });
  }
}
