
'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/lib/app-auth';
import { GenealogyTree } from '@/components/network/GenealogyTree';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Search, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import AdminTreesPage from '@/app/dashboard/admin/trees/page';

export default function NetworkPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const [search, setSearch] = useState('');

  if (!user) return null;
  if (user.role === 'admin' || user.email === 'sriyanshgupta24@gmail.com') return <AdminTreesPage />;

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold">My Network</h1>
          <p className="text-muted-foreground max-w-lg">
            Track your binary placement and team on each leg.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search downline by ID..." 
            className="pl-10 h-10 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3 text-sm font-medium text-muted-foreground shadow-sm w-fit">
        <Info className="w-4 h-4 text-primary" />
        <span>Node expansion is restricted to your own downline.</span>
      </div>

      <Card className="border-none shadow-xl bg-white/50 backdrop-blur-md overflow-hidden">
        <CardHeader className="border-b bg-white">
          <CardTitle className="font-headline text-2xl font-bold">Binary Placement</CardTitle>
          <CardDescription>Your left and right legs, with team counts on each side.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <GenealogyTree rootId={user.uid} />
        </CardContent>
      </Card>
    </div>
  );
}
