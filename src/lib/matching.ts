import type { ClientSession, Db, ObjectId } from 'mongodb';
import { ObjectId as MongoObjectId } from 'mongodb';
import { getActiveBvRate } from './package-config';
import { appendCompanyLedger } from './company-ledger';

export const MATCHING_RATE = 0.15;
export type MatchingSide = 'left' | 'right';

export type MatchingLot = {
  _id: ObjectId;
  ownerId: string;
  side: MatchingSide;
  sourceUserId: string;
  sourceTransactionId: string;
  packageId: string;
  bvAmount: number;
  status: 'available' | 'consumed';
  createdAt: Date;
  consumedAt?: Date;
  matchingId?: string;
};

export async function createMatchingLots({ db, session, ownerIds, side, sourceUserId, sourceTransactionId, packageId, bvAmount, createdAt }: {
  db: Db; session: ClientSession; ownerIds: string[]; side: MatchingSide; sourceUserId: string; sourceTransactionId: string; packageId: string; bvAmount: number; createdAt: Date;
}) {
  const lots = db.collection<MatchingLot>('matchingLots');
  for (const ownerId of [...new Set(ownerIds)]) {
    await lots.updateOne(
      { ownerId, sourceTransactionId, side },
      { $setOnInsert: { ownerId, side, sourceUserId, sourceTransactionId, packageId, bvAmount, status: 'available', createdAt } },
      { upsert: true, session },
    );
  }
}

export function parseLotIds(values: unknown) {
  if (!Array.isArray(values) || values.length === 0 || values.length > 100) throw new Error('Select at least one and no more than 100 lots per side.');
  const ids = values.map(value => String(value));
  if (ids.some(id => !MongoObjectId.isValid(id)) || new Set(ids).size !== ids.length) throw new Error('Invalid or duplicate matching lot selection.');
  return ids.map(id => new MongoObjectId(id));
}

export async function createMatchingCommission({ db, session, beneficiaryId, leftLotIds, rightLotIds }: {
  db: Db; session: ClientSession; beneficiaryId: string; leftLotIds: ObjectId[]; rightLotIds: ObjectId[];
}) {
  const lots = db.collection<MatchingLot>('matchingLots');
  const allIds = [...leftLotIds, ...rightLotIds];
  const selected = await lots.find({ _id: { $in: allIds }, ownerId: beneficiaryId, status: 'available' }, { session }).toArray();
  if (selected.length !== allIds.length) throw new Error('One or more selected lots are unavailable or do not belong to you.');
  const left = selected.filter(lot => leftLotIds.some(id => id.equals(lot._id)));
  const right = selected.filter(lot => rightLotIds.some(id => id.equals(lot._id)));
  const leftBv = left.reduce((sum, lot) => sum + Number(lot.bvAmount || 0), 0);
  const rightBv = right.reduce((sum, lot) => sum + Number(lot.bvAmount || 0), 0);
  if (!leftBv || Math.abs(leftBv - rightBv) > 0.000001) throw new Error('Selected left and right lots must have exactly equal BV. Packages cannot be split.');
  const matchingId = `matching:${beneficiaryId}:${allIds.map(id => id.toHexString()).sort().join(',')}`;
  const existing = await db.collection('commissions').findOne({ commissionKey: matchingId }, { session });
  if (existing) return existing;
  const now = new Date();
  const consumed = await lots.updateMany({ _id: { $in: allIds }, ownerId: beneficiaryId, status: 'available' }, { $set: { status: 'consumed', consumedAt: now, matchingId } }, { session });
  if (consumed.modifiedCount !== allIds.length) throw new Error('Matching lots changed. Please refresh and retry.');
  const rateRecord = await getActiveBvRate();
  const rateAtEarn = Number(rateRecord.rate);
  const matchedBv = leftBv + rightBv;
  const commissionAmount = matchedBv * MATCHING_RATE * rateAtEarn;
  const sourceUserIds = [...new Set(selected.map(lot => lot.sourceUserId))];
  await db.collection('distributors').updateOne({ uid: beneficiaryId }, { $inc: { commissionBvBalance: matchedBv * MATCHING_RATE }, $set: { updatedAt: now } }, { session });
  const commission = { commissionKey: matchingId, commissionType: 'matching', matchingId, beneficiaryId, sourceUserIds, leftLotIds: leftLotIds.map(id => id.toHexString()), rightLotIds: rightLotIds.map(id => id.toHexString()), matchedLeftBv: leftBv, matchedRightBv: rightBv, bvAmount: matchedBv * MATCHING_RATE, commissionRate: MATCHING_RATE, rateAtEarn, commissionAmount, status: 'credited', createdAt: now };
  await db.collection('commissions').insertOne(commission, { session });
  await appendCompanyLedger({ entryType: 'commission_payout', direction: 'debit', amount: commissionAmount, referenceCollection: 'commissions', referenceId: matchingId, userId: beneficiaryId, bv: commission.bvAmount, description: `Matching bonus for ${matchedBv} BV` }, session);
  return commission;
}
