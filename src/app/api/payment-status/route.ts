import { NextRequest, NextResponse } from 'next/server';
import { collection } from '@/lib/mongodb';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^order_[a-z0-9]+$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid payment order.' }, { status: 400 });
  }

  const transaction = await (await collection<any>('transactions')).findOne(
    { _id: id },
    { projection: { _id: 1, status: 1, failureReason: 1 } }
  );

  if (!transaction) return NextResponse.json({ error: 'Payment order not found.' }, { status: 404 });
  return NextResponse.json({ data: transaction });
}
