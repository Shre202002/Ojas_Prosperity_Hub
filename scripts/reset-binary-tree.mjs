// Wipes every member except the Admin so the binary tree starts fresh.
// Dry run by default: `node scripts/reset-binary-tree.mjs`
// Execute:            `node scripts/reset-binary-tree.mjs --confirm`
// Also wipe payments: add `--include-payments` (transactions, companyLedger, walletBvAudit).
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas_prosperity_hub';
if (!uri) throw new Error('MONGODB_URI or MONGO_URI is required.');
const confirm = process.argv.includes('--confirm');
const includePayments = process.argv.includes('--include-payments');

const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const admins = await db.collection('distributors').find({ rank: 'Admin' }).toArray();
  if (admins.length !== 1) throw new Error(`Expected exactly one Admin distributor, found ${admins.length}. Aborting.`);
  const admin = admins[0];
  const keep = { uid: { $ne: admin.uid } };
  const plan = [
    ['distributors', keep],
    ['users', keep],
    ['sessions', keep],
    ['referralCodes', { ownerId: { $ne: admin.uid } }],
    ['kycSubmissions', {}],
    ['matchingLots', {}],
    ['matchingLotAudit', {}],
    ['commissions', {}],
    ['conversions', {}],
    ['withdrawals', {}],
    ['passwordResets', {}],
    ['pendingEnrollments', {}],
    ...(includePayments ? [['transactions', {}], ['companyLedger', {}], ['walletBvAudit', {}]] : []),
  ];
  console.log(`${confirm ? 'RESETTING' : 'DRY RUN'} database "${dbName}", keeping Admin ${admin.email} (${admin.uid})`);
  for (const [name, filter] of plan) {
    const count = await db.collection(name).countDocuments(filter);
    if (confirm && count) await db.collection(name).deleteMany(filter);
    console.log(`  ${name}: ${count} ${confirm ? 'deleted' : 'would be deleted'}`);
  }
  if (!includePayments) console.log('  transactions, companyLedger, walletBvAudit: kept (pass --include-payments to wipe)');
  if (confirm) {
    await db.collection('distributors').updateOne({ uid: admin.uid }, { $set: { leftChildId: null, rightChildId: null, leftCount: 0, rightCount: 0, leftBV: 0, rightBV: 0, commissionBvBalance: 0, bvBalance: 0, incentiveBalance: 0, convertedIncentiveBalance: 0, shoppingBalance: 0, parentId: null, position: null, leg: null, sponsorId: null, updatedAt: new Date() } });
    console.log('  Admin tree slots and balances reset.');
  } else {
    console.log('Nothing changed. Re-run with --confirm to apply.');
  }
} finally {
  await client.close();
}
