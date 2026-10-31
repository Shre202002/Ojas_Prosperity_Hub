// Run: node scripts/test-wallet-transactions.mjs  (checks the pure entry builders, no database needed)
import assert from 'node:assert/strict';
import { buildWalletTxn, purchaseEntries, directCommissionEntry, matchingCommissionEntry, conversionEntries, withdrawalEntry, withdrawalRefundEntry, idempotencyKey, WALLET_BALANCE_FIELD } from '../src/lib/wallet-transactions-core.ts';

const at = new Date('2026-10-28T10:00:00Z');
const keys = new Set();
const check = (entries, expected) => entries.forEach((entry, i) => {
  const doc = buildWalletTxn(entry);
  for (const [field, value] of Object.entries(expected[i])) assert.equal(doc[field], value, `${doc.type}.${field}`);
  assert.match(doc.txnId, /^TXN-20261028-[0-9A-F]{8}$/);
  assert.equal(doc.idempotencyKey, idempotencyKey(doc.type, doc.referenceId));
  assert.ok(!keys.has(doc.idempotencyKey), `duplicate key ${doc.idempotencyKey}`); keys.add(doc.idempotencyKey);
});

check(purchaseEntries({ userId: 'u1', orderId: 'order_1', paymentId: 'pay_1', packageId: 'gold', priceInr: 5000, bv: 500, rate: 1, at }), [
  { type: 'purchase', direction: 'debit', wallet: 'external', unit: 'INR', amount: 5000, razorpayPaymentId: 'pay_1', status: 'completed' },
  { type: 'purchase_bv', direction: 'credit', wallet: 'purchased_bv', unit: 'BV', amount: 500 },
]);
check([directCommissionEntry({ beneficiaryId: 's1', buyerId: 'u1', commissionKey: 'order_1:direct-sponsor', bv: 50, rate: 1, amountInr: 50, packageId: 'gold', orderId: 'order_1', at })], [
  { type: 'commission_direct', userId: 's1', counterpartyId: 'u1', direction: 'credit', wallet: 'commission_bv', amount: 50 },
]);
check([matchingCommissionEntry({ beneficiaryId: 's1', commissionKey: 'matching:s1:a,b', bv: 150, rate: 1, amountInr: 150, matchedBv: 1000, sourceUserIds: ['u1', 'u2'], at })], [
  { type: 'commission_matching', userId: 's1', direction: 'credit', unit: 'BV', amount: 150 },
]);
check(conversionEntries({ userId: 's1', conversionId: 'c1', bv: 100, rate: 0.5, rupees: 50, at }), [
  { type: 'bv_conversion_debit', direction: 'debit', wallet: 'commission_bv', unit: 'BV', amount: 100 },
  { type: 'bv_conversion_credit', direction: 'credit', wallet: 'inr', unit: 'INR', amount: 50 },
]);
check([withdrawalEntry({ userId: 's1', withdrawalId: 'w1', amount: 2500, upi: 'a@bank', status: 'pending', at })], [
  { type: 'withdrawal', direction: 'debit', wallet: 'inr', amount: 2500, upi: 'a@bank', status: 'pending' },
]);
check([withdrawalRefundEntry({ userId: 's1', withdrawalId: 'w1', amount: 2500, reason: 'failed', at })], [
  { type: 'withdrawal_refund', direction: 'credit', wallet: 'inr', amount: 2500 },
]);

// Same event twice -> same idempotency key (what makes live writes and the backfill safe to overlap).
assert.equal(buildWalletTxn(purchaseEntries({ userId: 'u1', orderId: 'order_1', packageId: 'gold', priceInr: 1, bv: 1 })[0]).idempotencyKey, 'purchase:order_1');
// Rounding: INR to 2 decimals, BV to 6.
assert.equal(buildWalletTxn(conversionEntries({ userId: 'u', conversionId: 'x', bv: 1, rate: 1, rupees: 10.005 + 0.0001, at })[1]).amount, 10.01);
// Every wallet but 'external' maps to a real balance field (that is where balanceAfter is read from).
assert.deepEqual(Object.entries(WALLET_BALANCE_FIELD).filter(([, f]) => f === null).map(([w]) => w), ['external']);
console.log('wallet transaction builder checks passed');
