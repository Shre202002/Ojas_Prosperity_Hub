
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { collection, getMongoClient, getMongoDb } from '@/lib/mongodb';
import { appendCompanyLedger } from '@/lib/company-ledger';

/**
 * Razorpay Webhook Handler
 * Source of truth for account activation and payment verification.
 * Uses the server-side MongoDB repository.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get('x-razorpay-signature');
  const rawBody = await req.text();
  if (!secret || !signature) return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
  let body: any;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ status: 'invalid_payload' }, { status: 400 }); }

  // 1. Verify Signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
  }

  const event = body.event;
  const payment = body.payload.payment.entity;
  const orderId = payment.order_id;

  try {
    if (event === 'payment.captured') {
      const db = await getMongoDb();
      const session = (await getMongoClient()).startSession();
      try { await session.withTransaction(async () => {
      const transactions = db.collection<any>('transactions');
      const transSnap = await transactions.findOne({ _id: orderId }, { session });

      // Idempotency: Already processed
      if (transSnap && transSnap.status === 'paid') {
        throw new Error('already_processed');
      }

      // 2. Update Transaction
      await transactions.updateOne({ _id: orderId }, { $set: {
        status: 'paid',
        razorpayPaymentId: payment.id,
        capturedAt: new Date(),
        bvAtPurchase: transSnap?.bvAtQuote, rateAtPurchase: transSnap?.rateAtQuote,
        priceAtPurchase: transSnap?.priceAtQuote, currency: transSnap?.currency || 'INR',
        updatedAt: new Date(),
      }}, { session });
      if (transSnap) await appendCompanyLedger({ entryType: 'purchase_revenue', direction: 'credit', amount: Number(transSnap.priceAtQuote ?? transSnap.amount) / (transSnap.priceAtQuote !== undefined ? 1 : 100), referenceCollection: 'transactions', referenceId: orderId, userId: String(transSnap.distributorId || transSnap.enrolledBy || ''), packageId: transSnap.packageId || null, bv: transSnap.bvAtQuote || null, description: `Purchase: ${transSnap.packageId || 'package'}` }, session);
      }); } catch (error: any) { if (error.message === 'already_processed') return NextResponse.json({ status: 'already_processed' }); throw error; } finally { await session.endSession(); }

      // In a real production system, you might trigger account activation logic here
      // especially for the 'assisted' flow if it's asynchronous.
    }

    if (event === 'payment.failed') {
      await (await collection('transactions')).updateOne({ _id: orderId }, { $set: {
        status: 'failed',
        failureReason: payment.error_description || 'Payment failed',
        updatedAt: new Date(),
      }});
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
