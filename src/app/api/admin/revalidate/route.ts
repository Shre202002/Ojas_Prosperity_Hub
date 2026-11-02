import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';

// Admin-only: refresh the cached public pages right after an admin edits hero banners (otherwise they update within a minute).
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    revalidatePath('/');
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = String(error?.message || '');
    const status = /Authentication/i.test(message) ? 401 : 403;
    return NextResponse.json({ error: message || 'Not allowed.' }, { status });
  }
}
