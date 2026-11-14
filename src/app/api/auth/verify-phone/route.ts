import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { collection } from '@/lib/mongodb';

export const runtime = 'nodejs';
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

// PUT { phone, idToken } -> checks the Firebase ID token proves ownership of `phone`, then records it as verified for 2 hours
// (consumed by /api/network/provision when the account is created).
export async function PUT(request: NextRequest) {
  const { phone: raw, idToken } = await request.json().catch(() => ({}));
  const phone = String(raw || '').trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return NextResponse.json({ error: 'Phone verification is not configured.' }, { status: 503 });
  if (!/^\+\d{8,15}$/.test(phone) || typeof idToken !== 'string') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  try {
    const { payload } = await jwtVerify(idToken, JWKS, { issuer: `https://securetoken.google.com/${projectId}`, audience: projectId });
    if (payload.phone_number !== phone) return NextResponse.json({ error: 'Phone number does not match.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Phone verification failed. Please try again.' }, { status: 400 });
  }
  const c = await collection<any>('phoneVerifications');
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => undefined);
  await c.replaceOne({ _id: phone }, { _id: phone, verified: true, createdAt: new Date(), expiresAt: new Date(Date.now() + 2 * 60 * 60_000) }, { upsert: true });
  return NextResponse.json({ success: true });
}
