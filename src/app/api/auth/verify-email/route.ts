import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomInt } from 'crypto';
import { collection } from '@/lib/mongodb';
import { otpEmail, sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';
const hashCode = (email: string, code: string) => createHash('sha256').update(`${email}:${code}`).digest('hex');
const COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

async function verifications() {
  const c = await collection<any>('emailVerifications');
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => undefined);
  return c;
}

// POST { email } -> emails a 6-digit code.
export async function POST(request: NextRequest) {
  const { email: raw } = await request.json().catch(() => ({}));
  const email = String(raw || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (await (await collection<any>('users')).findOne({ email })) return NextResponse.json({ error: 'Email is already registered.' }, { status: 400 });

  const c = await verifications();
  const existing = await c.findOne({ _id: email });
  if (existing && Date.now() - new Date(existing.createdAt).getTime() < COOLDOWN_MS) return NextResponse.json({ error: 'Please wait a minute before requesting another code.' }, { status: 429 });

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await c.replaceOne({ _id: email }, { _id: email, codeHash: hashCode(email, code), attempts: 0, verified: false, createdAt: new Date(), expiresAt: new Date(Date.now() + 15 * 60_000) }, { upsert: true });
  try {
    await sendMail({ to: email, ...otpEmail(code, 15) });
  } catch (error) {
    console.error('Verification email failed:', error);
    await c.deleteOne({ _id: email }).catch(() => undefined); // don't lock the user out with the resend cooldown
    return NextResponse.json({ error: 'Could not send the verification email. Please try again shortly.' }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}

// PUT { email, code } -> marks the email verified (consumed by /api/auth register).
export async function PUT(request: NextRequest) {
  const { email: raw, code } = await request.json().catch(() => ({}));
  const email = String(raw || '').trim().toLowerCase();
  const c = await verifications();
  const rec = await c.findOne({ _id: email, expiresAt: { $gt: new Date() } });
  if (!rec || rec.attempts >= MAX_ATTEMPTS) return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });
  if (rec.codeHash !== hashCode(email, String(code || '').trim())) {
    await c.updateOne({ _id: email }, { $inc: { attempts: 1 } });
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
  }
  // Keep the verified flag for 2 hours so the shopper can finish selecting products and paying.
  await c.updateOne({ _id: email }, { $set: { verified: true, expiresAt: new Date(Date.now() + 2 * 60 * 60_000) } });
  return NextResponse.json({ success: true });
}
