'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react';
import { apiRequest } from '@/lib/app-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  purchase: 'Purchase', purchase_bv: 'Purchase BV', repurchase: 'Repurchase',
  commission_direct: 'Direct commission', commission_matching: 'Matching bonus',
  bv_conversion_debit: 'BV converted', bv_conversion_credit: 'Conversion credit',
  withdrawal: 'Withdrawal', withdrawal_refund: 'Withdrawal refund', adjustment: 'Adjustment',
};
const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-primary/10 text-primary', pending: 'bg-accent/15 text-accent', failed: 'bg-destructive/10 text-destructive', reversed: 'bg-muted text-muted-foreground',
};
const fmt = (row: any) => row.unit === 'INR' ? `₹${Number(row.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : `${Number(row.amount).toLocaleString('en-IN', { maximumFractionDigits: 4 })} BV`;

// Member view uses /api/wallet/transactions; the admin page passes the admin endpoint and a CSV download.
export function WalletTransactionsTable({ endpoint, admin = false }: { endpoint: string; admin?: boolean }) {
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0 });
  const [type, setType] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useCallback((page: number, extra = '') => {
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set('type', type);
    if (admin && userId.trim()) params.set('userId', userId.trim());
    return `${endpoint}?${params.toString()}${extra}`;
  }, [endpoint, type, userId, admin]);

  const load = useCallback(async (page = 1) => {
    setLoading(true); setError('');
    try { const result = await apiRequest(query(page)); setRows(result.data); setPagination(result.pagination); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [query]);
  useEffect(() => { load(1); }, [load]);

  const downloadCsv = async () => {
    const token = localStorage.getItem('sjapl_session_token');
    const response = await fetch(query(1, '&format=csv'), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) { setError('Could not export the ledger.'); return; }
    const url = URL.createObjectURL(await response.blob());
    const link = Object.assign(document.createElement('a'), { href: url, download: 'wallet-transactions.csv' });
    link.click(); URL.revokeObjectURL(url);
  };

  const pages = Math.max(1, Math.ceil(pagination.total / pagination.limit));
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Transaction history</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {admin && <Input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Filter by user id" className="h-9 w-48" />}
          <select value={type} onChange={e => setType(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" aria-label="Filter by type">
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          {admin && <Button variant="outline" size="sm" onClick={downloadCsv}><Download className="mr-2 h-4 w-4" />CSV</Button>}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          : error ? <p className="p-8 text-center text-sm text-destructive">{error}</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Transaction</th>{admin && <th className="px-4 py-3">User</th>}<th className="px-4 py-3">Amount</th><th className="px-4 py-3">Balance after</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map(row => (
                    <tr key={String(row._id)} className="border-t">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{TYPE_LABELS[row.type] || row.type}</p>
                        <p className="font-mono-data text-[11px] text-muted-foreground">{row.txnId}</p>
                        <p className="text-xs text-muted-foreground">{row.description}</p>
                      </td>
                      {admin && <td className="px-4 py-3 font-mono-data text-xs">{row.userId}</td>}
                      <td className={cn('whitespace-nowrap px-4 py-3 font-bold', row.direction === 'credit' ? 'text-primary' : 'text-foreground')}>
                        <span className="inline-flex items-center gap-1">{row.direction === 'credit' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}{row.direction === 'credit' ? '+' : '−'}{fmt(row)}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{row.balanceAfter === null || row.balanceAfter === undefined ? '—' : fmt({ amount: row.balanceAfter, unit: row.unit })}</td>
                      <td className="px-4 py-3"><Badge className={cn('capitalize shadow-none', STATUS_STYLE[row.status])}>{row.status}</Badge></td>
                    </tr>
                  )) : <tr><td colSpan={admin ? 6 : 5} className="px-4 py-12 text-center text-muted-foreground">No transactions yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        {!loading && pagination.total > pagination.limit && (
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {pagination.page} of {pages} · {pagination.total} transactions</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={pagination.page >= pages} onClick={() => load(pagination.page + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
