'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection, query } from '@/lib/app-auth';
import { GenealogyTree } from '@/components/network/GenealogyTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Network, Users, Search, ShieldCheck, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminTreesPage() {
  const db = useFirestore();
  const [rootId, setRootId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load all distributors once so Admin and Global views use the same source.
  const rootQuery = useMemoFirebase(() => (
    db ? query(collection(db, 'distributors')) : null
  ), [db]);
  const { data: distributors } = useCollection(rootQuery, 'users (global tree)');

  const adminRoot = distributors?.find((item: any) => item.rank === 'Admin') || distributors?.find((item: any) => !item.sponsorId);
  const displayRootId = rootId || adminRoot?.uid;
  const viewing = distributors?.find((item: any) => item.uid === displayRootId);
  const viewingName = viewing?.name || (distributors ? 'Member not found' : 'Loading...');
  const globalRoots = distributors?.filter((item: any) => !item.sponsorId) || [];

  return (
    <div className="space-y-8 py-8">
      <div className="vx-banner flex flex-col justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center">
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-headline font-bold sm:text-4xl">Global Network Audit</h1>
          <p className="max-w-lg font-medium">Review the Admin organization or inspect every global network root.</p>
        </div>

        <div className="relative z-10 w-full md:w-96">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
          <Input
            placeholder="Search any member by name or ID..."
            aria-label="Search any member by name or ID"
            className="h-14 rounded-2xl border-white/25 bg-white/10 pl-12 pr-32 text-white backdrop-blur placeholder:text-white/65 focus-visible:ring-white/50"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm) {
                const q = searchTerm.trim().toLowerCase();
                const hit = distributors?.find((d: any) => d.uid === searchTerm.trim() || String(d.name || '').toLowerCase() === q || String(d.name || '').toLowerCase().includes(q));
                setRootId(hit?.uid || searchTerm.trim());
              }
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: 'var(--tree-admin)', color: '#1a1300' }}>Admin Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Currently Viewing</p>
              <p className="text-sm font-bold">{displayRootId ? viewingName : 'Loading...'}</p>{viewing?.rank && <p className="text-[11px] text-muted-foreground">{viewing.rank}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Audit Status</p>
              <p className="text-sm font-bold">Unrestricted Access</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="admin" className="space-y-8">
        <TabsList className="bg-card p-1 rounded-2xl shadow-sm h-14 border">
          <TabsTrigger value="admin" className="px-10 h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold transition-all">
            <Users className="w-4 h-4 mr-2" /> Admin Tree
          </TabsTrigger>
          <TabsTrigger value="global" className="px-10 h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold transition-all">
            <Network className="w-4 h-4 mr-2" /> Global Tree
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="animate-in fade-in duration-500">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden rounded-2xl">
            <CardHeader className="border-b bg-card p-8">
              <CardTitle className="font-headline text-3xl font-bold">Admin Tree</CardTitle>
              <CardDescription>All users on the Admin's left and right legs. Use a member's join link to place a new member below them on the same side.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {displayRootId && <GenealogyTree rootId={displayRootId} unrestricted={true} joinCodes={{ left: adminRoot?.leftReferralCode, right: adminRoot?.rightReferralCode }} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="animate-in fade-in duration-500">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden rounded-2xl">
            <CardHeader className="border-b bg-card p-8">
              <CardTitle className="font-headline text-3xl font-bold">Global Tree</CardTitle>
              <CardDescription>All registered users, including the Admin and independent roots.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-12">{globalRoots.map((root: any) => <GenealogyTree key={root.uid} rootId={root.uid} unrestricted={true} />)}</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
