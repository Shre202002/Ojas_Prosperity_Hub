'use client';

import { useEffect } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, doc } from '@/lib/app-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Copy, 
  ShieldCheck, 
  AlertCircle,
  ArrowUpRight,
  Target,
  Trophy,
  UserPlus,
  Loader2,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = useMemoFirebase(() => (
    user && db ? doc(db, 'distributors', user.uid) : null
  ), [db, user?.uid]);
  
  const { data: distributor, loading, error } = useDoc(distributorRef);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => fetch('/api/network/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: user.email, name: user.displayName }),
    })).catch((provisionError) => {
      console.error('Referral link repair failed:', provisionError);
    });
  }, [user?.uid]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-medium">Loading your business metrics...</p>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Connection Error
            </CardTitle>
            <CardDescription>We couldn't retrieve your data. Please check your network or permissions.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!distributor) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md text-center p-8 space-y-6 border-none shadow-2xl rounded-2xl">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
          <UserPlus className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-headline font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground">It looks like you haven't completed your distributor registration yet.</p>
        </div>
        <Link href="/register" className="block">
          <Button className="w-full h-12 font-bold gap-2">
            Complete Registration <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </Card>
    </div>
  );

  const copyRefLink = (position: 'left' | 'right') => {
    const code = position === 'left' ? distributor.leftReferralCode : distributor.rightReferralCode;
    const link = `${window.location.origin}/register?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: `${position === 'left' ? 'Left' : 'Right'} referral link copied!`, description: 'Share this link to place a new member in that branch.' });
  };

  const isAdmin = distributor.rank === 'Admin';

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 px-4">
      {/* Header Band */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-xl shadow-sm border border-muted">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center font-headline text-3xl font-bold text-primary border-4 border-white shadow-xl relative">
            {distributor.name?.[0] || 'U'}
            {isAdmin && <Crown className="w-6 h-6 text-accent absolute -top-2 -right-2 drop-shadow-md" />}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-bold">{distributor.name}</h1>
              <Badge className={cn(
                "font-bold px-3",
                distributor.status === 'active' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              )}>
                {distributor.status?.toUpperCase()}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-mono-data">
              <span>ID: {distributor.uid?.slice(0, 8).toUpperCase()}</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className={cn(
                  "w-4 h-4",
                  distributor.kycStatus === 'verified' ? 'text-primary' : 
                  distributor.kycStatus === 'pending' ? 'text-[hsl(var(--status-pending))]' : 'text-muted-foreground'
                )} />
                KYC: {distributor.kycStatus?.toUpperCase()}
              </span>
              <Badge variant="outline" className={cn(
                "font-bold",
                isAdmin ? 'text-accent border-accent/20 bg-accent/5' : 'text-primary border-primary/20 bg-primary/5'
              )}>
                {distributor.rank?.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col gap-3 min-w-[320px]">
          <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Your Branch Links</span>
          {(['left', 'right'] as const).map((position) => {
            const code = position === 'left' ? distributor.leftReferralCode : distributor.rightReferralCode;
            return (
              <div key={position} className="flex items-center gap-2">
                <span className="w-12 text-xs font-bold uppercase text-muted-foreground">{position}</span>
                <code className="flex-1 bg-white px-3 py-2 rounded-lg text-xs font-mono-data border border-muted truncate">
                  {code || 'Not configured'}
                </code>
                <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-primary hover:text-white" onClick={() => copyRefLink(position)} disabled={!code}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
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
              { label: 'Incentive Account', val: distributor.incentiveBalance || 0, isMain: true },
              { label: 'Shopping Wallet', val: distributor.shoppingBalance || 0 },
              { label: 'Repurchase Account', val: 0 },
              { label: 'Recharge Account', val: 0 },
            ].map((w, i) => (
              <Card key={i} className="border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{w.label}</p>
                    <p className={cn(
                      "text-2xl font-mono-data font-bold",
                      w.isMain ? "text-accent" : "text-primary"
                    )}>₹{w.val.toLocaleString()}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="group-hover:bg-primary group-hover:text-white rounded-full">
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
            <Card className="border-none shadow-md overflow-hidden bg-primary text-white">
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

            <Card className="border-none shadow-md overflow-hidden bg-secondary text-foreground">
              <CardHeader className="border-b border-black/5">
                <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">Total Members (L/R)</CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-2 gap-8 divide-x divide-black/5">
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
               <Card className="border border-muted shadow-sm bg-white">
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Next Level Target</p>
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Target Left</p>
                        <p className="font-mono-data font-bold">5,000</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Target Right</p>
                        <p className="font-mono-data font-bold">5,000</p>
                      </div>
                    </div>
                 </CardContent>
               </Card>

               <Card className="border border-muted shadow-sm bg-white">
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Next Target Remaining</p>
                      <Trophy className="w-4 h-4 text-accent" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Remaining L</p>
                        <p className="font-mono-data font-bold text-primary">{Math.max(0, 5000 - (distributor.leftBV || 0))}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Remaining R</p>
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
            <Link href="/dashboard/wallet"><Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5">View Detailed Statement</Button></Link>
          </div>
          <Card className="border border-muted shadow-sm bg-white overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y md:divide-y-0 border-muted">
              {[
                { label: 'Direct Sponsor', val: 0 },
                { label: 'Sales Matching', val: 0 },
                { label: 'Sales Level', val: 0 },
                { label: 'Repurchase', val: 0 },
                { label: 'Royalty Club', val: 0 },
                { label: 'Total Incentive', val: distributor.incentiveBalance || 0, highlight: true },
              ].map((e, i) => (
                <div key={i} className={cn(
                  "p-6 space-y-2",
                  e.highlight ? 'bg-primary/5' : ''
                )}>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter leading-none">{e.label}</p>
                  <p className={cn(
                    "text-xl font-mono-data font-bold",
                    e.highlight ? 'text-accent' : 'text-primary'
                  )}>₹{e.val.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper icon for missing distributor state
function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
