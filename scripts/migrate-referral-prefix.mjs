// Renames legacy referral codes (OJAS-L-XXXXXXX / OJAS-R-XXXXXXX) to the new brand prefix (SJAPL-L-… / SJAPL-R-…),
// keeping the random part so each member's code stays recognisable.
//   node scripts/migrate-referral-prefix.mjs          # dry run, prints what would change
//   node scripts/migrate-referral-prefix.mjs --apply  # writes the changes
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const apply = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas_prosperity_hub';
if (!uri) throw new Error('MONGODB_URI or MONGO_URI is required.');
const OLD = /^OJAS-/i;
const next = (code) => String(code).replace(OLD, 'SJAPL-');

const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const codes = db.collection('referralCodes');
  const distributors = db.collection('distributors');
  const legacyCodes = await codes.find({ code: OLD }).toArray();
  const legacyMembers = await distributors.find({ $or: [{ leftReferralCode: OLD }, { rightReferralCode: OLD }] }).toArray();
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}: ${legacyCodes.length} referralCodes and ${legacyMembers.length} distributors use the old prefix.`);

  for (const c of legacyCodes) {
    if (await codes.findOne({ code: next(c.code) })) throw new Error(`Collision: ${next(c.code)} already exists.`);
  }
  for (const c of legacyCodes) {
    console.log(`  code ${c.code} -> ${next(c.code)}`);
    if (apply) await codes.updateOne({ _id: c._id }, { $set: { code: next(c.code) } });
  }
  for (const d of legacyMembers) {
    const set = {};
    if (OLD.test(d.leftReferralCode || '')) set.leftReferralCode = next(d.leftReferralCode);
    if (OLD.test(d.rightReferralCode || '')) set.rightReferralCode = next(d.rightReferralCode);
    console.log(`  member ${d.uid}:`, set);
    if (apply) await distributors.updateOne({ _id: d._id }, { $set: set });
  }
  if (!apply) console.log('Nothing written. Re-run with --apply to update.');
} finally {
  await client.close();
}
