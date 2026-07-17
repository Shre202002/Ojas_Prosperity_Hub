
'use server';

import Razorpay from 'razorpay';
import { z } from 'zod';

const CreateOrderSchema = z.object({
  packageId: z.string(),
  amount: z.number(), // In Paise
  distributorId: z.string().optional(),
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

/**
 * Creates a Razorpay Order server-side.
 * This ensures the price is not manipulated on the client.
 */
export async function createRazorpayOrder(input: z.infer<typeof CreateOrderSchema>) {
  try {
    const order = await razorpay.orders.create({
      amount: input.amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        packageId: input.packageId,
        distributorId: input.distributorId || 'anonymous',
      },
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    };
  } catch (error: any) {
    console.error('Razorpay Order Creation Failed:', error);
    return {
      success: false,
      error: error.message || 'Could not create payment order.',
    };
  }
}
