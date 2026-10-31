import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { collection } from '@/lib/mongodb';
import { failWithdrawalAndRefund, markWithdrawalPaid, toWithdrawalId } from '@/lib/withdrawal-state';

export const runtime = 'nodejs';

// RazorpayX payout status events. Source of truth for whether a withdrawal was really paid.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAYX_WEBHOOK_SECRET;
  const signature = req.headers.get('x-razorpay-signature');
  const rawBody = await req.text();
  if (!secret || !signature) return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ status: 'invalid_signature' }, { status: 400 });
  }

  let body: any;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ status: 'invalid_payload' }, { status: 400 }); }

  const payout = body?.payload?.payout?.entity;
  const event = String(body?.event || '');
  if (!event.startsWith('payout.') || !payout?.reference_id) return NextResponse.json({ status: 'ignored' });

  try {
    const withdrawalId = String(payout.reference_id);
    const payoutFields = { payoutId: payout.id, payoutStatus: payout.status };
    if (event === 'payout.processed') {
      await markWithdrawalPaid(withdrawalId, payoutFields);
    } else if (['payout.failed', 'payout.reversed', 'payout.rejected', 'payout.cancelled'].includes(event)) {
      await failWithdrawalAndRefund(withdrawalId, 'failed', { ...payoutFields, payoutError: payout.failure_reason || payout.status_details?.description || event });
    } else {
      // queued / pending / initiated: just record progress
      await (await collection<any>('withdrawals')).updateOne({ _id: toWithdrawalId(withdrawalId) }, { $set: payoutFields });
    }
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Payout webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
