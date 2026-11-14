import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { collection, getMongoClient, getMongoDb } from '@/lib/mongodb';
import { uploadKycFile } from '@/lib/imagekit';
import { publicSubmission } from '@/lib/kyc-docs';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const db = await getMongoDb();
    const [distributors, users, submissions] = await Promise.all([
      db.collection('distributors').find({ rank: { $ne: 'Admin' } }).sort({ createdAt: -1 }).toArray(),
      db.collection('users').find({}, { projection: { passwordHash: 0 } }).toArray(),
      db.collection('kycSubmissions').find({}).sort({ submittedAt: -1 }).toArray(),
    ]);
    const userByUid = new Map((users as any[]).map(user => [user.uid, user]));
    const latest = new Map<string, any>();
    for (const submission of submissions as any[]) if (!latest.has(submission.distributorId)) latest.set(submission.distributorId, submission);
    return NextResponse.json({ data: (distributors as any[]).map(distributor => ({ distributor, user: userByUid.get(distributor.uid) || null, submission: publicSubmission(latest.get(distributor.uid) || null) })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not load KYC records.' }, { status: error.message?.includes('Authentication') ? 401 : 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const reviewer = await requireAdmin(request);
    const form = await request.formData();
    const distributorId = String(form.get('distributorId') || '');
    if (!distributorId) throw new Error('Member ID is required.');
    const db = await getMongoDb();
    const distributor = await db.collection('distributors').findOne({ uid: distributorId, rank: { $ne: 'Admin' } });
    if (!distributor) throw new Error('Member not found.');
    const documents: Record<string, any> = {};
    for (const type of ['idProof', 'addressProof', 'selfie']) {
      const file = form.get(type);
      if (file instanceof File && file.size > 0) {
        if (file.size > 8 * 1024 * 1024) throw new Error(`${type} must be smaller than 8MB.`);
        if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) throw new Error(`${type} must be JPG, PNG, WEBP, or PDF.`);
        documents[type] = await uploadKycFile(file, distributorId, type);
      }
    }
    if (!Object.keys(documents).length) throw new Error('Select at least one document.');
    const existing = await db.collection('kycSubmissions').findOne({ distributorId }, { sort: { submittedAt: -1 } });
    const now = new Date();
    const data = { ...(existing || {}), id: existing?.id || `KYC_${distributorId}_${Date.now()}`, distributorId, sponsorId: distributor.sponsorId || null, reviewerType: 'admin', submittedBy: 'admin', status: 'pending', ...documents, submittedAt: existing?.submittedAt || now, updatedAt: now, reviewedBy: null, reviewedAt: null, rejectionReason: null };
    await db.collection('kycSubmissions').updateOne({ id: data.id }, { $set: data }, { upsert: true });
    await db.collection('distributors').updateOne({ uid: distributorId }, { $set: { kycStatus: 'pending', updatedAt: now } });
    return NextResponse.json({ data: publicSubmission(data) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not upload KYC documents.' }, { status: error.message?.includes('Authentication') ? 401 : 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const reviewer = await requireAdmin(request);
    const { distributorId, status, rejectionReason, rejectedDocuments } = await request.json();
    if (!distributorId || !['verified', 'rejected'].includes(status)) throw new Error('A valid KYC decision is required.');
    const db = await getMongoDb();
    const now = new Date();
    const submission = await db.collection('kycSubmissions').findOne({ distributorId }, { sort: { submittedAt: -1 } });
    if (!submission) throw new Error('No KYC submission exists for this member.');
    await Promise.all([
      db.collection('kycSubmissions').updateOne({ _id: submission._id }, { $set: { status, rejectionReason: status === 'rejected' ? String(rejectionReason || 'Documents need correction.') : null, rejectedDocuments: status === 'rejected' ? (Array.isArray(rejectedDocuments) ? rejectedDocuments : []) : [], reviewedBy: reviewer.token.uid, reviewedAt: now, updatedAt: now } }),
      db.collection('distributors').updateOne({ uid: distributorId }, { $set: { kycStatus: status, updatedAt: now } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not update KYC.' }, { status: error.message?.includes('Authentication') ? 401 : 400 });
  }
}

/** Super Admin only: remove a member someone added directly. Blocked while they have a downline or their matching lot was already used. */
export async function DELETE(request: NextRequest) {
  try {
    const { distributor: admin } = await requireAdmin(request);
    if (admin?.sponsorId) throw new Error('Only the Super Admin can delete members.');
    const { distributorId } = await request.json();
    const db = await getMongoDb();
    const session = (await getMongoClient()).startSession();
    try {
      await session.withTransaction(async () => {
        const dist = db.collection<any>('distributors');
        const member = await dist.findOne({ uid: distributorId, addedBy: { $exists: true } }, { session });
        if (!member) throw new Error('Only directly added members can be deleted.');
        if (member.leftChildId || member.rightChildId) throw new Error('This member has a downline. Delete or move them first.');
        const lots = await db.collection<any>('matchingLots').find({ sourceUserId: distributorId }, { session }).toArray();
        if (lots.some(lot => lot.status !== 'available')) throw new Error('This member\'s BV was already matched, so they cannot be deleted.');
        const txn = await db.collection<any>('transactions').findOne({ distributorId, status: 'paid' }, { session });
        const bv = Number(lots[0]?.bvAmount ?? txn?.bvAtQuote ?? 0);
        if (member.parentId && member.position) {
          await dist.updateOne({ uid: member.parentId }, { $set: { [`${member.position}ChildId`]: null }, $inc: { [`${member.position}Count`]: -1, [`${member.position}BV`]: -bv } }, { session });
          let node = await dist.findOne({ uid: member.parentId }, { session });
          while (node?.parentId && node.position) {
            await dist.updateOne({ uid: node.parentId }, { $inc: { [`${node.position}Count`]: -1, [`${node.position}BV`]: -bv } }, { session });
            node = await dist.findOne({ uid: node.parentId }, { session });
          }
        }
        await db.collection('matchingLots').deleteMany({ sourceUserId: distributorId, status: 'available' }, { session });
        await dist.deleteOne({ uid: distributorId }, { session });
        await db.collection('users').deleteOne({ uid: distributorId }, { session });
        await db.collection('referralCodes').deleteMany({ ownerId: distributorId }, { session });
        await db.collection('sessions').deleteMany({ uid: distributorId }, { session });
        await db.collection('kycSubmissions').deleteMany({ distributorId }, { session });
      });
    } finally { await session.endSession(); }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not delete member.' }, { status: error.message?.includes('Authentication') ? 401 : 400 });
  }
}
