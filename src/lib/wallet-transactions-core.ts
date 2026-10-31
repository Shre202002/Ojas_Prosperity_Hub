// Pure (no database, no path aliases) so the live code, the backfill script and the unit test share one definition.
import { randomBytes } from 'node:crypto';

export type WalletTxnType =
  | 'purchase' | 'purchase_bv' | 'repurchase'
  | 'commission_direct' | 'commission_matching'
  | 'bv_conversion_debit' | 'bv_conversion_credit'
  | 'withdrawal' | 'withdrawal_refund' | 'adjustment';
export type WalletName = 'external' | 'purchased_bv' | 'commission_bv' | 'inr' | 'shopping';
export type WalletTxnStatus = 'pending' | 'completed' | 'failed' | 'reversed';

// Which `distributors` balance field each wallet maps to (null = money outside the platform, e.g. a Razorpay payment).
export const WALLET_BALANCE_FIELD: Record<WalletName, string | null> = {
  external: null,
  purchased_bv: 'bvBalance',
  commission_bv: 'commissionBvBalance',
  inr: 'convertedIncentiveBalance',
  shopping: 'shoppingBalance',
};

export type WalletTxnInput = {
  userId: string;
  type: WalletTxnType;
  direction: 'credit' | 'debit';
  wallet: WalletName;
  amount: number;
  unit: 'INR' | 'BV';
  referenceCollection: 'transactions' | 'commissions' | 'conversions' | 'withdrawals' | 'orders';
  referenceId: string;
  description: string;
  status?: WalletTxnStatus;
  counterpartyId?: string | null;
  packageId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  payoutId?: string | null;
  upi?: string | null;
  rate?: number | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  backfilled?: boolean;
};

export const round2 = (value: number) => Math.round(value * 100) / 100;
const roundBv = (value: number) => Math.round(value * 1e6) / 1e6;
export const idempotencyKey = (type: WalletTxnType, referenceId: string) => `${type}:${referenceId}`;

export function makeTxnId(at = new Date()) {
  const day = at.toISOString().slice(0, 10).replace(/-/g, '');
  return `TXN-${day}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function buildWalletTxn(input: WalletTxnInput) {
  const createdAt = input.createdAt || new Date();
  return {
    txnId: makeTxnId(createdAt),
    idempotencyKey: idempotencyKey(input.type, input.referenceId),
    userId: input.userId,
    counterpartyId: input.counterpartyId ?? null,
    type: input.type,
    direction: input.direction,
    wallet: input.wallet,
    amount: input.unit === 'INR' ? round2(input.amount) : roundBv(input.amount),
    unit: input.unit,
    balanceAfter: null as number | null,
    status: input.status || 'completed',
    referenceCollection: input.referenceCollection,
    referenceId: input.referenceId,
    packageId: input.packageId ?? null,
    razorpayOrderId: input.razorpayOrderId ?? null,
    razorpayPaymentId: input.razorpayPaymentId ?? null,
    payoutId: input.payoutId ?? null,
    upi: input.upi ?? null,
    rate: input.rate ?? null,
    description: input.description,
    metadata: input.metadata || {},
    backfilled: Boolean(input.backfilled),
    createdAt,
    updatedAt: createdAt,
  };
}

type At = { at?: Date; backfilled?: boolean };

// Member paid ₹X by Razorpay (external debit) and was credited the package's BV.
export function purchaseEntries(p: { userId: string; orderId: string; paymentId?: string | null; packageId: string; priceInr: number; bv: number; rate?: number | null } & At): WalletTxnInput[] {
  const base = { userId: p.userId, referenceCollection: 'transactions' as const, referenceId: p.orderId, packageId: p.packageId, razorpayOrderId: p.orderId, razorpayPaymentId: p.paymentId ?? null, rate: p.rate ?? null, createdAt: p.at, backfilled: p.backfilled };
  return [
    { ...base, type: 'purchase', direction: 'debit', wallet: 'external', amount: p.priceInr, unit: 'INR', description: `Package purchase: ${p.packageId}` },
    { ...base, type: 'purchase_bv', direction: 'credit', wallet: 'purchased_bv', amount: p.bv, unit: 'BV', description: `Purchased BV credited for ${p.packageId}` },
  ];
}

export function directCommissionEntry(p: { beneficiaryId: string; buyerId: string; commissionKey: string; bv: number; rate: number; amountInr: number; packageId: string; orderId: string } & At): WalletTxnInput {
  return { userId: p.beneficiaryId, counterpartyId: p.buyerId, type: 'commission_direct', direction: 'credit', wallet: 'commission_bv', amount: p.bv, unit: 'BV', referenceCollection: 'commissions', referenceId: p.commissionKey, packageId: p.packageId, razorpayOrderId: p.orderId, rate: p.rate, description: `Direct sponsor commission (${p.packageId})`, metadata: { commissionInr: round2(p.amountInr) }, createdAt: p.at, backfilled: p.backfilled };
}

export function matchingCommissionEntry(p: { beneficiaryId: string; commissionKey: string; bv: number; rate: number; amountInr: number; matchedBv: number; sourceUserIds: string[] } & At): WalletTxnInput {
  return { userId: p.beneficiaryId, type: 'commission_matching', direction: 'credit', wallet: 'commission_bv', amount: p.bv, unit: 'BV', referenceCollection: 'commissions', referenceId: p.commissionKey, rate: p.rate, description: `Matching bonus for ${p.matchedBv} BV`, metadata: { commissionInr: round2(p.amountInr), matchedBv: p.matchedBv, sourceUserIds: p.sourceUserIds }, createdAt: p.at, backfilled: p.backfilled };
}

// Earned commission BV leaves the BV wallet and arrives in the withdrawable INR wallet.
export function conversionEntries(p: { userId: string; conversionId: string; bv: number; rate: number; rupees: number } & At): WalletTxnInput[] {
  const base = { userId: p.userId, referenceCollection: 'conversions' as const, referenceId: p.conversionId, rate: p.rate, createdAt: p.at, backfilled: p.backfilled };
  return [
    { ...base, type: 'bv_conversion_debit', direction: 'debit', wallet: 'commission_bv', amount: p.bv, unit: 'BV', description: `Converted ${p.bv} BV to INR` },
    { ...base, type: 'bv_conversion_credit', direction: 'credit', wallet: 'inr', amount: p.rupees, unit: 'INR', description: `Received from ${p.bv} BV conversion` },
  ];
}

export function withdrawalEntry(p: { userId: string; withdrawalId: string; amount: number; upi?: string | null; status: WalletTxnStatus; payoutId?: string | null } & At): WalletTxnInput {
  return { userId: p.userId, type: 'withdrawal', direction: 'debit', wallet: 'inr', amount: p.amount, unit: 'INR', status: p.status, referenceCollection: 'withdrawals', referenceId: p.withdrawalId, upi: p.upi ?? null, payoutId: p.payoutId ?? null, description: 'Withdrawal to UPI', createdAt: p.at, backfilled: p.backfilled };
}

export function withdrawalRefundEntry(p: { userId: string; withdrawalId: string; amount: number; reason?: string } & At): WalletTxnInput {
  return { userId: p.userId, type: 'withdrawal_refund', direction: 'credit', wallet: 'inr', amount: p.amount, unit: 'INR', referenceCollection: 'withdrawals', referenceId: p.withdrawalId, description: p.reason ? `Withdrawal refunded: ${p.reason}` : 'Withdrawal refunded', createdAt: p.at, backfilled: p.backfilled };
}
