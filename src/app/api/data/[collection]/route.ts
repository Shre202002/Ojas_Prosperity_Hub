import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireUser } from '@/lib/server-auth';
import { collection } from '@/lib/mongodb';

export const runtime = 'nodejs';
const PUBLIC_COLLECTIONS = new Set(['products', 'packages', 'referralCodes']);
const ADMIN_COLLECTIONS = new Set(['products', 'packages', 'transactions', 'kycSubmissions', 'distributors']);
const ALLOWED = new Set(['distributors', 'users', 'referralCodes', 'products', 'packages', 'transactions', 'kycSubmissions', 'pendingEnrollments']);

function response(error: any) {
  const message = error?.message || 'Database request failed.';
  return NextResponse.json({ error: message }, { status: message.includes('Authentication') ? 401 : 403 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection: name } = await params;
    if (!ALLOWED.has(name)) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 });
    const token = PUBLIC_COLLECTIONS.has(name) ? null : await requireUser(request);
    const store = await collection<any>(name);
    const query = new URL(request.url).searchParams;
    const filter: Record<string, unknown> = {};
    const id = query.get('id');
    if (id) filter[name === 'distributors' || name === 'users' ? 'uid' : '_id'] = id;
    for (const key of ['uid', 'sponsorId', 'parentId', 'distributorId', 'status', 'sku', 'code', 'email']) if (query.get(key)) filter[key] = query.get(key);
    if (token && name === 'distributors' && !id) await requireAdmin(request);
    if (token && name === 'kycSubmissions' && !id && !query.get('distributorId') && !query.get('sponsorId')) await requireAdmin(request);
    if (token && name === 'transactions' && !id) await requireAdmin(request);
    if (!token && name === 'referralCodes' && !query.get('code')) return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
    if (token && name === 'users' && !filter.uid) filter.uid = token.uid;
    if (token && name === 'pendingEnrollments' && !filter.email) filter.email = token.email?.toLowerCase();
    if (token && name === 'kycSubmissions' && !filter.distributorId && !filter.sponsorId) filter.distributorId = token.uid;
    if (token && name === 'transactions' && !ADMIN_COLLECTIONS.has(name)) filter.distributorId = token.uid;
    const docs = await store.find(filter).sort({ createdAt: -1, submittedAt: -1 }).limit(500).toArray();
    return NextResponse.json({ data: docs });
  } catch (error) { return response(error); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection: name } = await params;
    if (!ALLOWED.has(name)) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 });
    const token = await requireUser(request);
    if (['products', 'packages', 'distributors'].includes(name)) await requireAdmin(request);
    const body = await request.json();
    if (name === 'transactions') { body.distributorId = token.uid; body.createdAt ||= new Date(); }
    if (name === 'kycSubmissions') { body.distributorId = token.uid; body.submittedAt ||= new Date(); }
    const result = await (await collection<any>(name)).insertOne(body);
    return NextResponse.json({ data: { ...body, _id: result.insertedId } }, { status: 201 });
  } catch (error) { return response(error); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection: name } = await params;
    if (!ALLOWED.has(name)) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 });
    await requireUser(request);
    if (['products', 'packages', 'transactions', 'kycSubmissions', 'distributors', 'users'].includes(name)) await requireAdmin(request);
    const body = await request.json();
    const id = body._id || body.id;
    delete body._id; delete body.id;
    const result = await (await collection<any>(name)).updateOne({ _id: id }, { $set: { ...body, updatedAt: new Date() } });
    return NextResponse.json({ matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) { return response(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try { const { collection: name } = await params; await requireAdmin(request); const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 }); await (await collection<any>(name)).deleteOne({ _id: id }); return NextResponse.json({ success: true }); } catch (error) { return response(error); }
}
