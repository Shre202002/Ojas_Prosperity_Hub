'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, FileUp, FileText, Loader2, Search, XCircle } from 'lucide-react';

type KycRow = { distributor: any; user: any; submission: any };
const token = () => localStorage.getItem('sjapl_session_token') || '';
const documents = [
  { type: 'idProof' as const, label: 'ID Proof' },
  { type: 'addressProof' as const, label: 'Address Proof' },
  { type: 'selfie' as const, label: 'Live Selfie' },
];

export default function AdminKYCReviewHub() {
  const { toast } = useToast();
  const [rows, setRows] = useState<KycRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  async function load() {
    const response = await fetch('/api/admin/kyc', { headers: { Authorization: `Bearer ${token()}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load KYC records.');
    setRows(result.data || []);
  }

  useEffect(() => {
    load().catch(error => toast({ variant: 'destructive', title: 'KYC load failed', description: error.message })).finally(() => setLoading(false));
  }, [toast]);

  async function upload(row: KycRow, event: React.ChangeEvent<HTMLInputElement>, type: 'idProof' | 'addressProof' | 'selfie') {
    const file = event.target.files?.[0]; if (!file) return;
    setWorking(row.distributor.uid);
    try {
      const form = new FormData(); form.append('distributorId', row.distributor.uid); form.append(type, file);
      const response = await fetch('/api/admin/kyc', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: form });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Upload failed.');
      await load(); toast({ title: 'Document uploaded', description: 'The member is now pending review.' });
    } catch (error: any) { toast({ variant: 'destructive', title: 'Upload failed', description: error.message }); }
    finally { setWorking(null); event.target.value = ''; }
  }

  async function decide(row: KycRow, status: 'verified' | 'rejected') {
    setWorking(row.distributor.uid);
    try {
      const rejectedDocuments = status === 'rejected' ? window.prompt('Enter rejected documents: idProof, addressProof, selfie', 'idProof, addressProof, selfie')?.split(',').map(value => value.trim()).filter(value => documents.some(document => document.type === value)) : [];
      const response = await fetch('/api/admin/kyc', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify({ distributorId: row.distributor.uid, status, rejectionReason: status === 'rejected' ? 'Selected documents need correction.' : null, rejectedDocuments }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'KYC decision failed.');
      await load(); toast({ title: `KYC ${status}`, description: `${row.user?.name || row.distributor.uid} updated.` });
    } catch (error: any) { toast({ variant: 'destructive', title: 'Action failed', description: error.message }); }
    finally { setWorking(null); }
  }

  const visible = rows.filter(row => `${row.user?.name || ''} ${row.user?.email || ''} ${row.distributor.uid}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-8 py-8">
      <div className="bg-primary text-primary-foreground p-8 rounded-xl flex flex-col md:flex-row justify-between gap-4">
        <div><h1 className="text-4xl font-headline font-bold">Global KYC Review Hub</h1><p className="text-muted-foreground">Review every paid non-admin member, including members with no submission.</p></div>
        <div className="relative md:w-80"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..." className="pl-10 bg-white/10 border-white/10 text-white" /></div>
      </div>
      {loading ? <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /> : (
        <div className="grid gap-5">
          {visible.map(row => {
            const status = row.submission?.status || row.distributor.kycStatus || 'not submitted';
            const pending = status === 'pending' || status === 'not submitted';
            return <Card key={row.distributor.uid} className={`shadow-lg transition-all ${pending ? 'border-2 border-amber-300 shadow-amber-100' : 'border-muted'}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div><CardTitle>{row.user?.name || row.distributor.name}</CardTitle><p className="text-sm text-muted-foreground">{row.user?.email} · {row.distributor.uid.slice(0, 10)}</p></div>
                <Badge className={status === 'verified' ? 'bg-emerald-600' : status === 'rejected' ? 'bg-red-600' : 'bg-amber-500'}>{status}</Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-3">{documents.map(document => { const rejected = row.submission?.rejectedDocuments?.includes(document.type); const canUpload = status !== 'verified' && (status !== 'rejected' || rejected); return <div key={document.type} className={`flex items-center gap-2 rounded-xl border p-2 ${pending ? 'border-primary/30 bg-primary/5' : 'border-muted bg-background'}`}>{canUpload && <label className="inline-flex cursor-pointer"><span className="inline-flex items-center h-9 px-3 rounded-lg border bg-card text-xs font-bold"><FileUp className="w-4 h-4 mr-1" />{status === 'rejected' ? 'Replace' : row.submission?.[document.type]?.url ? 'Replace' : 'Upload'} {document.label}</span><input type="file" accept="image/*,application/pdf" className="hidden" onChange={event => upload(row, event, document.type)} disabled={working === row.distributor.uid} /></label>}{row.submission?.[document.type]?.url ? <Button asChild size="sm" className={`h-9 gap-1 font-bold ${pending ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/20' : 'bg-slate-700 text-white'}`}><a href={row.submission[document.type].url} target="_blank" rel="noreferrer"><FileText className="w-4 h-4" />View</a></Button> : <span className="text-[10px] font-bold uppercase text-muted-foreground px-2">Missing</span>}</div>; })}</div>
                <div className="flex flex-wrap gap-3 border-t pt-4"><Button onClick={() => decide(row, 'verified')} disabled={working === row.distributor.uid || !row.submission} className="bg-emerald-600"><CheckCircle2 className="w-4 h-4 mr-2" />Approve</Button><Button onClick={() => decide(row, 'rejected')} disabled={working === row.distributor.uid || !row.submission} variant="destructive"><XCircle className="w-4 h-4 mr-2" />Reject</Button></div>
              </CardContent>
            </Card>;
          })}
        </div>
      )}
    </div>
  );
}
