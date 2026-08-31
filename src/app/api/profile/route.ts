import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import { collection } from '@/lib/mongodb';
export async function PATCH(request: NextRequest) { try { const session = await requireUser(request); const body = await request.json(); await (await collection('users')).updateOne({ uid: session.uid }, { $set: { name: body.displayName, photoURL: body.photoURL, updatedAt: new Date() } }); return NextResponse.json({ success: true }); } catch (error: any) { return NextResponse.json({ error: error.message }, { status: 401 }); } }
