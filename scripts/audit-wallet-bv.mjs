import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas';
if (!uri) throw new Error('MONGODB_URI or MONGO_URI is required.');
const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const distributors = await db.collection('distributors').find({}).toArray();
  const commissions = db.collection('commissions');
  const conversions = db.collection('conversions');
  const audit = db.collection('walletBvAudit');
  await audit.createIndex({ userId: 1 }, { unique: true });
  await audit.createIndex({ reviewStatus: 1, createdAt: -1 });
  let written = 0;
  for (const user of distributors) {
    const credited = await commissions.aggregate([
      { $match: { beneficiaryId: user.uid, status: 'credited' } },
      { $group: { _id: null, bv: { $sum: { $ifNull: ['$bvAmount', '$bv'] } } } },
    ]).toArray();
    const converted = await conversions.aggregate([
      { $match: { userId: user.uid } },
      { $group: { _id: null, bv: { $sum: '$bvAmount' } } },
    ]).toArray();
    const creditedCommissionBv = Number(credited[0]?.bv || 0);
    const historicalConvertedBv = Number(converted[0]?.bv || 0);
    const identifiableCommissionConversionBv = Math.min(creditedCommissionBv, historicalConvertedBv);
    await audit.updateOne({ userId: user.uid }, { $set: {
      userId: user.uid,
      creditedCommissionBv,
      historicalConvertedBv,
      identifiableCommissionConversionBv,
      ambiguousConvertedBv: Math.max(0, historicalConvertedBv - identifiableCommissionConversionBv),
      reviewStatus: 'pending',
      updatedAt: new Date(),
    }, $setOnInsert: { createdAt: new Date() } }, { upsert: true });
    written++;
  }
  console.log(JSON.stringify({ usersAudited: written, collection: 'walletBvAudit', reviewStatus: 'pending' }, null, 2));
} finally { await client.close(); }
