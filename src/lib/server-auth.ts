import { NextRequest } from 'next/server';
import { collection } from './mongodb';

export async function requireUser(request: NextRequest) { const token = request.headers.get('authorization')?.replace(/^Bearer /, ''); if (!token) throw new Error('Authentication required.'); const session = await (await collection<any>('sessions')).findOne({ token, expiresAt: { $gt: new Date() } }); if (!session) throw new Error('Authentication required.'); return session; }
export async function requireAdmin(request: NextRequest) { const session = await requireUser(request); const user = await (await collection<any>('users')).findOne({ uid: session.uid }); const distributor = await (await collection<any>('distributors')).findOne({ uid: session.uid }); if (user?.role !== 'admin' && distributor?.rank !== 'Admin') throw new Error('Administrator access required.'); return { token: session, distributor }; }
