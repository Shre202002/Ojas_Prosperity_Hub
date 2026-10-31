import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getMongoDb } from '@/lib/mongodb';

export const runtime = 'nodejs';

async function upload(file: File, uid: string, type: string) {
  if (!process.env.Imagekit_PRIVATE_KEY) throw new Error('ImageKit is not configured.');
  if (file.size > 8 * 1024 * 1024) throw new Error(`${type} must be smaller than 8MB.`);
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) throw new Error(`${type} must be JPG, PNG, WEBP, or PDF.`);
  const body = new FormData(); body.append('file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name); body.append('fileName', `${uid}-${type}-${Date.now()}-${file.name}`); body.append('folder', `/sjapl/kyc/${uid}`);
  const auth = Buffer.from(`${process.env.Imagekit_PRIVATE_KEY}:`).toString('base64');
  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { Authorization: `Basic ${auth}` }, body });
  const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Image upload failed.');
  return { url: result.url, fileId: result.fileId, filename: file.name };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser(request); const form = await request.formData(); const db = await getMongoDb();
    const distributor = await db.collection('distributors').findOne({ uid: session.uid }); if (!distributor) throw new Error('Member profile not found.');
    const documents: Record<string, any> = {};
    for (const type of ['idProof', 'addressProof', 'selfie']) { const file = form.get(type); if (file instanceof File && file.size) documents[type] = await upload(file, session.uid, type); }
    if (!Object.keys(documents).length) throw new Error('Select at least one document.');
    const existing = await db.collection('kycSubmissions').findOne({ distributorId: session.uid }, { sort: { submittedAt: -1 } }); const now = new Date();
    const data = { ...(existing || {}), id: existing?.id || `KYC_${session.uid}_${Date.now()}`, distributorId: session.uid, sponsorId: distributor.sponsorId || null, reviewerType: distributor.sponsorId ? 'sponsor' : 'admin', submittedBy: 'self', status: 'pending', ...documents, idNumber: String(form.get('idNumber') || existing?.idNumber || ''), address: String(form.get('address') || existing?.address || ''), submittedAt: existing?.submittedAt || now, updatedAt: now, reviewedBy: null, reviewedAt: null, rejectionReason: null };
    await db.collection('kycSubmissions').updateOne({ id: data.id }, { $set: data }, { upsert: true }); await db.collection('distributors').updateOne({ uid: session.uid }, { $set: { kycStatus: 'pending', updatedAt: now } });
    return NextResponse.json({ data });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Could not submit KYC.' }, { status: error.message?.includes('Authentication') ? 401 : 400 }); }
}
