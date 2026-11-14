import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { getMongoDb } from '@/lib/mongodb';
import { uploadKycFile } from '@/lib/imagekit';
import { publicSubmission } from '@/lib/kyc-docs';
import { checkAddress, checkAddressProofNumber, checkIdNumber, DOC_LABELS } from '@/lib/kyc-rules';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser(request); const form = await request.formData(); const db = await getMongoDb();
    const distributor = await db.collection('distributors').findOne({ uid: session.uid }); if (!distributor) throw new Error('Member profile not found.');
    const documents: Record<string, any> = {};
    for (const type of ['idProof', 'addressProof', 'selfie']) { const file = form.get(type); if (file instanceof File && file.size) documents[type] = await uploadKycFile(file, session.uid, type); }
    const existing = await db.collection('kycSubmissions').findOne({ distributorId: session.uid }, { sort: { submittedAt: -1 } }); const now = new Date();
    // All three documents are compulsory (a file already on record from an earlier submission counts).
    for (const type of ['idProof', 'addressProof', 'selfie'] as const) if (!documents[type] && !existing?.[type]) throw new Error(`${DOC_LABELS[type]} is required. Please upload all 3 documents.`);
    const selfieFile = form.get('selfie'); if (selfieFile instanceof File && selfieFile.size && !selfieFile.type.startsWith('image/')) throw new Error('Live selfie must be a photo (JPG, PNG or WEBP).');
    const idType = String(form.get('idType') || ''), idCheck = checkIdNumber(idType, String(form.get('idNumber') || '')); if (!idCheck.ok) throw new Error(idCheck.message);
    const addressProofType = String(form.get('addressProofType') || ''), addrNoCheck = checkAddressProofNumber(addressProofType, String(form.get('addressProofNumber') || '')); if (!addrNoCheck.ok) throw new Error(addrNoCheck.message);
    const addrCheck = checkAddress(String(form.get('address') || '')); if (!addrCheck.ok) throw new Error(addrCheck.message);
    const data = { ...(existing || {}), id: existing?.id || `KYC_${session.uid}_${Date.now()}`, distributorId: session.uid, sponsorId: distributor.sponsorId || null, reviewerType: distributor.sponsorId ? 'sponsor' : 'admin', submittedBy: 'self', status: 'pending', ...documents, idType, idNumber: idCheck.value, addressProofType, addressProofNumber: addrNoCheck.value, address: addrCheck.value, submittedAt: existing?.submittedAt || now, updatedAt: now, reviewedBy: null, reviewedAt: null, rejectionReason: null };
    await db.collection('kycSubmissions').updateOne({ id: data.id }, { $set: data }, { upsert: true }); await db.collection('distributors').updateOne({ uid: session.uid }, { $set: { kycStatus: 'pending', updatedAt: now } });
    return NextResponse.json({ data: publicSubmission(data) });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Could not submit KYC.' }, { status: error.message?.includes('Authentication') ? 401 : 400 }); }
}
