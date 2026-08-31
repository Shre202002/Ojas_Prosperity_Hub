import { ObjectId, type Document } from 'mongodb';
import { collection, getMongoDb } from './mongodb';

export type Distributor = Document & { uid: string; email: string; rank?: string; sponsorId?: string | null; parentId?: string | null };

export async function ensureMongoIndexes() {
  const db = await getMongoDb();
  await Promise.all([
    db.collection('distributors').createIndex({ uid: 1 }, { unique: true }),
    db.collection('distributors').createIndex({ sponsorId: 1 }),
    db.collection('distributors').createIndex({ parentId: 1 }),
    db.collection('referralCodes').createIndex({ code: 1 }, { unique: true }),
    db.collection('products').createIndex({ sku: 1 }, { unique: true, sparse: true }),
    db.collection('products').createIndex({ status: 1, createdAt: -1 }),
    db.collection('transactions').createIndex({ distributorId: 1, createdAt: -1 }),
    db.collection('transactions').createIndex({ status: 1, createdAt: -1 }),
    db.collection('transactions').createIndex({ packageId: 1, status: 1 }),
    db.collection('transactions').createIndex({ createdAt: -1, status: 1 }),
    db.collection('packages').createIndex({ id: 1 }, { unique: true }),
    db.collection('packages').createIndex({ active: 1, bv: 1 }),
    db.collection('packages').createIndex({ bv: 1 }),
    db.collection('bv_rate').createIndex({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } }),
    db.collection('bv_rate').createIndex({ effectiveFrom: -1 }),
    db.collection('commissions').createIndex({ commissionKey: 1 }, { unique: true }),
    db.collection('commissions').createIndex({ beneficiaryId: 1, status: 1, createdAt: -1 }),
    db.collection('commissions').createIndex({ sourceUserId: 1, status: 1, createdAt: -1 }),
    db.collection('commissions').createIndex({ commissionType: 1, beneficiaryId: 1, status: 1, createdAt: -1 }),
    db.collection('commissions').createIndex({ createdAt: -1, status: 1 }),
    db.collection('settings').createIndex({ _id: 1 }, { unique: true }),
    db.collection('conversions').createIndex({ userId: 1, source: 1, createdAt: -1 }),
    db.collection('withdrawals').createIndex({ userId: 1, status: 1, createdAt: -1 }),
    db.collection('matchingLots').createIndex({ ownerId: 1, sourceTransactionId: 1, side: 1 }, { unique: true }),
    db.collection('matchingLots').createIndex({ ownerId: 1, side: 1, status: 1, createdAt: 1 }),
    db.collection('matchingLots').createIndex({ sourceTransactionId: 1 }),
    db.collection('withdrawals').createIndex({ status: 1, createdAt: -1 }),
    db.collection('companyLedger').createIndex({ referenceCollection: 1, referenceId: 1 }, { unique: true }),
    db.collection('companyLedger').createIndex({ createdAt: -1 }),
    db.collection('companyLedger').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('companyLedger').createIndex({ entryType: 1, createdAt: -1 }),
    db.collection('kycSubmissions').createIndex({ distributorId: 1, submittedAt: -1 }),
    db.collection('kycSubmissions').createIndex({ sponsorId: 1, submittedAt: -1 }),
    db.collection('pendingEnrollments').createIndex({ email: 1 }, { unique: true }),
  ]);
}

export async function findDistributor(uid: string) {
  return (await collection<Distributor>('distributors')).findOne({ uid });
}

export async function listDistributors(filter: Document = {}, limit = 500) {
  return (await collection<Distributor>('distributors')).find(filter).limit(limit).toArray();
}

export async function listProducts(filter: Document = {}) {
  return (await collection('products')).find(filter).sort({ createdAt: -1 }).toArray();
}

export function asObjectId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}
