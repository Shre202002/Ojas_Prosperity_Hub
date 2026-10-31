import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { listWalletTransactions, walletTransactionsToCsv } from '@/lib/wallet-transactions';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const params = new URL(request.url).searchParams;
    const userId = params.get('userId');
    const base = userId ? { userId } : {};
    if (params.get('format') === 'csv') {
      params.set('limit', '100');
      const rows: any[] = [];
      // shortcut: CSV exports at most 5,000 rows (50 pages); add streaming if the ledger outgrows that.
      for (let page = 1; page <= 50; page++) {
        params.set('page', String(page));
        const { data, pagination } = await listWalletTransactions(params, base);
        rows.push(...data);
        if (page * pagination.limit >= pagination.total) break;
      }
      return new NextResponse(walletTransactionsToCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="wallet-transactions.csv"' } });
    }
    return NextResponse.json(await listWalletTransactions(params, base));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 403 }); }
}
