import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { collection, getMongoClient, getMongoDb } from '@/lib/mongodb';
import { appendCompanyLedger } from '@/lib/company-ledger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = await request.json();
    if (!orderId || !paymentId || !signature || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Incomplete payment verification data.' }, { status: 400 });
    }

    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`).digest('hex');
    const valid = expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) return NextResponse.json({ error: 'Payment signature could not be verified.' }, { status: 400 });

    const db = await getMongoDb();
    const session = (await getMongoClient()).startSession();
    try { await session.withTransaction(async () => {
      const transaction = await db.collection<any>('transactions').findOne({ _id: orderId }, { session });
      if (!transaction) throw new Error('Payment order not found.');
      await db.collection<any>('transactions').updateOne({ _id: orderId }, { $set: { status: 'paid', razorpayPaymentId: paymentId, capturedAt: new Date(), updatedAt: new Date(), bvAtPurchase: transaction.bvAtQuote, rateAtPurchase: transaction.rateAtQuote, priceAtPurchase: transaction.priceAtQuote, currency: transaction.currency || 'INR' } }, { session });
      await appendCompanyLedger({ entryType: 'purchase_revenue', direction: 'credit', amount: Number(transaction.priceAtQuote ?? transaction.amount) / (transaction.priceAtQuote !== undefined ? 1 : 100), referenceCollection: 'transactions', referenceId: orderId, userId: String(transaction.distributorId || transaction.enrolledBy || ''), packageId: transaction.packageId || null, bv: transaction.bvAtQuote || null, description: `Purchase: ${transaction.packageId || 'package'}` }, session);
    }); } finally { await session.endSession(); }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Payment verification failed.' }, { status: 400 });
  }
}
