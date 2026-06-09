'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
  Copy, 
  Share2, 
  ArrowUpRight, 
  Wallet, 
  Users, 
  TrendingUp, 
  Award,
  CircleDot,
  Network,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Mon', income: 400 },
  { name: 'Tue', income: 1200 },
  { name: 'Wed', income: 900 },
  { name: 'Thu', income: 1500 },
  { name: 'Fri', income: 2000 },
  { name: 'Sat', income: 2800 },
  { name: 'Sun', income: 1900 },
];

export default function Dashboard() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const userRef = user && db ? doc(db, 'users', user.uid) : null;
  const { data: profileData, loading } = useDoc(userRef);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-primary text-white border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors"></div>
          <CardHeader className="relative">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-headline">Welcome back, {profileData?.name || 'Member'}!</CardTitle>
                <CardDescription className="text-white/70 text-lg">You are just 150 BV away from Gold Rank.</CardDescription>
              </div>
              <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                <Award className="w-4 h-4" /> {profileData?.role?.toUpperCase() || 'USER'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative">
             <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>Rank Progress</span>
                <span>75%</span>
              </div>
              <Progress value={75} className="bg-white/20 h-3" />
            </div>
            <div className="flex items-center gap-4">
               <div className="flex-1 bg-white/10 p-4 rounded-2xl">
                <div className="text-xs opacity-60 uppercase font-bold tracking-wider mb-1">Referral Link</div>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs truncate">ojascare.pro/join?ref={user?.uid.slice(0, 6)}</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button variant="secondary" className="h-14 px-6 font-bold shadow-xl">
                <Share2 className="w-4 h-4 mr-2" /> Share Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-secondary text-secondary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-5xl font-headline font-bold">₹14,580</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-bold opacity-60">This Week</div>
                <div className="text-lg font-bold">₹2,400</div>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <div className="text-[10px] uppercase font-bold opacity-60">Total Earnings</div>
                <div className="text-lg font-bold">₹88,200</div>
              </div>
            </div>
            <Button variant="outline" className="w-full bg-white/20 border-none font-bold hover:bg-white/40">Withdraw Funds</Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Left Team', val: '458', icon: Users, color: 'text-primary' },
          { title: 'Right Team', val: '512', icon: Users, color: 'text-primary' },
          { title: 'Left BV', val: '1,240', icon: TrendingUp, color: 'text-secondary' },
          { title: 'Right BV', val: '890', icon: TrendingUp, color: 'text-secondary' },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.title}</p>
                <h3 className="text-2xl font-headline font-bold">{item.val}</h3>
              </div>
              <div className={cn("p-4 rounded-2xl bg-muted/50", item.color)}>
                <item.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Tree Quick Link */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Earnings Growth</CardTitle>
              <CardDescription>Daily performance overview</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-primary font-bold">
              <ArrowUpRight className="w-4 h-4" /> 12.5% increase
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#2E7D32" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-white group cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Network Overview</CardTitle>
              <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                <Network className="w-5 h-5 text-primary" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around mb-6 py-4 border-y border-dashed">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Directs</div>
                  <div className="text-2xl font-bold">24</div>
                </div>
                <div className="h-8 w-px bg-border"></div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Levels</div>
                  <div className="text-2xl font-bold">12</div>
                </div>
              </div>
              <Link href="/dashboard/tree">
                <Button className="w-full h-12 font-bold gap-2">View Binary Tree <ChevronRight className="w-4 h-4" /></Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-[#2E7D32]/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CircleDot className="w-5 h-5 text-secondary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'New Direct Referral', time: '2 hours ago', amount: '+₹400' },
                { title: 'Weekly Matching', time: 'Yesterday', amount: '+₹1,200' },
                { title: 'Withdrawal Approved', time: '3 days ago', amount: '-₹5,000' },
              ].map((act, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-bold">{act.title}</div>
                    <div className="text-xs text-muted-foreground">{act.time}</div>
                  </div>
                  <div className={`font-headline font-bold ${act.amount.startsWith('+') ? 'text-primary' : 'text-destructive'}`}>
                    {act.amount}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}