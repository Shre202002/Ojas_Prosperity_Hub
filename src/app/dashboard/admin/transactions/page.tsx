
'use client';

import { useState } from 'react';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Download, 
  Filter, 
  RefreshCcw, 
  ArrowUpRight, 
  History,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminTransactionsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const transactionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    let q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    if (statusFilter !== 'all') {
      q = query(collection(db, 'transactions'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    }
    return q;
  }, [db, statusFilter]);

  const { data: transactions, loading } = useCollection(transactionsQuery);

  const filteredTransactions = transactions?.filter(t => 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.distributorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.razorpayPaymentId?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleRefund = async (transactionId: string) => {
    if (!db) return;
    try {
      const transRef = doc(db, 'transactions', transactionId);
      await updateDoc(transRef, {
        status: 'refunded',
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Transaction Refunded', description: 'The record has been updated successfully.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: e.message });
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Distributor', 'Package', 'Amount', 'Status', 'Date'];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.distributorId || 'N/A',
      t.packageId,
      (t.amount / 100).toFixed(2),
      t.status,
      new Date(t.createdAt?.seconds * 1000).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-slate-900">Financial Ledger</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Full platform transaction history and reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl font-bold h-11" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button className="rounded-xl font-bold h-11 shadow-lg shadow-primary/20">
            <RefreshCcw className="w-4 h-4 mr-2" /> Sync Gateway
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Volume</p>
              <p className="text-2xl font-mono-data font-bold">₹{(filteredTransactions.reduce((acc, t) => t.status === 'paid' ? acc + t.amount : acc, 0) / 100).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        {['paid', 'pending', 'failed'].map(s => (
          <Card key={s} className="border-none shadow-md bg-white">
            <CardContent className="p-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s} Count</p>
                <p className="text-2xl font-mono-data font-bold">{filteredTransactions.filter(t => t.status === (s === 'pending' ? 'created' : s)).length}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
        <CardHeader className="bg-slate-50 border-b pb-6 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by ID, User, or Payment ID..." 
                className="pl-12 h-14 rounded-2xl border-slate-200 font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border">
                 <Filter className="w-4 h-4 text-slate-400" />
                 <select 
                  className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                 >
                   <option value="all">All Status</option>
                   <option value="paid">Paid</option>
                   <option value="created">Created</option>
                   <option value="failed">Failed</option>
                   <option value="refunded">Refunded</option>
                 </select>
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Transaction ID</TableHead>
                <TableHead className="font-bold">Distributor</TableHead>
                <TableHead className="font-bold">Package</TableHead>
                <TableHead className="font-bold">Amount</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Date</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground italic">
                    No transactions found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.map((t) => (
                <TableRow key={t.id} className="group hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono-data text-xs">{t.id.slice(0, 12)}...</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm">{t.distributorId || 'Guest'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{t.razorpayPaymentId || 'No Payment ID'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase font-bold text-[10px]">
                      {t.packageId}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">₹{(t.amount / 100).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {t.status === 'paid' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {t.status === 'created' && <Clock className="w-3 h-3 text-amber-500" />}
                      {t.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      {t.status === 'refunded' && <Ban className="w-3 h-3 text-slate-400" />}
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest",
                        t.status === 'paid' ? 'text-emerald-600' :
                        t.status === 'created' ? 'text-amber-600' :
                        t.status === 'failed' ? 'text-red-600' : 'text-slate-500'
                      )}>
                        {t.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.createdAt?.seconds ? new Date(t.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                        <ArrowUpRight className="w-4 h-4" />
                       </Button>
                       {t.status === 'paid' && (
                         <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-red-500 hover:bg-red-50 font-bold"
                          onClick={() => handleRefund(t.id)}
                         >
                           Refund
                         </Button>
                       )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
