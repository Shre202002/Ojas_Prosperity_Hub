import type { ClientSession, Filter } from 'mongodb';
import { collection } from './mongodb';
import { WALLET_BALANCE_FIELD, buildWalletTxn, idempotencyKey, type WalletTxnInput, type WalletTxnStatus, type WalletTxnType } from './wallet-transactions-core';

export * from './wallet-transactions-core';

// Call AFTER the balance change, inside the same Mongo transaction: balanceAfter is then read from the
// member's real balance, and the row commits or rolls back together with the money movement.
export async function recordWalletTransaction(input: WalletTxnInput, session?: ClientSession) {
  const ledger = await collection<any>('walletTransactions');
  const key = idempotencyKey(input.type, input.referenceId);
  const existing = await ledger.findOne({ idempotencyKey: key }, { session });
  if (existing) return existing;

  const doc = buildWalletTxn(input);
  const field = WALLET_BALANCE_FIELD[input.wallet];
  if (field && !input.backfilled) {
    const owner = await (await collection<any>('distributors')).findOne({ uid: input.userId }, { session, projection: { [field]: 1 } });
    doc.balanceAfter = owner ? Number(owner[field] || 0) : null;
  }
  try {
    const result = await ledger.insertOne(doc, { session });
    return { ...doc, _id: result.insertedId };
  } catch (error: any) {
    if (error?.code === 11000) return ledger.findOne({ idempotencyKey: key }, { session });
    throw error;
  }
}

export async function updateWalletTransactionStatus(type: WalletTxnType, referenceId: string, status: WalletTxnStatus, extra: Record<string, unknown> = {}, session?: ClientSession) {
  return (await collection<any>('walletTransactions')).updateOne(
    { idempotencyKey: idempotencyKey(type, referenceId) },
    { $set: { status, ...extra, updatedAt: new Date() } },
    { session },
  );
}

const csvCell = (value: unknown) => {
  const text = String(value ?? '');
  // A leading = + - @ would be run as a formula by spreadsheet apps.
  return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
};
export const walletTransactionsToCsv = (rows: any[]) => [
  ['Date', 'Txn ID', 'User', 'Counterparty', 'Type', 'Direction', 'Wallet', 'Amount', 'Unit', 'Balance after', 'Status', 'Reference', 'Description'].join(','),
  ...rows.map(r => [new Date(r.createdAt).toISOString(), r.txnId, r.userId, r.counterpartyId, r.type, r.direction, r.wallet, r.amount, r.unit, r.balanceAfter, r.status, `${r.referenceCollection}:${r.referenceId}`, r.description].map(csvCell).join(',')),
].join('\n');

// Shared by the member and admin list endpoints. `base` pins the member for the member endpoint.
export async function listWalletTransactions(params: URLSearchParams, base: Filter<any> = {}) {
  const filter: Filter<any> = { ...base };
  const type = params.get('type'); if (type) filter.type = type;
  const direction = params.get('direction'); if (direction === 'credit' || direction === 'debit') filter.direction = direction;
  const status = params.get('status'); if (status) filter.status = status;
  const from = params.get('from'), to = params.get('to');
  const range: Record<string, Date> = {};
  if (from && !Number.isNaN(Date.parse(from))) range.$gte = new Date(from);
  if (to && !Number.isNaN(Date.parse(to))) range.$lte = new Date(to);
  if (Object.keys(range).length) filter.createdAt = range;

  const limit = Math.min(Math.max(Number(params.get('limit')) || 25, 1), 100);
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const ledger = await collection<any>('walletTransactions');
  const [data, total] = await Promise.all([
    ledger.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).toArray(),
    ledger.countDocuments(filter),
  ]);
  return { data, pagination: { page, limit, total } };
}
