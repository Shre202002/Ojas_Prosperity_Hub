// Moves KYC documents that were uploaded as PUBLIC ImageKit files (old records) into private storage, so their old
// public links stop working. Each file is downloaded, re-uploaded as private, the record is updated, and the old file deleted.
// Dry run by default: `node scripts/privatize-kyc-files.mjs`
// Execute:            `node scripts/privatize-kyc-files.mjs --confirm`
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas_prosperity_hub';
const key = process.env.Imagekit_PRIVATE_KEY;
if (!uri) throw new Error('MONGODB_URI or MONGO_URI is required.');
if (!key) throw new Error('Imagekit_PRIVATE_KEY is required.');
const confirm = process.argv.includes('--confirm');
const auth = `Basic ${Buffer.from(`${key}:`).toString('base64')}`;
const TYPES = ['idProof', 'addressProof', 'selfie'];

const client = new MongoClient(uri);
await client.connect();
try {
  const db = client.db(dbName);
  const submissions = await db.collection('kycSubmissions').find({}).toArray();
  let todo = 0, moved = 0, failed = 0;
  for (const sub of submissions) {
    for (const type of TYPES) {
      const doc = sub[type];
      if (!doc?.url || doc.path) continue; // already private (new records store `path`)
      todo += 1;
      console.log(`${confirm ? 'MOVE' : 'WOULD MOVE'}  ${sub.distributorId}  ${type}  ${doc.filename || ''}`);
      if (!confirm) continue;
      try {
        const download = await fetch(doc.url);
        if (!download.ok) throw new Error(`download ${download.status}`);
        const bytes = await download.arrayBuffer();
        const mime = download.headers.get('content-type') || 'application/octet-stream';
        const form = new FormData();
        form.append('file', new Blob([bytes], { type: mime }), doc.filename || `${type}`);
        form.append('fileName', `${sub.distributorId}-${type}-${Date.now()}-${doc.filename || type}`);
        form.append('folder', `/sjapl/kyc/${sub.distributorId}`);
        form.append('isPrivateFile', 'true');
        const up = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { Authorization: auth }, body: form });
        const result = await up.json();
        if (!up.ok) throw new Error(result.message || `upload ${up.status}`);
        const next = { url: result.url, fileId: result.fileId, path: result.filePath, filename: doc.filename || '', mime, size: bytes.byteLength };
        await db.collection('kycSubmissions').updateOne({ _id: sub._id }, { $set: { [type]: next } });
        if (doc.fileId) await fetch(`https://api.imagekit.io/v1/files/${doc.fileId}`, { method: 'DELETE', headers: { Authorization: auth } });
        moved += 1;
      } catch (error) {
        failed += 1;
        console.error(`  FAILED: ${error.message}`);
      }
    }
  }
  console.log(confirm ? `Done. Moved ${moved}, failed ${failed}, of ${todo}.` : `Dry run: ${todo} public file(s) would be moved. Re-run with --confirm.`);
} finally {
  await client.close();
}
