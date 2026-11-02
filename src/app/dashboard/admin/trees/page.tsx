'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection, query } from '@/lib/app-auth';
import { GenealogyTree } from '@/components/network/GenealogyTree';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const globalRoots = distributors?.filter((item: any) => !item.sponsorId) || [];

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-primary p-8 rounded-2xl shadow-2xl text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl font-headline font-bold">Global Network Audit</h1>
          <p className="text-muted-foreground max-w-lg font-medium">
            Review the Admin organization or inspect every global network root.
          </p>
        </div>

        <div className="relative w-full md:w-96 relative z-10">
          <Search className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search ANY distributor ID..." 
            className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm) {
                setRootId(searchTerm);
              }
            }}
          />
          <div className="absolute right-3 top-3.5">
            <Badge className="bg-primary hover:bg-primary font-bold">Admin Mode</Badge>
          </div>
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
              <p className="text-sm font-bold font-mono-data">{displayRootId || 'Loading...'}</p>
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
