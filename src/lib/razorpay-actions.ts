'use server';

import { z } from 'zod';
import { getFirebaseAdmin } from './firebase-admin';

const CreateOrderSchema = z.object({
  packageId: z.enum(['starter', 'growth', 'platinum', '1400', '2800', '7000']),
  distributorId: z.string().optional(),
  enrolledBy: z.string().optional(),
});

const PACKAGE_PRICES: Record<string, number> = {
  'starter': 500000, 
  'growth': 1500000,
  'platinum': 4000000,
  '1400': 140000,
  '2800': 280000,
  '7000': 700000,
};

/**
 * SIMULATED Order Creation
 * Creates a transaction record in Firestore directly without calling Razorpay API.
 */
export async function createRazorpayOrder(input: z.infer<typeof CreateOrderSchema>) {
  try {
    const { db } = getFirebaseAdmin();
    const amount = PACKAGE_PRICES[input.packageId];
    if (!amount) throw new Error('Invalid package selected.');

    // Generate a dummy Order ID
    const dummyOrderId = `sim_order_${Math.random().toString(36).substring(2, 12)}`;

    // Create the transaction record on the server (bypassing rules)
    await db.collection('transactions').doc(dummyOrderId).set({
      id: dummyOrderId,
      distributorId: input.distributorId || null,
      packageId: input.packageId,
      amount: amount,
      currency: 'INR',
      status: 'created',
      enrolledBy: input.enrolledBy || null,
      razorpayOrderId: dummyOrderId,
      createdAt: new Date(),
    });

    return {
      success: true,
      orderId: dummyOrderId,
      amount: amount,
      currency: 'INR',
      keyId: 'SIMULATED_KEY',
    };
  } catch (error: any) {
    console.error('Simulated Order Creation Failed:', error);
    return {
      success: false,
      error: error.message || 'Could not simulate payment order.',
    };
  }
}

/**
 * SIMULATED Payment Verification
 * Updates a transaction to "paid" status immediately.
 */
export async function simulatePaymentCapture(orderId: string) {
  try {
    const { db } = getFirebaseAdmin();
    await db.collection('transactions').doc(orderId).update({
      status: 'paid',
      razorpayPaymentId: `sim_pay_${Math.random().toString(36).substring(2, 12)}`,
      capturedAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
