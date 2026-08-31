import { NextRequest, NextResponse } from 'next/server';
import { ensureMongoIndexes } from '@/lib/mongo-repositories';
import { requireAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    await ensureMongoIndexes();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.message || 'MongoDB bootstrap failed.';
    return NextResponse.json({ error: message }, { status: message.includes('Authentication') ? 401 : 403 });
  }
}
