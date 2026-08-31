import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { getMongoClient, getMongoDb } from '@/lib/mongodb';
export const runtime = 'nodejs';
export async function PUT(request: NextRequest) {
  try {
    const { token } = await requireAdmin(request);
    const body = await request.json();
    const rate = Number(body.rate);
    const currency = String(body.currency || 'INR').trim().toUpperCase();
    if (!Number.isFinite(rate) || rate <= 0 || !currency) throw new Error('Rate must be a positive number.');
    const client = await getMongoClient();
    const db = await getMongoDb();
    const now = new Date();
    let created: any;
    await client.withSession(async session => session.withTransaction(async () => {
      await db.collection('bv_rate').updateOne({ isActive: true }, { $set: { isActive: false, effectiveTo: now } }, { session });
      created = { rate, currency, isActive: true, effectiveFrom: now, effectiveTo: null, updatedBy: token.uid, createdAt: now };
      await db.collection('bv_rate').insertOne(created, { session });
    }));
    return NextResponse.json({ data: created }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) { return NextResponse.json({ error: e.message || 'Could not update BV rate.' }, { status: 400 }); }
}
