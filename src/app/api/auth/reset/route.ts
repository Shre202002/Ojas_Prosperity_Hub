import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { collection } from '@/lib/mongodb';
import { hashPassword } from '@/lib/password-hash';

export const runtime = 'nodejs';
const FIFTEEN_MIN = 15 * 60 * 1000;

// Always answers success so the endpoint can't be used to probe which emails are registered.
// shortcut: no email provider is wired up, so the link is only logged server-side; plug in an email sender here before launch.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });

  const user = await (await collection<any>('users')).findOne({ email });
  if (user) {
    const code = randomBytes(24).toString('hex');
    await (await collection('passwordResets')).insertOne({ code, email, expiresAt: new Date(Date.now() + FIFTEEN_MIN) });
    console.info(`[password-reset] ${email}: ${new URL(request.url).origin}/reset-password?oobCode=${code}`);
  }
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const code = new URL(request.url).searchParams.get('code');
  const reset = code ? await (await collection<any>('passwordResets')).findOne({ code, expiresAt: { $gt: new Date() } }) : null;
  return reset ? NextResponse.json({ email: reset.email }) : NextResponse.json({ error: 'Invalid reset code.' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const { code, password } = await request.json().catch(() => ({}));
  if (!code || String(password || '').length < 6) return NextResponse.json({ error: 'A valid code and a password of at least 6 characters are required.' }, { status: 400 });

  const resets = await collection<any>('passwordResets');
  const reset = await resets.findOneAndDelete({ code: String(code), expiresAt: { $gt: new Date() } });
  const record = reset && 'value' in (reset as any) ? (reset as any).value : reset;
  if (!record) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });

  await (await collection<any>('users')).updateOne({ email: record.email }, { $set: { passwordHash: hashPassword(String(password)) } });
  // Sign out every existing session for this account.
  await (await collection<any>('sessions')).deleteMany({ email: record.email });
  return NextResponse.json({ success: true });
}
