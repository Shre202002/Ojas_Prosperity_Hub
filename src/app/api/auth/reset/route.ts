import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { collection } from '@/lib/mongodb';
export async function POST(request: NextRequest) { const { email } = await request.json(); const code = randomBytes(24).toString('hex'); await (await collection('passwordResets')).insertOne({ code, email: String(email).toLowerCase(), expiresAt: new Date(Date.now() + 15 * 60 * 1000) }); return NextResponse.json({ success: true }); }
export async function GET(request: NextRequest) { const code = new URL(request.url).searchParams.get('code'); const reset = code ? await (await collection<any>('passwordResets')).findOne({ code, expiresAt: { $gt: new Date() } }) : null; return reset ? NextResponse.json({ email: reset.email }) : NextResponse.json({ error: 'Invalid reset code.' }, { status: 400 }); }
export async function PATCH(request: NextRequest) { return NextResponse.json({ success: true }); }
