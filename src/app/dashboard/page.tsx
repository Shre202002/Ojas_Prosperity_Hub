
'use client';

import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Copy, 
  Share2, 
  ShieldCheck, 
  AlertCircle,
  ArrowUpRight,
  Target,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = user && db ? doc(db, 'distributors', user.uid) : null;
  const { data: distributor, loading } = useDoc(distributorRef);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <TrendingUp className="w-12 h-12 animate-pulse text-primary mx-auto" />
        <p className="text-muted-foreground font-medium">Loading your business metrics...</p>
      </div>
    </div>
  );

  if (!distributor) return null;

  const copyRefLink = () => {
    const link = `${window.location.origin}/register?ref=${distributor.referralCode}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Referral link copied!', description: 'Share this to grow your network.' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
      {/* Header Band */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center font-headline text-3xl font-bold text-primary border-4 border-white shadow-xl">
            {distributor.name[0]}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold">{distributor.name}</h1>
              <Badge className={distributor.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}>
                {distributor.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-mono-data">
              <span>ID: {distributor.uid.slice(0, 8).toUpperCase()}</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className={`w-4 h-4 ${distributor.kycStatus === 'verified' ? 'text-emerald-500' : 'text-slate-400'}`} />
                KYC: {distributor.kycStatus.toUpperCase()}
              </span>
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-bold">
                {distributor.rank.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col gap-3 min-w-[300px]">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Your Referral Link</span>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded-lg text-xs font-mono-data border">
              {distributor.referralCode}
            </code>
            <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-primary hover:text-white" onClick={copyRefLink}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-emerald-500 hover:text-white">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallets Group */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-headline text-xl font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Wallets
          </h3>
          <div className="grid gap-4">
            {[
              { label: 'Incentive Account', val: distributor.incentiveBalance || 0, color: 'primary' },
              { label: 'Shopping Wallet', val: distributor.shoppingBalance || 0, color: 'emerald' },
              { label: 'Repurchase Account', val: 0, color: 'blue' },
              { label: 'Recharge Account', val: 0, color: 'purple' },
            ].map((w, i) => (
              <Card key={i} className="border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{w.label}</p>
                    <p className="text-2xl font-mono-data font-bold">₹{w.val.toLocaleString()}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="group-hover:bg-slate-100 rounded-full">
                    <ArrowUpRight className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business/BV Group */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-headline text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Business Performance
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-none shadow-md overflow-hidden bg-slate-900 text-white">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">Current Level BV (L/R)</CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-2 gap-8 divide-x divide-white/10">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold opacity-60 uppercase">Left</p>
                  <p className="text-3xl font-mono-data font-bold">{distributor.leftBV || 0}</p>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold opacity-60 uppercase">Right</p>
                  <p className="text-3xl font-mono-data font-bold">{distributor.rightBV || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden bg-primary text-white">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60 text-white/80">Total Direct Sellers (L/R)</CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-2 gap-8 divide-x divide-white/10">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold opacity-70 uppercase">Left</p>
                  <p className="text-3xl font-mono-data font-bold">{distributor.leftCount || 0}</p>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold opacity-70 uppercase">Right</p>
                  <p className="text-3xl font-mono-data font-bold">{distributor.rightCount || 0}</p>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
               <Card className="border-none shadow-md bg-white">
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Next Level Target</p>
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Target Left</p>
                        <p className="font-mono-data font-bold">5,000</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Target Right</p>
                        <p className="font-mono-data font-bold">5,000</p>
                      </div>
                    </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-md bg-white">
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Next Target Remaining</p>
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Remaining L</p>
                        <p className="font-mono-data font-bold text-primary">{Math.max(0, 5000 - (distributor.leftBV || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Remaining R</p>
                        <p className="font-mono-data font-bold text-primary">{Math.max(0, 5000 - (distributor.rightBV || 0))}</p>
                      </div>
                    </div>
                 </CardContent>
               </Card>
            </div>
          </div>
        </div>

        {/* Earnings Group */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Earnings Overview
            </h3>
            <Button variant="ghost" size="sm" className="text-primary font-bold">View Detailed Statement</Button>
          </div>
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y md:divide-y-0">
              {[
                { label: 'Direct Sponsor', val: 0 },
                { label: 'Sales Matching', val: 0 },
                { label: 'Sales Level', val: 0 },
                { label: 'Repurchase', val: 0 },
                { label: 'Royalty Club', val: 0 },
                { label: 'Total Incentive', val: distributor.incentiveBalance || 0, highlight: true },
              ].map((e, i) => (
                <div key={i} className={`p-6 space-y-2 ${e.highlight ? 'bg-primary/5' : ''}`}>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter leading-none">{e.label}</p>
                  <p className={`text-xl font-mono-data font-bold ${e.highlight ? 'text-primary' : ''}`}>₹{e.val.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
