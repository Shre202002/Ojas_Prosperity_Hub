import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomInt } from 'crypto';
import { collection } from '@/lib/mongodb';
import { sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';
// Fallback when the SMS OTP cannot be delivered: prove ownership of the registration email instead.
// On success it writes the same `phoneVerifications` record the SMS flow does (tagged method:'email'),
// which /api/network/provision consumes.
const hashCode = (phone: string, email: string, code: string) => createHash('sha256').update(`${phone}:${email}:${code}`).digest('hex');
const COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;
const PHONE = /^\+\d{8,15}$/;
const EMAIL = /^\S+@\S+\.\S+$/;

async function otps() {
  const c = await collection<any>('phoneEmailOtps');
  await c.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => undefined);
  return c;
}

// POST { phone, email } -> emails a 6-digit code.
export async function POST(request: NextRequest) {
  const { phone: rawPhone, email: rawEmail } = await request.json().catch(() => ({}));
  const phone = String(rawPhone || '').trim(), email = String(rawEmail || '').trim().toLowerCase();
  if (!PHONE.test(phone) || !EMAIL.test(email)) return NextResponse.json({ error: 'Enter a valid phone number and email first.' }, { status: 400 });

  const c = await otps();
  const existing = await c.findOne({ _id: phone as any });
  if (existing && Date.now() - new Date(existing.createdAt).getTime() < COOLDOWN_MS) return NextResponse.json({ error: 'Please wait a minute before requesting another code.' }, { status: 429 });

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await c.replaceOne({ _id: phone as any }, { _id: phone as any, email, codeHash: hashCode(phone, email, code), attempts: 0, createdAt: new Date(), expiresAt: new Date(Date.now() + 10 * 60_000) }, { upsert: true });
  try {
    await sendMail({ to: email, subject: 'Your phone verification code', text: `Your verification code is ${code}. It is valid for 10 minutes.`, html: `<p>Your verification code is <b style="font-size:20px">${code}</b>. It is valid for 10 minutes.</p>` });
  } catch (error) {
    console.error('Phone fallback email failed:', error);
    await c.deleteOne({ _id: phone as any }).catch(() => undefined);
    return NextResponse.json({ error: 'Could not send the verification email. Please try again shortly.' }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}

// PUT { phone, email, code } -> marks the phone verified (by email) for 2 hours.
export async function PUT(request: NextRequest) {
  const { phone: rawPhone, email: rawEmail, code } = await request.json().catch(() => ({}));
  const phone = String(rawPhone || '').trim(), email = String(rawEmail || '').trim().toLowerCase();
  if (!PHONE.test(phone) || !EMAIL.test(email)) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const c = await otps();
  const rec = await c.findOne({ _id: phone as any, email, expiresAt: { $gt: new Date() } });
  if (!rec || rec.attempts >= MAX_ATTEMPTS) return NextResponse.json({ error: 'Code expired. Request a new one.' }, { status: 400 });
  if (rec.codeHash !== hashCode(phone, email, String(code || '').trim())) {
    await c.updateOne({ _id: phone as any }, { $inc: { attempts: 1 } });
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
  }
  await c.deleteOne({ _id: phone as any });
  const v = await collection<any>('phoneVerifications');
  await v.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => undefined);
  await v.replaceOne({ _id: phone as any }, { _id: phone as any, verified: true, method: 'email', email, createdAt: new Date(), expiresAt: new Date(Date.now() + 2 * 60 * 60_000) }, { upsert: true });
  return NextResponse.json({ success: true });
}
