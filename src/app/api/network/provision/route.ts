import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getMongoClient, getMongoDb } from '@/lib/mongodb';
import { requireUser } from '@/lib/server-auth';
import { getPackageConfig } from '@/lib/package-config';
import { appendCompanyLedger } from '@/lib/company-ledger';
import { createMatchingLots } from '@/lib/matching';
import { hashPassword } from '@/lib/password-hash';
import { recordWalletTransaction, purchaseEntries, directCommissionEntry } from '@/lib/wallet-transactions';

export const runtime = 'nodejs';
// Errors that carry the HTTP status the caller should see (instead of guessing from the message text).
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const superAdminEmail = () => String(process.env.SUPER_ADMIN_EMAIL || process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase();
const makeCode = (prefix: string) => `${prefix}-${Array.from(randomBytes(7), b => ALPHABET[b % ALPHABET.length]).join('')}`;

export async function POST(request: NextRequest) {
  try {
    const token = await requireUser(request);
    const body = await request.json();
    // Admin-added member: the signed-in Admin registers someone else, so the new account gets its own uid/email.
    const isAdminAdded = body.registrationType === 'admin_added';
    if (isAdminAdded) {
      const adminUser: any = await (await getMongoDb()).collection('users').findOne({ uid: token.uid });
      const adminDist: any = await (await getMongoDb()).collection('distributors').findOne({ uid: token.uid });
      const callerIsAdmin = adminUser?.role === 'admin' || adminDist?.rank === 'Admin';
      if (!adminDist) throw new HttpError(400, 'Member profile not found.');
      if (!callerIsAdmin && adminDist.kycStatus !== 'verified') throw new HttpError(403, 'Complete KYC before adding members.');
      body.addedByRole = callerIsAdmin ? 'admin' : 'member';
      if (body.precheck) {
        // Run before payment so the Admin is never charged for a duplicate email/phone or a taken slot.
        const db0 = await getMongoDb(), em = String(body.email || '').trim().toLowerCase(), ph = String(body.phone || '').trim();
        if (!/^\S+@\S+\.\S+$/.test(em)) throw new HttpError(400, 'A valid email is required.');
        if (!/^\+\d{8,15}$/.test(ph)) throw new HttpError(400, 'A valid phone number is required.');
        if (await db0.collection('users').findOne({ email: em })) throw new HttpError(400, 'This email is already registered.');
        if (await db0.collection('distributors').findOne({ phone: ph })) throw new HttpError(400, 'This phone number is already registered.');
        const par: any = await db0.collection('distributors').findOne({ uid: String(body.parentId || '') });
        if (!par || !['left', 'right'].includes(body.side) || par[`${body.side}ChildId`]) throw new HttpError(400, 'That slot is not open.');
        return NextResponse.json({ ok: true });
      }
    }
    const uid = isAdminAdded ? randomBytes(16).toString('hex') : token.uid;
    const email = String(isAdminAdded ? body.email : token.email || '').trim().toLowerCase();
    const packageId = typeof body.packageId === 'string' ? body.packageId : '';
    const paymentOrderId = typeof body.paymentOrderId === 'string' ? body.paymentOrderId : '';
    const registrationType = isAdminAdded ? 'admin_added' : body.registrationType === 'admin' ? 'admin' : 'referral';
    const isAdminRegistration = registrationType === 'admin';
    const packageInfo = isAdminRegistration ? null : await getPackageConfig(packageId);
    if (isAdminRegistration && email !== superAdminEmail()) throw new HttpError(403, 'Administrator access is restricted to the configured Super Admin email.');
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
        if (isAdminAdded) {
          if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'A valid email is required.');
          if (String(body.password || '').length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
          if (await db.collection('users').findOne({ email }, { session })) throw new HttpError(400, 'This email is already registered.');
        }
        if (!isAdminRegistration && !packageInfo) throw new Error('A valid package is required.');
        let payment: any = null;
        if (!isAdminRegistration) {
          if (!paymentOrderId) throw new Error('A verified payment is required.');
          payment = await db.collection('transactions').findOne({ _id: paymentOrderId }, { session });
          if (!payment || payment.status !== 'paid') throw new Error('Payment has not been verified.');
          if (!packageInfo || payment.packageId !== packageId) throw new Error('Payment package does not match registration.');
          if (payment.distributorId && payment.distributorId !== uid) throw new Error('Payment is already linked to another account.');
          if (isAdminAdded && payment.enrolledBy !== token.uid) throw new HttpError(400, 'This payment was not made by you.');
        }
        let phoneVerifiedBy: 'sms' | 'email' | 'admin' | null = null;
        if (!isAdminRegistration) {
          const phone = String(body.phone || '').trim();
          if (!/^\+\d{8,15}$/.test(phone)) throw new HttpError(400, 'A valid phone number is required.');
          if (await distributors.findOne({ phone }, { session })) throw new HttpError(400, 'This phone number is already registered.');
          if (isAdminAdded) phoneVerifiedBy = 'admin' as any;
          else {
          const deleted: any = await db.collection('phoneVerifications').findOneAndDelete({ _id: phone as any, verified: true }, { session });
          const proof = deleted && ('value' in deleted ? deleted.value : deleted);
          if (!proof) throw new HttpError(400, 'Please verify your phone number first.');
          // An email-based fallback proof only counts for the same account email.
          if (proof.method === 'email' && String(proof.email || '').toLowerCase() !== email) throw new HttpError(400, 'Please verify your phone number first.');
          phoneVerifiedBy = proof.method === 'email' ? 'email' : 'sms';
          }
        }
        let sponsorId = null, parentId = null, position = null, leg = null, parent = null;
        if (isAdminAdded) {
          // Sponsor is the acting Admin; placement is the exact open slot the Admin clicked (any side of any member in their tree).
          const side = body.side === 'right' ? 'right' : body.side === 'left' ? 'left' : null;
          if (!side || typeof body.parentId !== 'string') throw new HttpError(400, 'A placement slot is required.');
          parent = await distributors.findOne({ uid: body.parentId }, { session });
          if (!parent) throw new HttpError(400, 'Placement member not found.');
          if (parent[`${side}ChildId`]) throw new HttpError(400, 'That slot is no longer open.');
          let up: any = parent, hops = 0;
          while (up && up.uid !== token.uid && up.parentId && hops++ < 5000) up = await distributors.findOne({ uid: up.parentId }, { session });
          if (!up || up.uid !== token.uid) throw new HttpError(400, 'Placement member is not in your tree.');
          sponsorId = token.uid; parentId = parent.uid; position = side; leg = parent.leg || side;
        } else if (!isAdminRegistration) {
          const referral = await db.collection('referralCodes').findOne({ code: String(body.sponsorCode || '').trim().toUpperCase().replace(/^OJAS-/, 'SJAPL-') }, { session });
          if (!referral?.ownerId || !['left', 'right'].includes(referral.position)) throw new Error('A valid referral code is required.');
          const sponsor = await distributors.findOne({ uid: referral.ownerId }, { session });
          if (!sponsor || (sponsor.rank !== 'Admin' && sponsor.kycStatus !== 'verified')) throw new HttpError(400, 'This sponsor must complete KYC before referring new members.');
          sponsorId = referral.ownerId; position = referral.position;
          // Admin may start placement from any member, but only inside the leg the referral code belongs to.
          let candidateId = sponsorId;
          const under = typeof body.placementUnder === 'string' ? body.placementUnder.trim() : '';
          if (under && under !== sponsorId) {
            const target = await distributors.findOne({ uid: under }, { session });
            if (sponsor.rank !== 'Admin' || !target || target.leg !== position) throw new Error('Placement member not found on this referral leg.');
            candidateId = under;
          }
          // Outer-leg spillover: left goes left-to-left, right goes right-to-right.
          while (candidateId) {
            const candidate = await distributors.findOne({ uid: candidateId }, { session });
            if (!candidate) throw new Error('Placement profile not found.');
            const child = candidate[`${position}ChildId`];
            if (!child) { parentId = candidateId; parent = candidate; break; }
            candidateId = child;
          }
          if (!parentId) throw new Error('No available placement slot was found.');
          leg = parent!.leg || position;
        }
        const leftReferralCode = makeCode('SJAPL-L'), rightReferralCode = makeCode('SJAPL-R'), now = new Date();
        const distributor = { uid, name: String(body.name || token.name || 'SJAPL Member').trim(), email, phone: String(body.phone || '').trim(), phoneVerifiedBy, leftReferralCode, rightReferralCode, sponsorId, parentId, position, leg, treeRootId: sponsorId || uid, leftChildId: null, rightChildId: null, packageId: isAdminRegistration ? 'admin' : packageId, rank: isAdminRegistration ? 'Admin' : 'Distributor', kycStatus: isAdminRegistration ? 'verified' : isAdminAdded ? 'pending' : 'none', leftCount: 0, rightCount: 0, leftBV: 0, rightBV: 0, bvBalance: isAdminRegistration ? 0 : packageInfo!.bv, commissionBvBalance: 0, convertedIncentiveBalance: 0, shoppingBalance: 0, status: 'active', registrationType, enrollmentType: isAdminAdded ? 'admin' : 'self', ...(isAdminAdded ? { addedBy: token.uid, addedByRole: body.addedByRole } : {}), createdAt: now };
        await distributors.insertOne(distributor, { session });
        if (isAdminAdded) await db.collection('users').insertOne({ uid, email, name: distributor.name, passwordHash: hashPassword(String(body.password)), role: 'user', createdAt: now, addedBy: token.uid }, { session });
        await db.collection('users').updateOne({ uid }, { $set: { uid, name: distributor.name, email, role: isAdminRegistration ? 'admin' : 'user', createdAt: now } }, { upsert: true, session });
        await db.collection('referralCodes').insertMany([{ code: leftReferralCode, ownerId: uid, ownerName: distributor.name, ownerKycStatus: distributor.kycStatus, ownerRank: distributor.rank, treeRootId: distributor.treeRootId, position: 'left' }, { code: rightReferralCode, ownerId: uid, ownerName: distributor.name, ownerKycStatus: distributor.kycStatus, ownerRank: distributor.rank, treeRootId: distributor.treeRootId, position: 'right' }], { session });
        if (!isAdminRegistration) {
          await db.collection('transactions').updateOne({ _id: paymentOrderId, distributorId: { $in: [null, uid] } }, { $set: { distributorId: uid, updatedAt: now } }, { session });
          for (const entry of purchaseEntries({ userId: uid, orderId: paymentOrderId, paymentId: payment?.razorpayPaymentId, packageId, priceInr: Number(payment?.priceAtPurchase ?? payment?.priceAtQuote ?? Number(payment?.amount || 0) / 100), bv: packageInfo!.bv, rate: payment?.rateAtPurchase ?? payment?.rateAtQuote, at: payment?.capturedAt || now })) await recordWalletTransaction(entry, session);
        }
        if (parentId && position) {
          const update = await distributors.updateOne({ uid: parentId, [`${position}ChildId`]: { $in: [null, undefined] } }, { $set: { [`${position}ChildId`]: uid }, $inc: { [`${position}Count`]: 1, [`${position}BV`]: packageInfo!.bv } }, { session });
          if (!update.modifiedCount) throw new Error('Placement slot is no longer available.');
          // Team counts and BV roll up the whole upline; each ancestor gets it on the side the branch hangs from.
          let node = parent;
          while (node?.parentId && node.position) {
            await distributors.updateOne({ uid: node.parentId }, { $inc: { [`${node.position}Count`]: 1, [`${node.position}BV`]: packageInfo!.bv } }, { session });
            node = await distributors.findOne({ uid: node.parentId }, { session });
          }
          // Matching income belongs to the immediate placement parent only.
          await createMatchingLots({ db, session, ownerIds: [parentId], side: position, sourceUserId: uid, sourceTransactionId: paymentOrderId, packageId, bvAmount: packageInfo!.bv, createdAt: now });
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
            await recordWalletTransaction(directCommissionEntry({ beneficiaryId: sponsorId, buyerId: uid, commissionKey, bv: commissionBV, rate: rateAtEarn, amountInr: commissionAmount, packageId, orderId: paymentOrderId, at: now }), session);
            await appendCompanyLedger({ entryType: 'commission_payout', direction: 'debit', amount: commissionAmount, referenceCollection: 'commissions', referenceId: commissionKey, userId: sponsorId, packageId, bv: commissionBV, description: `Commission payout for ${packageId}` }, session);
          }
        }
        result = { uid, leftReferralCode, rightReferralCode, alreadyProvisioned: false };
      });
      return NextResponse.json(result);
    } finally { await session.endSession(); }
  } catch (error: any) {
    const message = error?.message || 'Could not provision the network member.';
    if (error instanceof HttpError) return NextResponse.json({ error: message }, { status: error.status });
    return NextResponse.json({ error: message }, { status: message.includes('Authentication') ? 401 : message.includes('required') || message.includes('not found') || message.includes('verified') || message.includes('match') || message.includes('linked') ? 400 : 500 });
  }
}
