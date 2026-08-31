'use server';

import { z } from 'zod';
import { collection } from './mongodb';
import Razorpay from 'razorpay';
import { getPackageConfig } from './package-config';

const CreateOrderSchema = z.object({
  packageId: z.string().min(1),
  distributorId: z.string().optional(),
  enrolledBy: z.string().optional(),
});

/**
 * Creates a real Razorpay order and stores a local transaction before checkout.
 */
export async function createRazorpayOrder(input: z.infer<typeof CreateOrderSchema>) {
  try {
    const transactions = await collection<any>('transactions');
    const pkg = await getPackageConfig(input.packageId);
    if (!pkg) throw new Error('Invalid or inactive package selected.');
    const rateAtQuote = Number(pkg.bvRate || 1);
    const priceAtQuote = Math.round(pkg.bv * rateAtQuote * 100) / 100;
    const amount = Math.round(priceAtQuote * 100);
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `ojas_${Date.now()}`,
      notes: { packageId: pkg.id, enrolledBy: input.enrolledBy || '' },
    });

    await transactions.insertOne({
      _id: order.id,
      id: order.id,
      distributorId: input.distributorId || null,
      packageId: pkg.id,
      amount: amount,
      priceAtQuote,
      bvAtQuote: pkg.bv,
      rateAtQuote,
      currency: pkg.currency || 'INR',
      status: 'created',
      enrolledBy: input.enrolledBy || null,
      razorpayOrderId: order.id,
      createdAt: new Date(),
    });

    return {
      success: true,
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error: any) {
    console.error('Razorpay Order Creation Failed:', error);
    return {
      success: false,
      error: error.message || 'Could not create payment order.',
    };
  }
}
