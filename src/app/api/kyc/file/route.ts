import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireUser } from '@/lib/server-auth';
import { getMongoDb } from '@/lib/mongodb';
import { fetchStoredDocument } from '@/lib/imagekit';
import { KYC_DOC_TYPES } from '@/lib/kyc-docs';

export const runtime = 'nodejs';

// GET /api/kyc/file?id=<submissionId>&type=idProof|addressProof|selfie
// Streams a KYC document to the member who owns it, the sponsor assigned to review it, or an admin.
// The storage provider's URL is never sent to the browser.
export async function GET(request: NextRequest) {
  try {
    const session = await requireUser(request);
    const params = new URL(request.url).searchParams;
    const id = params.get('id') || '', type = params.get('type') || '';
    if (!id || !(KYC_DOC_TYPES as readonly string[]).includes(type)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

    const db = await getMongoDb();
    const submission: any = await db.collection('kycSubmissions').findOne({ id });
    const doc = submission?.[type];
    if (!submission || !doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    const isAdmin = await requireAdmin(request).then(() => true, () => false);
    const isOwner = submission.distributorId === session.uid;
    const isReviewer = submission.reviewerType === 'sponsor' && submission.sponsorId === session.uid;
    if (!isAdmin && !isOwner && !isReviewer) return NextResponse.json({ error: 'You do not have access to this document.' }, { status: 403 });

    const upstream = await fetchStoredDocument(doc);
    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': doc.mime || upstream.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Could not load the document.';
    return NextResponse.json({ error: message }, { status: message.includes('Authentication') ? 401 : message.includes('not found') ? 404 : 500 });
  }
}
