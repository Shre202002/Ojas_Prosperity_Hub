import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { collection } from '@/lib/mongodb';
import { failWithdrawalAndRefund, markWithdrawalPaid, startPayout, toWithdrawalId } from '@/lib/withdrawal-state';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const rows = await (await collection<any>('withdrawals')).find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return NextResponse.json({ data: rows });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 403 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { token } = await requireAdmin(request);
    const { id, status } = await request.json();
    if (!id || !['approved', 'rejected', 'paid', 'retry'].includes(status)) throw new Error('Invalid withdrawal action.');
    const withdrawals = await collection<any>('withdrawals');
    const _id = toWithdrawalId(String(id));
    const item = await withdrawals.findOne({ _id });
    if (!item) throw new Error('Withdrawal not found.');
    const review = { reviewedBy: token.uid, reviewedAt: new Date() };

    let changed: boolean;
    if (status === 'approved') {
      changed = Boolean((await withdrawals.updateOne({ _id, status: 'pending' }, { $set: { status: 'approved', ...review } })).modifiedCount);
    } else if (status === 'rejected') {
      changed = await failWithdrawalAndRefund(String(id), 'rejected', review);
    } else if (status === 'paid') {
      changed = await markWithdrawalPaid(String(id), review);
    } else {
      // Retry is only for a payout that never reached RazorpayX; the idempotency key makes it safe to repeat.
      if (item.status !== 'processing' || item.payoutId) throw new Error('Only a payout that has not started can be retried.');
      const result = await startPayout(String(id));
      if (!result.started) throw new Error(result.reason || 'Payout could not be started.');
      changed = true;
    }
    if (!changed) throw new Error('Withdrawal is no longer in a state that allows this action.');
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e.message || 'Withdrawal update failed.' }, { status: 400 }); }
}
