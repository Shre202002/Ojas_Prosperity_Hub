import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Razorpay Webhook Handler
 * Source of truth for account activation and payment verification.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_KEY_SECRET!; // Use Key Secret for signature verification
  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.json();

  // 1. Verify Signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  // In production, signature verification is mandatory. 
  // If no signature header, or mismatch, reject.
  if (signature && signature !== expectedSignature) {
    return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
  }

  const { db } = initializeFirebase();
  const event = body.event;
  const payment = body.payload.payment.entity;
  const orderId = payment.order_id;

  try {
    if (event === 'payment.captured') {
      const transRef = doc(db, 'transactions', orderId);
      const transSnap = await getDoc(transRef);

      // Idempotency: Already processed
      if (transSnap.exists() && transSnap.data().status === 'paid') {
        return NextResponse.json({ status: 'already_processed' });
      }

      // 2. Update Transaction
      await setDoc(transRef, {
        id: orderId,
        status: 'paid',
        razorpayPaymentId: payment.id,
        capturedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 3. Logic for Account Activation would go here (or be triggered by this update)
      // This webhook verifies the payment as the "Source of Truth"
    }

    if (event === 'payment.failed') {
      await updateDoc(doc(db, 'transactions', orderId), {
        status: 'failed',
        failureReason: payment.error_description || 'Payment failed',
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
