'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
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

  // Initial root is the first distributor in the system
  const rootQuery = useMemoFirebase(() => (
    db ? query(collection(db, 'distributors'), limit(1)) : null
  ), [db]);
  const { data: firstDist } = useCollection(rootQuery, 'users (root/first distributor)');

  const displayRootId = rootId || firstDist?.[0]?.uid;

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl font-headline font-bold">Global Network Audit</h1>
          <p className="text-slate-400 max-w-lg font-medium">
            Company-wide visibility into every distributor's structure and binary placement.
          </p>
        </div>

        <div className="relative w-full md:w-96 relative z-10">
          <Search className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
          <Input 
            placeholder="Search ANY distributor ID..." 
            className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-500"
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
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currently Viewing</p>
              <p className="text-sm font-bold font-mono-data">{displayRootId || 'Loading...'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit Status</p>
              <p className="text-sm font-bold">Unrestricted Access</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sponsor" className="space-y-8">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm h-14 border">
          <TabsTrigger value="sponsor" className="px-10 h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
            <Users className="w-4 h-4 mr-2" /> Global Sponsor Tree
          </TabsTrigger>
          <TabsTrigger value="placement" className="px-10 h-full rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold transition-all">
            <Network className="w-4 h-4 mr-2" /> Global Binary Tree
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sponsor" className="animate-in fade-in duration-500">
          <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
            <CardHeader className="border-b bg-white p-8">
              <CardTitle className="font-headline text-3xl font-bold">Sponsor Genealogy</CardTitle>
              <CardDescription>Viewing personally referred downlines for ID: {displayRootId}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {displayRootId && <GenealogyTree rootId={displayRootId} mode="sponsor" unrestricted={true} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placement" className="animate-in fade-in duration-500">
          <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
            <CardHeader className="border-b bg-white p-8">
              <CardTitle className="font-headline text-3xl font-bold">Binary Placement</CardTitle>
              <CardDescription>Viewing spillover and binary structure for ID: {displayRootId}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {displayRootId && <GenealogyTree rootId={displayRootId} mode="placement" unrestricted={true} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
