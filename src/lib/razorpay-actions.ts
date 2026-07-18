'use server';

import Razorpay from 'razorpay';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  packageId: z.enum(['starter', 'growth', 'platinum', '1400', '2800', '7000']),
  distributorId: z.string().optional(),
  enrolledBy: z.string().optional(),
});

// Server-side Price Lookup
const PACKAGE_PRICES: Record<string, number> = {
  'starter': 500000, // ₹5000 in paise
  'growth': 1500000,
  'platinum': 4000000,
  '1400': 140000,
  '2800': 280000,
  '7000': 700000,
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Creates a Razorpay Order server-side.
 */
export async function createRazorpayOrder(input: z.infer<typeof CreateOrderSchema>) {
  try {
    const amount = PACKAGE_PRICES[input.packageId];
    if (!amount) throw new Error('Invalid package selected.');

    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        packageId: input.packageId,
        distributorId: input.distributorId || 'pending',
        enrolledBy: input.enrolledBy || null,
      },
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID!,
    };
  } catch (error: any) {
    console.error('Razorpay Order Creation Failed:', error);
    return {
      success: false,
      error: error.message || 'Could not create payment order.',
    };
  }
}
