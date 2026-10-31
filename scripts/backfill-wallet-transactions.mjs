// Builds walletTransactions rows from existing records. Safe to re-run: rows are keyed by idempotencyKey,
// the same keys the live code uses, so nothing is duplicated.
//   node scripts/backfill-wallet-transactions.mjs --dry-run   (counts only, writes nothing)
//   node scripts/backfill-wallet-transactions.mjs
// Node 22.18+ runs the shared .ts builders directly (type stripping).
import { MongoClient } from 'mongodb';
import { buildWalletTxn, purchaseEntries, directCommissionEntry, matchingCommissionEntry, conversionEntries, withdrawalEntry, withdrawalRefundEntry } from '../src/lib/wallet-transactions-core.ts';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas_prosperity_hub';
const dryRun = process.argv.includes('--dry-run');
if (!uri) throw new Error('MONGODB_URI is required.');

const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const ledger = db.collection('walletTransactions');
  if (!dryRun) {
    await ledger.createIndex({ idempotencyKey: 1 }, { unique: true });
    await ledger.createIndex({ userId: 1, createdAt: -1 });
    await ledger.createIndex({ userId: 1, type: 1, createdAt: -1 });
    await ledger.createIndex({ type: 1, createdAt: -1 });
    await ledger.createIndex({ referenceCollection: 1, referenceId: 1 });
  }

  const summary = { scanned: {}, inserted: 0, alreadyPresent: 0, byType: {} };
  const write = async (input) => {
    const doc = buildWalletTxn({ ...input, backfilled: true });
    if (await ledger.findOne({ idempotencyKey: doc.idempotencyKey }, { projection: { _id: 1 } })) { summary.alreadyPresent++; return; }
    if (!dryRun) {
      try { await ledger.insertOne(doc); } catch (error) { if (error?.code === 11000) { summary.alreadyPresent++; return; } throw error; }
    }
    summary.inserted++; summary.byType[doc.type] = (summary.byType[doc.type] || 0) + 1;
  };
  const writeAll = async (inputs) => { for (const input of inputs) await write(input); };

  // 1. Paid package purchases that were bound to a member.
  const orders = await db.collection('transactions').find({ status: 'paid', distributorId: { $nin: [null, ''] } }).sort({ createdAt: 1 }).toArray();
  summary.scanned.purchases = orders.length;
  for (const tx of orders) {
    await writeAll(purchaseEntries({
      userId: tx.distributorId, orderId: String(tx._id), paymentId: tx.razorpayPaymentId, packageId: tx.packageId || 'unknown',
      priceInr: Number(tx.priceAtPurchase ?? tx.priceAtQuote ?? Number(tx.amount || 0) / 100),
      bv: Number(tx.bvAtPurchase ?? tx.bvAtQuote ?? 0), rate: tx.rateAtPurchase ?? tx.rateAtQuote, at: tx.capturedAt || tx.createdAt,
    }));
  }

  // 2. Credited commissions (direct sponsor and matching).
  const commissions = await db.collection('commissions').find({ status: 'credited' }).sort({ createdAt: 1 }).toArray();
  summary.scanned.commissions = commissions.length;
  for (const c of commissions) {
    const bv = Number(c.bvAmount ?? c.bv ?? 0), rate = Number(c.rateAtEarn ?? c.commissionRate ?? 1);
    const amountInr = Number(c.commissionAmount ?? bv * rate);
    if (c.commissionType === 'matching') {
      await write(matchingCommissionEntry({ beneficiaryId: c.beneficiaryId, commissionKey: c.commissionKey, bv, rate, amountInr, matchedBv: Number(c.matchedLeftBv || 0) + Number(c.matchedRightBv || 0), sourceUserIds: c.sourceUserIds || [], at: c.createdAt }));
    } else {
      await write(directCommissionEntry({ beneficiaryId: c.beneficiaryId, buyerId: c.sourceUserId, commissionKey: c.commissionKey, bv, rate, amountInr, packageId: c.packageId || 'unknown', orderId: c.paymentOrderId || '', at: c.createdAt }));
    }
  }

  // 3. BV to INR conversions.
  const conversions = await db.collection('conversions').find({}).sort({ createdAt: 1 }).toArray();
  summary.scanned.conversions = conversions.length;
  for (const c of conversions) await writeAll(conversionEntries({ userId: c.userId, conversionId: String(c._id), bv: Number(c.bvAmount), rate: Number(c.rate), rupees: Number(c.rupeeAmount), at: c.createdAt }));

  // 4. Withdrawals: the debit, plus a refund row when it failed or was rejected.
  const withdrawals = await db.collection('withdrawals').find({}).sort({ createdAt: 1 }).toArray();
  summary.scanned.withdrawals = withdrawals.length;
  for (const w of withdrawals) {
    const refunded = ['failed', 'rejected'].includes(w.status);
    const status = w.status === 'paid' ? 'completed' : refunded ? 'failed' : 'pending';
    await write(withdrawalEntry({ userId: w.userId, withdrawalId: String(w._id), amount: Number(w.amount), upi: w.accountDetails?.upi, status, payoutId: w.payoutId, at: w.createdAt }));
    if (refunded) await write(withdrawalRefundEntry({ userId: w.userId, withdrawalId: String(w._id), amount: Number(w.amount), reason: w.status, at: w.failedAt || w.reviewedAt || w.createdAt }));
  }

  console.log(JSON.stringify({ dryRun, database: dbName, ...summary }, null, 2));
} finally { await client.close(); }
