import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getMongoClient, getMongoDb } from '@/lib/mongodb';
import { requireUser } from '@/lib/server-auth';
import { getPackageConfig } from '@/lib/package-config';
import { appendCompanyLedger } from '@/lib/company-ledger';
import { createMatchingLots } from '@/lib/matching';

export const runtime = 'nodejs';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const superAdminEmail = () => String(process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
const makeCode = (prefix: string) => `${prefix}-${Array.from(randomBytes(7), b => ALPHABET[b % ALPHABET.length]).join('')}`;

export async function POST(request: NextRequest) {
  try {
    const token = await requireUser(request);
    const body = await request.json();
    const uid = token.uid;
    const email = String(token.email || '').trim().toLowerCase();
    const packageId = typeof body.packageId === 'string' ? body.packageId : '';
    const paymentOrderId = typeof body.paymentOrderId === 'string' ? body.paymentOrderId : '';
    const registrationType = body.registrationType === 'admin' ? 'admin' : body.registrationType === 'individual' ? 'individual' : 'referral';
    const isAdminRegistration = registrationType === 'admin';
    const packageInfo = isAdminRegistration ? null : await getPackageConfig(packageId);
    if (isAdminRegistration && email !== superAdminEmail()) throw new Error('Administrator access is restricted to the configured Super Admin email.');
    const db = await getMongoDb();
    const session = (await getMongoClient()).startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const distributors = db.collection('distributors');
        const existing = await distributors.findOne({ uid }, { session });
        if (existing) {
          if (isAdminRegistration) {
            await distributors.updateOne({ uid }, { $set: { rank: 'Admin', kycStatus: 'verified', status: 'active', registrationType: 'admin' } }, { session });
            await db.collection('users').updateOne({ uid }, { $set: { role: 'admin', email } }, { session });
          }
          result = { uid, leftReferralCode: existing.leftReferralCode, rightReferralCode: existing.rightReferralCode, alreadyProvisioned: true };
          return;
        }
        if (!email) throw new Error('An authenticated email is required.');
        if (!isAdminRegistration && !packageInfo) throw new Error('A valid package is required.');
        if (!isAdminRegistration) {
          if (!paymentOrderId) throw new Error('A verified payment is required.');
          const payment = await db.collection('transactions').findOne({ _id: paymentOrderId }, { session });
          if (!payment || payment.status !== 'paid') throw new Error('Payment has not been verified.');
          if (!packageInfo || payment.packageId !== packageId) throw new Error('Payment package does not match registration.');
          if (payment.distributorId && payment.distributorId !== uid) throw new Error('Payment is already linked to another account.');
        }
        let sponsorId = null, parentId = null, position = null;
        const path = [];
        if (registrationType === 'referral' && String(body.sponsorCode || '').trim()) {
          const referral = await db.collection('referralCodes').findOne({ code: String(body.sponsorCode || '').trim().toUpperCase() }, { session });
          if (!referral?.ownerId || !['left', 'right'].includes(referral.position)) throw new Error('Referral code not found.');
          const sponsor = await distributors.findOne({ uid: referral.ownerId }, { session });
          if (!sponsor || (sponsor.rank !== 'Admin' && sponsor.kycStatus !== 'verified')) throw new Error('This sponsor must complete KYC before referring new members.');
          sponsorId = referral.ownerId; position = referral.position;
          let candidateId = sponsorId;
          while (candidateId) {
            const candidate = await distributors.findOne({ uid: candidateId }, { session });
            if (!candidate) throw new Error('Sponsor profile not found.');
            path.push(candidateId);
            const child = candidate[`${position}ChildId`];
            if (!child) { parentId = candidateId; break; }
            candidateId = child;
          }
          if (!parentId) throw new Error('No available placement slot was found.');
        } else {
          const admin = await db.collection('distributors').findOne({ $or: [{ rank: 'Admin' }, { email: superAdminEmail() }] }, { session });
          if (!admin) throw new Error('Super Admin profile is not configured.');
          sponsorId = admin.uid;
          position = (admin.leftBV || 0) <= (admin.rightBV || 0) ? 'left' : 'right';
          let candidateId = sponsorId;
          while (candidateId) {
            const candidate = await distributors.findOne({ uid: candidateId }, { session });
            if (!candidate) throw new Error('Super Admin placement profile not found.');
            path.push(candidateId);
            const child = candidate[`${position}ChildId`];
            if (!child) { parentId = candidateId; break; }
            candidateId = child;
          }
          if (!parentId) throw new Error('No available Admin placement slot was found.');
        }
        const leftReferralCode = makeCode('OJAS-L'), rightReferralCode = makeCode('OJAS-R'), now = new Date();
        const distributor = { uid, name: String(body.name || token.name || 'Ojas Member').trim(), email, phone: String(body.phone || '').trim(), leftReferralCode, rightReferralCode, sponsorId, parentId, position, treeRootId: sponsorId || uid, leftChildId: null, rightChildId: null, packageId: isAdminRegistration ? 'admin' : packageId, rank: isAdminRegistration ? 'Admin' : 'Distributor', kycStatus: isAdminRegistration ? 'verified' : 'none', leftCount: 0, rightCount: 0, leftBV: 0, rightBV: 0, bvBalance: isAdminRegistration ? 0 : packageInfo!.bv, commissionBvBalance: 0, convertedIncentiveBalance: 0, shoppingBalance: 0, status: 'active', registrationType, enrollmentType: 'self', createdAt: now };
        await distributors.insertOne(distributor, { session });
        await db.collection('users').updateOne({ uid }, { $set: { uid, name: distributor.name, email, role: isAdminRegistration ? 'admin' : 'user', createdAt: now } }, { upsert: true, session });
        await db.collection('referralCodes').insertMany([{ code: leftReferralCode, ownerId: uid, ownerName: distributor.name, ownerKycStatus: 'none', ownerRank: 'Distributor', treeRootId: distributor.treeRootId, position: 'left' }, { code: rightReferralCode, ownerId: uid, ownerName: distributor.name, ownerKycStatus: 'none', ownerRank: 'Distributor', treeRootId: distributor.treeRootId, position: 'right' }], { session });
        if (!isAdminRegistration) await db.collection('transactions').updateOne({ _id: paymentOrderId, distributorId: { $in: [null, uid] } }, { $set: { distributorId: uid, updatedAt: now } }, { session });
        if (parentId && position) {
          const update = await distributors.updateOne({ uid: parentId, [`${position}ChildId`]: { $in: [null, undefined] } }, { $set: { [`${position}ChildId`]: uid }, $inc: { [`${position}Count`]: 1, [`${position}BV`]: packageInfo!.bv } }, { session });
          if (!update.modifiedCount) throw new Error('Placement slot is no longer available.');
          for (const ancestor of path.filter(id => id !== parentId)) await distributors.updateOne({ uid: ancestor }, { $inc: { [`${position}Count`]: 1, [`${position}BV`]: packageInfo!.bv } }, { session });
          await createMatchingLots({ db, session, ownerIds: path, side: position, sourceUserId: uid, sourceTransactionId: paymentOrderId, packageId, bvAmount: packageInfo!.bv, createdAt: now });
        }
        if (!isAdminRegistration && sponsorId) {
          const commissionKey = `${paymentOrderId}:direct-sponsor`;
          const existingCommission = await db.collection('commissions').findOne({ commissionKey }, { session });
          if (!existingCommission) {
            const commissionBV = packageInfo!.bv * 0.1;
            const rateAtEarn = Number(packageInfo!.bvRate || 1);
            const commissionAmount = commissionBV * rateAtEarn;
            await db.collection('distributors').updateOne({ uid: sponsorId }, { $inc: { commissionBvBalance: commissionBV }, $set: { updatedAt: now } }, { session });
            await db.collection('commissions').insertOne({ commissionKey, commissionType: 'direct_sponsor', beneficiaryId: sponsorId, sourceUserId: uid, paymentOrderId, packageId, bv: commissionBV, bvAmount: commissionBV, commissionRate: 0.1, rateAtEarn, commissionAmount, status: 'credited', createdAt: now }, { session });
            await appendCompanyLedger({ entryType: 'commission_payout', direction: 'debit', amount: commissionAmount, referenceCollection: 'commissions', referenceId: commissionKey, userId: sponsorId, packageId, bv: commissionBV, description: `Commission payout for ${packageId}` }, session);
          }
        }
        result = { uid, leftReferralCode, rightReferralCode, alreadyProvisioned: false };
      });
      return NextResponse.json(result);
    } finally { await session.endSession(); }
  } catch (error: any) {
    const message = error?.message || 'Could not provision the network member.';
    return NextResponse.json({ error: message }, { status: message.includes('Authentication') ? 401 : message.includes('required') || message.includes('not found') || message.includes('verified') || message.includes('match') || message.includes('linked') ? 400 : 500 });
  }
}
