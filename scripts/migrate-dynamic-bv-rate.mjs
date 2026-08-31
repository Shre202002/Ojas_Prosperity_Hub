import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'ojas_prosperity_hub';
if (!uri) throw new Error('MONGODB_URI is required.');

const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const packages = db.collection('packages');
  const settings = db.collection('settings');
  const rates = db.collection('bv_rate');
  await rates.createIndex({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });
  await rates.createIndex({ effectiveFrom: -1 });

  const before = await packages.countDocuments();
  const withPrice = await packages.countDocuments({ price: { $exists: true } });
  const existing = await rates.findOne({ isActive: true });
  if (!existing) {
    const legacy = await settings.findOne({ _id: 'platform' });
    const configured = Number(legacy?.bvRate || process.env.INITIAL_BV_RATE);
    if (!Number.isFinite(configured) || configured <= 0) throw new Error('No active rate found. Set INITIAL_BV_RATE explicitly.');
    await rates.insertOne({ rate: configured, currency: 'INR', isActive: true, effectiveFrom: new Date(), effectiveTo: null, updatedBy: 'migration', createdAt: new Date() });
    console.log(`Created initial active BV rate: ${configured} INR/BV`);
  } else console.log(`Existing active BV rate preserved: ${existing.rate} INR/BV`);
  const result = await packages.updateMany({ price: { $exists: true } }, { $unset: { price: '' } });
  console.log(JSON.stringify({ packagesBefore: before, packagesWithPriceBefore: withPrice, pricesRemoved: result.modifiedCount, packagesAfter: await packages.countDocuments(), packagesWithPriceAfter: await packages.countDocuments({ price: { $exists: true } }) }, null, 2));
} finally { await client.close(); }
