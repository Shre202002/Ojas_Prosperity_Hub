import { NextRequest, NextResponse } from 'next/server';
import { collection } from '@/lib/mongodb';

export const runtime = 'nodejs';

/** Lets the register page stop a duplicate email BEFORE the member pays. 'incomplete' = account exists but never finished setup (retry allowed). */
export async function POST(request: NextRequest) {
  const { email: raw } = await request.json().catch(() => ({}));
  const email = String(raw || '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  const user: any = await (await collection<any>('users')).findOne({ email });
  if (!user) return NextResponse.json({ status: 'free' });
  const distributor = await (await collection<any>('distributors')).findOne({ uid: user.uid });
  return NextResponse.json({ status: distributor ? 'registered' : 'incomplete' });
}
