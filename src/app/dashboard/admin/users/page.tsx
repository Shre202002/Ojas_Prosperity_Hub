'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/admin/users', { headers: { Authorization: `Bearer ${localStorage.getItem('sjapl_session_token') || ''}` } }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not load users.'); setItems(result.data || []); }).catch(error => toast({ variant: 'destructive', title: 'Users load failed', description: error.message })).finally(() => setLoading(false)); }, [toast]);
  const visible = items.filter(item => `${item.user?.name || ''} ${item.user?.email || ''} ${item.distributor?.uid || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-8 py-8"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h1 className="text-4xl font-headline font-bold">Registered Users</h1><p className="text-muted-foreground">All authenticated users registered on the platform.</p></div><div className="relative md:w-80"><Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="pl-10" /></div></div>{loading ? <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /> : <div className="grid gap-4">{visible.map(item => <Card key={item.user.uid}><CardHeader className="flex flex-row items-center justify-between"><div className="flex items-center gap-3"><Users className="w-5 h-5 text-primary" /><div><CardTitle className="text-lg">{item.user.name || 'Unnamed user'}</CardTitle><p className="text-sm text-muted-foreground">{item.user.email} · {item.distributor?.uid?.slice(0, 10) || item.user.uid.slice(0, 10)}</p></div></div><Badge className={item.distributor?.kycStatus === 'verified' ? 'bg-emerald-600' : 'bg-amber-500'}>{item.distributor?.kycStatus || item.user.role || 'registered'}</Badge></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm"><span><b>Phone</b><br />{item.distributor?.phone || '—'}</span><span><b>Registration</b><br />{item.distributor?.registrationType || 'Account only'}</span><span><b>Package</b><br />{item.distributor?.packageId || '—'}</span><span><b>Sponsor</b><br />{item.distributor?.sponsorId?.slice(0, 10) || 'Root / —'}</span><span><b>Joined</b><br />{item.user.createdAt ? new Date(item.user.createdAt).toLocaleDateString() : '—'}</span></CardContent></Card>)}</div>}</div>;
}
