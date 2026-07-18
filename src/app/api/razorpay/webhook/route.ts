
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * Razorpay Webhook Handler
 * Source of truth for account activation and payment verification.
 * Uses Firebase Admin to bypass security rules.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const signature = req.headers.get('x-razorpay-signature');
  const rawBody = await req.text();
  const body = JSON.parse(rawBody);

  // 1. Verify Signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature && signature !== expectedSignature) {
    return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
  }

  const { db } = getFirebaseAdmin();
  const event = body.event;
  const payment = body.payload.payment.entity;
  const orderId = payment.order_id;

  try {
    if (event === 'payment.captured') {
      const transRef = db.collection('transactions').doc(orderId);
      const transSnap = await transRef.get();

      // Idempotency: Already processed
      if (transSnap.exists && transSnap.data()?.status === 'paid') {
        return NextResponse.json({ status: 'already_processed' });
      }

      // 2. Update Transaction
      await transRef.set({
        status: 'paid',
        razorpayPaymentId: payment.id,
        capturedAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      // In a real production system, you might trigger account activation logic here
      // especially for the 'assisted' flow if it's asynchronous.
    }

    if (event === 'payment.failed') {
      await db.collection('transactions').doc(orderId).update({
        status: 'failed',
        failureReason: payment.error_description || 'Payment failed',
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
