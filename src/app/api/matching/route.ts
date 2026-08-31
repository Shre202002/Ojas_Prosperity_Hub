import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient, getMongoDb } from '@/lib/mongodb';
import { requireUser } from '@/lib/server-auth';
import { createMatchingCommission, parseLotIds } from '@/lib/matching';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await requireUser(request);
    const db = await getMongoDb();
    const lots = await db.collection('matchingLots').find({ ownerId: session.uid, status: 'available' }).sort({ createdAt: 1, _id: 1 }).limit(500).toArray();
    const leftLots = lots.filter(lot => lot.side === 'left');
    const rightLots = lots.filter(lot => lot.side === 'right');
    return NextResponse.json({ data: { leftLots, rightLots, leftAvailableBv: leftLots.reduce((sum, lot) => sum + Number(lot.bvAmount || 0), 0), rightAvailableBv: rightLots.reduce((sum, lot) => sum + Number(lot.bvAmount || 0), 0) } });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Could not load matching lots.' }, { status: error.message?.includes('Authentication') ? 401 : 400 }); }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireUser(request);
    const body = await request.json();
    const leftLotIds = parseLotIds(body.leftLotIds);
    const rightLotIds = parseLotIds(body.rightLotIds);
    const db = await getMongoDb();
    const mongoSession = (await getMongoClient()).startSession();
    let commission: any;
    try { await mongoSession.withTransaction(async () => { commission = await createMatchingCommission({ db, session: mongoSession, beneficiaryId: sessionUser.uid, leftLotIds, rightLotIds }); }); } finally { await mongoSession.endSession(); }
    return NextResponse.json({ success: true, data: commission });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Matching failed.' }, { status: error.message?.includes('Authentication') ? 401 : 400 }); }
}
