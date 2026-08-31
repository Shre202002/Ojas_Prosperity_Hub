import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getMongoDb();
    const [users, distributors, payments, kycs] = await Promise.all([
      db.collection('users').find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray(),
      db.collection('distributors').find({ rank: { $ne: 'Admin' } }).toArray(),
      db.collection('transactions').find({ status: 'paid' }).sort({ capturedAt: -1, createdAt: -1 }).toArray(),
      db.collection('kycSubmissions').find({}).sort({ submittedAt: -1 }).toArray(),
    ]);
    const distributorByUid = new Map(distributors.map((item: any) => [item.uid, item]));
    const paymentByUid = new Map<string, any>();
    for (const payment of payments as any[]) if (payment.distributorId && !paymentByUid.has(payment.distributorId)) paymentByUid.set(payment.distributorId, payment);
    const kycByUid = new Map<string, any>();
    for (const kyc of kycs as any[]) if (kyc.distributorId && !kycByUid.has(kyc.distributorId)) kycByUid.set(kyc.distributorId, kyc);
    const data = (users as any[])
      .map(user => ({ user: { uid: user.uid, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }, distributor: distributorByUid.get(user.uid) || null, payment: paymentByUid.get(user.uid) || null, kyc: kycByUid.get(user.uid) || null }));
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not load users.' }, { status: error.message?.includes('Authentication') ? 401 : 403 });
  }
}
