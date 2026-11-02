'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Copy, Crown, Layers, Loader2, ShieldCheck, Target, TrendingUp, Trophy, UserPlus, Users, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, doc } from '@/lib/app-auth';
import { useToast } from '@/hooks/use-toast';
import { CountUp, Delta, GlassCard, PageHead, ProgressBar, container, item } from '@/components/vertix/primitives';

const TARGET_BV = 5000;
const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] items-center justify-center">{children}</div>;
}

export default function DashboardPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = useMemoFirebase(() => (user && db ? doc(db, 'distributors', user.uid) : null), [db, user?.uid]);
  const { data: distributor, loading, error } = useDoc(distributorRef);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => fetch('/api/network/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: user.email, name: user.displayName }),
    })).catch((provisionError) => { console.error('Referral link repair failed:', provisionError); });
  }, [user?.uid]);

  if (loading) return (
    <Centered>
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin" style={{ color: 'var(--vx-accent)' }} />
        <p className="mt-3 text-sm" style={{ color: 'var(--vx-mute)' }}>Loading your business metrics...</p>
      </div>
    </Centered>
  );

  if (error) return (
    <Centered>
      <div className="vx-card max-w-md p-6">
        <p className="flex items-center gap-2 font-semibold text-[var(--vx-bad)]"><AlertCircle className="h-5 w-5" /> Connection Error</p>
        <p className="mt-2 text-sm" style={{ color: 'var(--vx-mute)' }}>We couldn't retrieve your data. Please check your network or permissions.</p>
      </div>
    </Centered>
  );

  if (!distributor) return (
    <Centered>
      <div className="vx-card max-w-md space-y-5 p-8 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl" style={{ background: 'var(--vx-accent-soft)', color: 'var(--vx-accent)' }}><UserPlus className="h-8 w-8" /></span>
        <div><h2 className="text-2xl font-semibold">Profile Not Found</h2><p className="mt-2 text-sm" style={{ color: 'var(--vx-mute)' }}>It looks like you haven't completed your distributor registration yet.</p></div>
        <Link href="/register" className="flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold" style={{ background: 'var(--vx-on)', color: 'var(--vx-on-fg)' }}>Complete Registration <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </Centered>
  );

  const isAdmin = distributor.rank === 'Admin';
  const kyc = String(distributor.kycStatus || 'none');
  const leftBV = Number(distributor.leftBV || 0), rightBV = Number(distributor.rightBV || 0);
  const leftCount = Number(distributor.leftCount || 0), rightCount = Number(distributor.rightCount || 0);
  const incentive = Number(distributor.incentiveBalance || 0), shopping = Number(distributor.shoppingBalance || 0);
  const pct = (v: number) => Math.min(100, Math.round((v / TARGET_BV) * 100));
  const chart = [{ side: 'Left', bv: leftBV }, { side: 'Right', bv: rightBV }];

  const copyRefLink = (position: 'left' | 'right') => {
    const code = position === 'left' ? distributor.leftReferralCode : distributor.rightReferralCode;
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${code}`);
    toast({ title: `${position === 'left' ? 'Left' : 'Right'} referral link copied!`, description: 'Share this link to place a new member in that branch.' });
  };

  const wallets = [
    { label: 'Incentive', val: incentive, on: true },
    { label: 'Shopping', val: shopping, on: shopping > 0 },
    { label: 'Repurchase', val: 0, on: false },
  ];
  const stats = [
    { label: 'Incentive Balance', value: incentive, prefix: '₹', hero: true, icon: Wallet, note: 'Available now' },
    { label: 'Left BV', value: leftBV, icon: TrendingUp, note: `${leftCount} members` },
    { label: 'Right BV', value: rightBV, icon: TrendingUp, note: `${rightCount} members` },
    { label: 'Team Size', value: leftCount + rightCount, icon: Users, note: 'Left + right' },
  ];
  const earnings = [
    { label: 'Direct Sponsor', val: 0 }, { label: 'Sales Matching', val: 0 }, { label: 'Sales Level', val: 0 },
    { label: 'Repurchase', val: 0 }, { label: 'Royalty Club', val: 0 }, { label: 'Total Incentive', val: incentive, hot: true },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <PageHead title={`${greeting()}, ${String(distributor.name || 'Member').split(' ')[0]}`} sub="Stay on top of your network, monitor progress, and track your earnings." />
        <motion.div variants={item} className="mb-6 flex flex-wrap items-center gap-2 text-xs lg:mb-0">
          {isAdmin && <span className="flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold" style={{ background: 'var(--vx-accent-soft)', color: 'var(--vx-accent)' }}><Crown className="h-3.5 w-3.5" />Admin</span>}
          <span className="vx-pill flex items-center gap-1.5 px-3 py-1.5 font-medium"><ShieldCheck className="h-3.5 w-3.5" style={{ color: kyc === 'verified' ? 'var(--vx-good)' : 'var(--vx-mute)' }} />KYC: {kyc.toUpperCase()}</span>
          <span className="vx-pill px-3 py-1.5 font-medium">{String(distributor.rank || 'Member').toUpperCase()}</span>
          <span className="vx-pill px-3 py-1.5 font-mono font-medium">ID {String(distributor.uid || '').slice(0, 8).toUpperCase()}</span>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1fr]">
        <GlassCard className="lg:col-span-1">
          <p className="text-sm" style={{ color: 'var(--vx-mute)' }}>Total Wallet Balance</p>
          <p className="mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl"><CountUp value={incentive + shopping} prefix="₹" duration={1600} /></p>
          <p className="mt-2 text-xs" style={{ color: 'var(--vx-mute)' }}>Incentive + shopping wallets</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link href="/dashboard/wallet" className="flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-transform hover:scale-[1.03]" style={{ background: 'var(--vx-on)', color: 'var(--vx-on-fg)' }}>Open wallet</Link>
            <Link href="/dashboard/network" className="flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-transform hover:scale-[1.03]" style={{ background: 'var(--vx-soft)' }}>My network</Link>
          </div>
          <div className="mt-5 rounded-2xl p-3" style={{ background: 'var(--vx-soft)' }}>
            <p className="mb-2 text-xs font-medium">Wallets</p>
            <div className="grid grid-cols-3 gap-2">
              {wallets.map((w) => (
                <motion.div key={w.label} data-vx-motion whileHover={{ y: -3 }} className="min-w-0 rounded-xl p-2.5" style={{ background: 'var(--vx-card)' }}>
                  <p className="truncate text-[11px] font-semibold">{w.label}</p>
                  <p className="mt-1.5 truncate text-[13px] font-semibold">{money(w.val)}</p>
                  <p className={`mt-1 text-[10px] font-medium ${w.on ? 'text-[var(--vx-good)]' : ''}`} style={w.on ? undefined : { color: 'var(--vx-mute)' }}>{w.on ? 'Active' : 'Empty'}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>

        <motion.div variants={item} className="vx-card grid grid-cols-2 gap-3 p-3 sm:p-4">
          {stats.map((s) => (
            <motion.div key={s.label} data-vx-motion whileHover={{ y: -4, scale: 1.02 }} className={`flex min-h-[132px] min-w-0 flex-col justify-between rounded-2xl p-3.5 sm:min-h-[150px] sm:p-4 ${s.hero ? 'vx-orange' : ''}`} style={s.hero ? undefined : { background: 'var(--vx-soft)' }}>
              <div className="flex items-center justify-between gap-2 text-xs"><span className="truncate" style={s.hero ? { opacity: 0.85 } : { color: 'var(--vx-mute)' }}>{s.label}</span><s.icon className="h-4 w-4 shrink-0 opacity-70" /></div>
              <p className="break-words text-2xl font-semibold tracking-tight sm:text-3xl"><CountUp value={s.value} prefix={s.prefix || ''} duration={1500} /></p>
              <p className="truncate text-[11px]" style={s.hero ? { opacity: 0.8 } : { color: 'var(--vx-mute)' }}>{s.note}</p>
            </motion.div>
          ))}
        </motion.div>

        <GlassCard className="lg:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-semibold">Business Performance</h3>
          <p className="text-xs" style={{ color: 'var(--vx-mute)' }}>Current level BV on your left and right legs</p>
          <div className="mt-4 rounded-2xl p-3" style={{ background: 'var(--vx-soft)' }}>
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--vx-line)" strokeDasharray="3 3" />
                  <XAxis dataKey="side" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--vx-mute)' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--vx-mute)' }} allowDecimals={false} />
                  <Bar dataKey="bv" radius={[8, 8, 0, 0]} barSize={46} isAnimationActive animationDuration={1400}>
                    <Cell fill="var(--vx-accent)" /><Cell fill="var(--vx-on)" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Next Level Target</h3><Target className="h-4 w-4" style={{ color: 'var(--vx-accent)' }} /></div>
          <div className="mt-5 space-y-5">
            {[{ l: 'Left', v: leftBV }, { l: 'Right', v: rightBV }].map((r) => (
              <div key={r.l}>
                <div className="mb-2 flex justify-between text-xs"><span className="font-medium">{r.l} BV</span><span style={{ color: 'var(--vx-mute)' }}>{r.v.toLocaleString('en-IN')} / {TARGET_BV.toLocaleString('en-IN')}</span></div>
                <ProgressBar pct={pct(r.v)} />
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--vx-mute)' }}>{Math.max(0, TARGET_BV - r.v).toLocaleString('en-IN')} BV remaining</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="xl:col-span-1">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Your Branch Links</h3><Layers className="h-4 w-4" style={{ color: 'var(--vx-accent)' }} /></div>
          {!isAdmin && kyc !== 'verified' ? (
            <p className="mt-4 text-sm" style={{ color: 'var(--vx-mute)' }}>
              Complete KYC to activate your referral links{kyc === 'pending' ? ' (your documents are under review)' : ''}.{' '}
              {kyc !== 'pending' && <Link href="/dashboard/kyc" className="font-semibold underline underline-offset-4" style={{ color: 'var(--vx-accent)' }}>Submit KYC</Link>}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {(['left', 'right'] as const).map((position) => {
                const code = position === 'left' ? distributor.leftReferralCode : distributor.rightReferralCode;
                return (
                  <div key={position} className="flex items-center gap-2">
                    <span className="w-11 text-[11px] font-bold uppercase" style={{ color: 'var(--vx-mute)' }}>{position}</span>
                    <code className="min-w-0 flex-1 truncate rounded-xl px-3 py-2.5 text-xs" style={{ background: 'var(--vx-soft)' }}>{code || 'Not configured'}</code>
                    <button onClick={() => copyRefLink(position)} disabled={!code} aria-label={`Copy ${position} referral link`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full transition-transform hover:scale-105 disabled:opacity-40" style={{ background: 'var(--vx-on)', color: 'var(--vx-on-fg)' }}><Copy className="h-4 w-4" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2 xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold"><Trophy className="h-5 w-5" style={{ color: 'var(--vx-accent)' }} />Earnings Overview</h3>
            <Link href="/dashboard/wallet" className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: 'var(--vx-soft)' }}>View detailed statement</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {earnings.map((e, i) => (
              <motion.div key={e.label} data-vx-motion initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.07 }} className="min-w-0 rounded-2xl p-4" style={e.hot ? { background: 'var(--vx-accent-soft)' } : { background: 'var(--vx-soft)' }}>
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--vx-mute)' }}>{e.label}</p>
                <p className="mt-2 truncate text-lg font-semibold" style={e.hot ? { color: 'var(--vx-accent)' } : undefined}>{money(e.val)}</p>
                {e.hot && <Delta text="Total" />}
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}
