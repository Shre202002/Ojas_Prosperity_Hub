import type { ClientSession } from 'mongodb';
import { collection } from './mongodb';

export type LedgerEntry = {
  entryType: 'purchase_revenue' | 'commission_payout' | 'withdrawal_payout' | 'refund' | 'adjustment';
  direction: 'credit' | 'debit';
  amount: number;
  referenceCollection: 'transactions' | 'commissions' | 'withdrawals';
  referenceId: string;
  userId: string;
  packageId?: string | null;
  bv?: number | null;
  description: string;
  createdAt?: Date;
};

export async function appendCompanyLedger(entry: LedgerEntry, session?: ClientSession) {
  const ledger = await collection<any>('companyLedger');
  const existing = await ledger.findOne({ referenceCollection: entry.referenceCollection, referenceId: entry.referenceId }, { session });
  if (existing) return existing;
  const previous = await ledger.findOne({}, { sort: { createdAt: -1, _id: -1 }, session });
  const signed = entry.direction === 'credit' ? entry.amount : -entry.amount;
  const document = { ...entry, amount: Math.round(Math.abs(entry.amount) * 100) / 100, balanceAfter: Math.round(((previous?.balanceAfter || 0) + signed) * 100) / 100, createdAt: entry.createdAt || new Date() };
  try { const result = await ledger.insertOne(document, { session }); return { ...document, _id: result.insertedId }; }
  catch (error: any) { if (error?.code === 11000) return ledger.findOne({ referenceCollection: entry.referenceCollection, referenceId: entry.referenceId }, { session }); throw error; }
}
