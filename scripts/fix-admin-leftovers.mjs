// One-off cleanup of leftovers the tree reset missed: the Admin's stale KYC submission(s) and leftover purchased BV.
//   node scripts/fix-admin-leftovers.mjs          # dry run
//   node scripts/fix-admin-leftovers.mjs --apply  # writes the changes
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const apply = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas_prosperity_hub';
if (!uri) throw new Error('MONGODB_URI or MONGO_URI is required.');
const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const admins = await db.collection('distributors').find({ rank: 'Admin' }).toArray();
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${admins.length} admin(s) found.`);
  for (const admin of admins) {
    const kyc = await db.collection('kycSubmissions').find({ distributorId: admin.uid }).toArray();
    console.log(`  ${admin.name} (${admin.uid}): ${kyc.length} own KYC submission(s) [${kyc.map((k) => k.status).join(', ')}], bvBalance=${admin.bvBalance || 0}, incentiveBalance=${admin.incentiveBalance || 0}`);
    const paid = await db.collection('transactions').countDocuments({ distributorId: admin.uid, status: 'paid' });
    if (paid) console.log(`  note: ${paid} paid transaction(s) exist for this admin; bvBalance is left untouched.`);
    if (!apply) continue;
    if (kyc.length) await db.collection('kycSubmissions').deleteMany({ distributorId: admin.uid });
    if (!paid && (admin.bvBalance || admin.incentiveBalance)) await db.collection('distributors').updateOne({ _id: admin._id }, { $set: { bvBalance: 0, incentiveBalance: 0, updatedAt: new Date() } });
  }
  if (!apply) console.log('Nothing written. Re-run with --apply to update.');
} finally {
  await client.close();
}
