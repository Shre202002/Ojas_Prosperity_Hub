import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'ojas_prosperity_hub';
if (!uri) throw new Error('MONGODB_URI is required.');
const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName); const ledger = db.collection('companyLedger');
  await ledger.createIndex({ referenceCollection: 1, referenceId: 1 }, { unique: true });
  await ledger.createIndex({ createdAt: -1 }); await ledger.createIndex({ userId: 1, createdAt: -1 }); await ledger.createIndex({ entryType: 1, createdAt: -1 });
  const latest = await ledger.findOne({}, { sort: { createdAt: -1, _id: -1 } });
  let balance = Number(latest?.balanceAfter || 0), purchases = 0, commissions = 0;
  const write = async (entry) => { if (await ledger.findOne({ referenceCollection: entry.referenceCollection, referenceId: entry.referenceId })) return; balance = Math.round((balance + (entry.direction === 'credit' ? entry.amount : -entry.amount)) * 100) / 100; await ledger.insertOne({ ...entry, balanceAfter: balance, createdAt: entry.createdAt || new Date() }); };
  const txs = await db.collection('transactions').find({ status: 'paid' }).sort({ createdAt: 1 }).toArray();
  for (const tx of txs) { await write({ entryType: 'purchase_revenue', direction: 'credit', amount: Number(tx.priceAtPurchase ?? tx.amount) / (tx.priceAtPurchase !== undefined ? 1 : 100), referenceCollection: 'transactions', referenceId: String(tx._id || tx.id), userId: String(tx.distributorId || tx.enrolledBy || ''), packageId: tx.packageId || null, bv: tx.bvAtPurchase || null, description: `Purchase: ${tx.packageId || 'package'}`, createdAt: tx.createdAt }); purchases++; }
  const cms = await db.collection('commissions').find({ status: 'credited' }).sort({ createdAt: 1 }).toArray();
  for (const commission of cms) { const amount = Number(commission.commissionAmount ?? ((commission.bvAmount ?? commission.bv ?? 0) * (commission.commissionRate ?? 0.1))); await write({ entryType: 'commission_payout', direction: 'debit', amount, referenceCollection: 'commissions', referenceId: String(commission._id || commission.commissionKey), userId: String(commission.beneficiaryId || ''), packageId: commission.packageId || null, bv: commission.bvAmount ?? commission.bv ?? null, description: `Commission payout for ${commission.packageId || 'package'}`, createdAt: commission.createdAt }); commissions++; }
  console.log(JSON.stringify({ paidTransactionsScanned: txs.length, commissionsScanned: cms.length, purchaseEntriesConsidered: purchases, commissionEntriesConsidered: commissions, finalComputedBalance: balance }, null, 2));
} finally { await client.close(); }
