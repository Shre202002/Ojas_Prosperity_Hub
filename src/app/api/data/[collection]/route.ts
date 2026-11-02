import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireUser } from '@/lib/server-auth';
import { ObjectId } from 'mongodb';
import { collection } from '@/lib/mongodb';

export const runtime = 'nodejs';
const PUBLIC_COLLECTIONS = new Set(['products', 'packages', 'referralCodes', 'heroSlides']);
const ADMIN_COLLECTIONS = new Set(['products', 'packages', 'transactions', 'kycSubmissions', 'distributors']);
const ALLOWED = new Set(['distributors', 'users', 'referralCodes', 'products', 'packages', 'transactions', 'kycSubmissions', 'heroSlides']);
// Credentials must never leave the server through this generic reader.
const HIDDEN_FIELDS = { passwordHash: 0 } as const;

function response(error: any) {
  const message = error?.message || 'Database request failed.';
  return NextResponse.json({ error: message }, { status: message.includes('Authentication') ? 401 : 403 });
}

// Records created by the admin screens carry an app-level string `id`, while Mongo keeps its own ObjectId `_id`.
// Match either so edits and deletes by the id the UI knows actually hit the document.
const idFilter = (id: unknown) => {
  const value = String(id ?? '');
  return { $or: [{ _id: value as any }, { id: value }, ...(/^[0-9a-f]{24}$/i.test(value) ? [{ _id: new ObjectId(value) }] : [])] };
};

const isAdminRequest = (request: NextRequest) => requireAdmin(request).then(() => true, () => false);

export async function GET(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection: name } = await params;
    if (!ALLOWED.has(name)) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 });
    const token = PUBLIC_COLLECTIONS.has(name) ? null : await requireUser(request);
    const store = await collection<any>(name);
    const query = new URL(request.url).searchParams;
    let filter: Record<string, unknown> = {};
    const id = query.get('id');
    if (id) { if (name === 'distributors' || name === 'users') filter.uid = id; else Object.assign(filter, idFilter(id)); }
    for (const key of ['uid', 'sponsorId', 'parentId', 'distributorId', 'status', 'sku', 'code', 'email']) if (query.get(key)) filter[key] = query.get(key);
    if (token && name === 'distributors' && !id) await requireAdmin(request);
    if (token && name === 'kycSubmissions' && !id && !query.get('distributorId') && !query.get('sponsorId')) await requireAdmin(request);
    if (token && name === 'transactions' && !id) await requireAdmin(request);
    if (!token && name === 'referralCodes' && !query.get('code')) return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
    // Members may only ever read their own account record; only admins can look up other users.
    if (token && name === 'users' && !(await isAdminRequest(request))) filter = { uid: token.uid };
    if (token && name === 'kycSubmissions' && !filter.distributorId && !filter.sponsorId) filter.distributorId = token.uid;
    if (token && name === 'transactions' && !ADMIN_COLLECTIONS.has(name)) filter.distributorId = token.uid;
    const docs = await store.find(filter, name === 'users' ? { projection: HIDDEN_FIELDS } : undefined).sort({ createdAt: -1, submittedAt: -1 }).limit(500).toArray();
    return NextResponse.json({ data: docs });
  } catch (error) { return response(error); }
}

// Writes through this generic endpoint are admin-only. Members change data only through purpose-built routes
// (/api/kyc, /api/profile, /api/network/provision, ...) so they can never forge payments, referral codes or accounts.
export async function POST(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection: name } = await params;
    if (!ALLOWED.has(name)) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 });
    const { token } = await requireAdmin(request);
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
    await requireAdmin(request);
    const body = await request.json();
    const id = body._id || body.id;
    delete body._id; delete body.id;
    if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    const result = await (await collection<any>(name)).updateOne(idFilter(id), { $set: { ...body, updatedAt: new Date() } });
    return NextResponse.json({ matched: result.matchedCount, modified: result.modifiedCount });
  } catch (error) { return response(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ collection: string }> }) {
  try {
    const { collection: name } = await params;
    if (!ALLOWED.has(name)) return NextResponse.json({ error: 'Unknown collection.' }, { status: 404 });
    await requireAdmin(request);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
    await (await collection<any>(name)).deleteOne(idFilter(id));
    return NextResponse.json({ success: true });
  } catch (error) { return response(error); }
}
