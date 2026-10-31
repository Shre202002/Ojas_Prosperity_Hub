import { ObjectId } from 'mongodb';
import { collection, getMongoClient, getMongoDb } from './mongodb';
import { appendCompanyLedger } from './company-ledger';
import { createUpiPayout, payoutsConfigured, PayoutError } from './razorpayx';
import { recordWalletTransaction, updateWalletTransactionStatus, withdrawalRefundEntry } from './wallet-transactions';

export const toWithdrawalId = (id: string) => (ObjectId.isValid(id) ? new ObjectId(id) : (id as any));

async function inTransaction<T>(work: (db: Awaited<ReturnType<typeof getMongoDb>>, session: any) => Promise<T>) {
  const db = await getMongoDb();
  const session = (await getMongoClient()).startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => { result = await work(db, session); });
    return result;
  } finally { await session.endSession(); }
}

// Filtering on the current status makes both functions safe to call twice (repeated webhook, double click):
// only the call that actually changes the row moves money.
export async function markWithdrawalPaid(id: string, extra: Record<string, unknown> = {}) {
  return inTransaction(async (db, session) => {
    const withdrawals = db.collection<any>('withdrawals');
    const _id = toWithdrawalId(id);
    const result = await withdrawals.updateOne(
      { _id, status: { $in: ['processing', 'pending', 'approved'] } },
      { $set: { status: 'paid', paidAt: new Date(), ...extra } }, { session });
    if (!result.modifiedCount) return false;
    const item = await withdrawals.findOne({ _id }, { session });
    await updateWalletTransactionStatus('withdrawal', String(item._id), 'completed', { payoutId: (extra as any).payoutId ?? item.payoutId ?? null }, session);
    await appendCompanyLedger({ entryType: 'withdrawal_payout', direction: 'debit', amount: Number(item.amount), referenceCollection: 'withdrawals', referenceId: String(item._id), userId: String(item.userId), description: `Withdrawal payout to ${item.userId}` }, session);
    return true;
  });
}

export async function failWithdrawalAndRefund(id: string, finalStatus: 'failed' | 'rejected', extra: Record<string, unknown> = {}) {
  return inTransaction(async (db, session) => {
    const withdrawals = db.collection<any>('withdrawals');
    const _id = toWithdrawalId(id);
    const item = await withdrawals.findOne({ _id, status: { $in: ['processing', 'pending', 'approved'] } }, { session });
    if (!item) return false;
    const result = await withdrawals.updateOne({ _id, status: item.status }, { $set: { status: finalStatus, failedAt: new Date(), ...extra } }, { session });
    if (!result.modifiedCount) return false;
    await db.collection<any>('distributors').updateOne({ uid: item.userId }, { $inc: { convertedIncentiveBalance: Number(item.amount) }, $set: { updatedAt: new Date() } }, { session });
    await updateWalletTransactionStatus('withdrawal', String(item._id), 'failed', {}, session);
    await recordWalletTransaction(withdrawalRefundEntry({ userId: item.userId, withdrawalId: String(item._id), amount: Number(item.amount), reason: String((extra as any).payoutError || finalStatus) }), session);
    return true;
  });
}

// Sends one withdrawal to RazorpayX. Never throws: a payout problem must not undo an already-committed withdrawal.
export async function startPayout(id: string) {
  if (!payoutsConfigured()) return { started: false, reason: 'Payouts are not configured.' };
  const withdrawals = await collection<any>('withdrawals');
  const item = await withdrawals.findOne({ _id: toWithdrawalId(id), status: 'processing' });
  if (!item) return { started: false, reason: 'Withdrawal is not awaiting payout.' };
  try {
    const user = await (await collection<any>('users')).findOne({ uid: item.userId });
    const payout = await createUpiPayout({ withdrawalId: String(item._id), userId: item.userId, name: user?.name || 'SJAPL member', email: user?.email, upi: item.accountDetails?.upi, amount: Number(item.amount) });
    await withdrawals.updateOne({ _id: item._id }, { $set: { payoutId: payout.payoutId, payoutStatus: payout.status, payoutError: null } });
    return { started: true };
  } catch (error: any) {
    const message = error?.message || 'Payout failed.';
    console.error(`[payout] withdrawal ${item._id}: ${message}`);
    if (error instanceof PayoutError && error.permanent) {
      await failWithdrawalAndRefund(String(item._id), 'failed', { payoutError: message });
      return { started: false, reason: message, refunded: true };
    }
    // Transient: stays 'processing' so an admin can retry safely (the idempotency key prevents a double payout).
    await withdrawals.updateOne({ _id: item._id }, { $set: { payoutError: message } });
    return { started: false, reason: message };
  }
}
