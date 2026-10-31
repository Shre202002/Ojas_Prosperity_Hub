import type { ClientSession } from 'mongodb';
import { collection } from './mongodb';

export const DEFAULT_WITHDRAWAL_CAP = 2500;
export const DEFAULT_MIN_WITHDRAWAL = 100;
export const WINDOW_MS = 12 * 60 * 60 * 1000;
// Anything that has left (or may yet leave) the wallet counts against the cap; rejected/failed ones were refunded.
export const COUNTED_STATUSES = ['processing', 'pending', 'approved', 'paid'];
export const UPI_PATTERN = /^[\w.\-]{2,256}@[A-Za-z]{2,64}$/;

export const round2 = (value: number) => Math.round(value * 100) / 100;

export async function getWithdrawalSettings() {
  const settings = await (await collection<any>('settings')).findOne({ _id: 'platform' });
  return {
    cap: Number(settings?.withdrawalLimit12h ?? DEFAULT_WITHDRAWAL_CAP),
    min: Number(settings?.minWithdrawal ?? DEFAULT_MIN_WITHDRAWAL),
  };
}

// Pure so it can be unit-tested with a fake clock (see scripts/test-withdrawal-limits.mjs).
export function summarizeWindow(rows: { amount: number; createdAt: Date }[], cap: number, now = new Date()) {
  const since = now.getTime() - WINDOW_MS;
  const inWindow = rows.filter(row => new Date(row.createdAt).getTime() >= since).sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  const used = round2(inWindow.reduce((sum, row) => sum + Number(row.amount || 0), 0));
  return {
    cap,
    used,
    remaining: Math.max(0, round2(cap - used)),
    nextAvailableAt: inWindow[0] ? new Date(new Date(inWindow[0].createdAt).getTime() + WINDOW_MS) : null,
  };
}

export async function getWindowUsage(userId: string, cap: number, session?: ClientSession, now = new Date()) {
  const since = new Date(now.getTime() - WINDOW_MS);
  const rows = await (await collection<any>('withdrawals'))
    .find({ userId, createdAt: { $gte: since }, status: { $in: COUNTED_STATUSES } }, { session, projection: { amount: 1, createdAt: 1 } })
    .toArray();
  return summarizeWindow(rows as any, cap, now);
}
