import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas_prosperity_hub';
if (!uri) throw new Error('MONGODB_URI or MONGO_URI is required.');
const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const transactions = await db.collection('transactions').find({ status: 'paid' }).sort({ createdAt: 1 }).toArray();
  const distributors = db.collection('distributors');
  const lots = db.collection('matchingLots');
  const audit = db.collection('matchingLotAudit');
  await lots.createIndex({ ownerId: 1, sourceTransactionId: 1, side: 1 }, { unique: true });
  await audit.createIndex({ sourceTransactionId: 1 }, { unique: true });
  let created = 0;
  let unresolved = 0;
  for (const transaction of transactions) {
    const sourceUserId = String(transaction.distributorId || '');
    const sourceTransactionId = String(transaction._id || transaction.id || '');
    const bvAmount = Number(transaction.bvAtPurchase || transaction.bvAtQuote || 0);
    const user = sourceUserId ? await distributors.findOne({ uid: sourceUserId }) : null;
    if (!sourceUserId || !user || !sourceTransactionId || !Number.isFinite(bvAmount) || bvAmount <= 0) {
      unresolved++;
      await audit.updateOne({ sourceTransactionId }, { $set: { sourceTransactionId, userId: sourceUserId || null, reason: 'Missing distributor, transaction reference, or BV amount', reviewStatus: 'pending', updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
      continue;
    }
    const ancestors = [];
    let current = user;
    while (current?.parentId && current.position && ['left', 'right'].includes(current.position)) {
      ancestors.push({ ownerId: String(current.parentId), side: current.position });
      current = await distributors.findOne({ uid: current.parentId });
    }
    if (!ancestors.length) continue;
    for (const { ownerId, side } of ancestors) {
      const result = await lots.updateOne({ ownerId, sourceTransactionId, side }, { $setOnInsert: { ownerId, side, sourceUserId, sourceTransactionId, packageId: transaction.packageId || 'legacy', bvAmount, status: 'available', legacy: true, createdAt: transaction.createdAt || new Date() } }, { upsert: true });
      if (result.upsertedCount) created++;
    }
  }
  console.log(JSON.stringify({ paidTransactionsScanned: transactions.length, lotsCreated: created, unresolvedTransactions: unresolved, auditCollection: 'matchingLotAudit' }, null, 2));
} finally { await client.close(); }
