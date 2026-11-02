import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { collection } from '@/lib/mongodb';
import { hashPassword } from '@/lib/password-hash';
import { passwordResetEmail, sendMail } from '@/lib/mailer';

export const runtime = 'nodejs';
const RESET_MINUTES = 15;
const FIFTEEN_MIN = RESET_MINUTES * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

// Only a hash of the code is stored, so a leaked database can't be used to take over accounts.
const hashCode = (code: string) => createHash('sha256').update(code).digest('hex');

let ttlIndexReady: Promise<unknown> | undefined;
async function resetsCollection() {
  const resets = await collection<any>('passwordResets');
  // Expired codes delete themselves; the index is created once per server process.
  ttlIndexReady ??= resets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => undefined);
  await ttlIndexReady;
  return resets;
}

// Where the emailed link points. Set APP_URL in production; the request origin is only trusted in local dev.
function appOrigin(request: NextRequest) {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') throw new Error('APP_URL must be set to build password reset links.');
  return new URL(request.url).origin;
}

// Always answers success so the endpoint can't be used to probe which emails are registered.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });

  try {
    const user = await (await collection<any>('users')).findOne({ email });
    if (user) {
      const resets = await resetsCollection();
      // Cooldown so the form can't be used to spam someone's inbox.
      const tooSoon = await resets.findOne({ email, createdAt: { $gt: new Date(Date.now() - COOLDOWN_MS) } });
      if (!tooSoon) {
        const code = randomBytes(24).toString('hex');
        await resets.insertOne({ codeHash: hashCode(code), email, createdAt: new Date(), expiresAt: new Date(Date.now() + FIFTEEN_MIN) });
        // Only the newest link works: drop this account's older codes.
        await resets.deleteMany({ email, codeHash: { $ne: hashCode(code) } });
        const link = `${appOrigin(request)}/reset-password?oobCode=${code}`;
        await sendMail({ to: email, ...passwordResetEmail(link, RESET_MINUTES) });
      }
    }
  } catch (error) {
    // Never reveal failures to the caller (would leak which emails exist); log for the operator.
    console.error('[password-reset] could not send reset email:', error);
  }
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code');
  const reset = code ? await (await resetsCollection()).findOne({ codeHash: hashCode(code), expiresAt: { $gt: new Date() } }) : null;
  return reset ? NextResponse.json({ email: reset.email }) : NextResponse.json({ error: 'Invalid reset code.' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const { code, password } = await request.json().catch(() => ({}));
  if (!code || String(password || '').length < 6) return NextResponse.json({ error: 'A valid code and a password of at least 6 characters are required.' }, { status: 400 });

  const resets = await resetsCollection();
  const reset = await resets.findOneAndDelete({ codeHash: hashCode(String(code)), expiresAt: { $gt: new Date() } });
  const record = reset && 'value' in (reset as any) ? (reset as any).value : reset;
  if (!record) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });

  await (await collection<any>('users')).updateOne({ email: record.email }, { $set: { passwordHash: hashPassword(String(password)) } });
  // Sign out every existing session for this account.
  await (await collection<any>('sessions')).deleteMany({ email: record.email });
  return NextResponse.json({ success: true });
}
