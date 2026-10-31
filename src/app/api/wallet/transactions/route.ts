import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { listWalletTransactions } from '@/lib/wallet-transactions';

export const runtime = 'nodejs';
// The member id always comes from the session, never from the query string.
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await listWalletTransactions(new URL(request.url).searchParams, { userId: user.uid }));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: e.message?.includes('Authentication') ? 401 : 500 }); }
}
