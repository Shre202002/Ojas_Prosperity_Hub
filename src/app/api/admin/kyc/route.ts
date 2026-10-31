import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { collection, getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

async function uploadToImageKit(file: File, distributorId: string, type: string) {
  const privateKey = process.env.Imagekit_PRIVATE_KEY;
  if (!privateKey) throw new Error('ImageKit is not configured.');
  const form = new FormData();
  form.append('file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name);
  form.append('fileName', `${distributorId}-${type}-${Date.now()}-${file.name}`);
  form.append('folder', `/sjapl/kyc/${distributorId}`);
  const auth = Buffer.from(`${privateKey}:`).toString('base64');
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { Authorization: `Basic ${auth}` }, body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Image upload failed.');
  return { url: result.url, fileId: result.fileId, filename: file.name };
}

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
    return NextResponse.json({ data: (distributors as any[]).map(distributor => ({ distributor, user: userByUid.get(distributor.uid) || null, submission: latest.get(distributor.uid) || null })) });
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
        documents[type] = await uploadToImageKit(file, distributorId, type);
      }
    }
    if (!Object.keys(documents).length) throw new Error('Select at least one document.');
    const existing = await db.collection('kycSubmissions').findOne({ distributorId }, { sort: { submittedAt: -1 } });
    const now = new Date();
    const data = { ...(existing || {}), id: existing?.id || `KYC_${distributorId}_${Date.now()}`, distributorId, sponsorId: distributor.sponsorId || null, reviewerType: 'admin', submittedBy: 'admin', status: 'pending', ...documents, submittedAt: existing?.submittedAt || now, updatedAt: now, reviewedBy: null, reviewedAt: null, rejectionReason: null };
    await db.collection('kycSubmissions').updateOne({ id: data.id }, { $set: data }, { upsert: true });
    await db.collection('distributors').updateOne({ uid: distributorId }, { $set: { kycStatus: 'pending', updatedAt: now } });
    return NextResponse.json({ data });
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
