import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getMongoDb } from '@/lib/mongodb';
import { uploadKycFile } from '@/lib/imagekit';
import { publicSubmission } from '@/lib/kyc-docs';

export const runtime = 'nodejs';
const TYPES = ['idProof', 'addressProof', 'selfie'] as const;

/** The sponsor who added a member uploads that member's 3 KYC documents; the member is verified immediately (Super Admin can still reject or delete). */
export async function POST(request: NextRequest) {
  try {
    const session = await requireUser(request);
    const form = await request.formData();
    const distributorId = String(form.get('distributorId') || '');
    const db = await getMongoDb();
    const member = await db.collection('distributors').findOne({ uid: distributorId, addedBy: session.uid });
    if (!member) throw new Error('You can only upload KYC for members you added.');
    if (member.kycStatus === 'rejected') throw new Error('This member was rejected by the Super Admin. Contact the admin.');
    const documents: Record<string, any> = {};
    for (const type of TYPES) {
      const file = form.get(type);
      if (!(file instanceof File) || !file.size) throw new Error('Please upload all 3 documents (ID proof, address proof and selfie).');
      documents[type] = await uploadKycFile(file, distributorId, type);
    }
    const existing = await db.collection('kycSubmissions').findOne({ distributorId }, { sort: { submittedAt: -1 } });
    const now = new Date();
    const data = { ...(existing || {}), id: existing?.id || `KYC_${distributorId}_${Date.now()}`, distributorId, sponsorId: member.sponsorId || null, reviewerType: 'sponsor', submittedBy: 'sponsor', status: 'verified', ...documents, submittedAt: existing?.submittedAt || now, updatedAt: now, reviewedBy: session.uid, reviewedAt: now, rejectionReason: null, rejectedDocuments: [] };
    await db.collection('kycSubmissions').updateOne({ id: data.id }, { $set: data }, { upsert: true });
    await db.collection('distributors').updateOne({ uid: distributorId }, { $set: { kycStatus: 'verified', updatedAt: now } });
    return NextResponse.json({ data: publicSubmission(data) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Could not upload KYC documents.' }, { status: error.message?.includes('Authentication') ? 401 : 400 });
  }
}
