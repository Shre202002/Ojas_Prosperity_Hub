import { NextResponse } from 'next/server';
import { listActivePackages } from '@/lib/package-config';
export const runtime = 'nodejs';
export async function GET() { try { return NextResponse.json({ data: await listActivePackages() }, { headers: { 'Cache-Control': 'no-store' } }); } catch (error: any) { return NextResponse.json({ error: error.message || 'Could not load packages.' }, { status: 500 }); } }
