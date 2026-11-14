'use client';

import Link from 'next/link';
import { AlertCircle, Check, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Stage = 'submitted' | 'review' | 'verified';
const STAGES: { key: Stage; title: string; sub: string }[] = [
  { key: 'submitted', title: 'Documents submitted', sub: 'We have received everything.' },
  { key: 'review', title: 'Under review', sub: 'Usually 24 to 48 business hours.' },
  { key: 'verified', title: 'Verified', sub: 'Withdrawals and referrals unlock.' },
];

function Timeline({ reached }: { reached: number }) {
  return (
    <ol className="mx-auto max-w-sm space-y-4 text-left">
      {STAGES.map((s, i) => {
        const done = i < reached, now = i === reached;
        return (
          <li key={s.key} className="flex gap-3">
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-xs font-bold', done ? 'border-primary bg-primary text-primary-foreground' : now ? 'border-primary text-primary' : 'border-muted text-muted-foreground')}>
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span>
              <span className={cn('block text-sm font-semibold', !done && !now && 'text-muted-foreground')}>{s.title}</span>
              <span className="block text-xs text-muted-foreground">{s.sub}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Result screens for a member who has already submitted: just submitted, pending review, or verified. */
export function KycStatusCard({ status }: { status: 'submitted' | 'pending' | 'verified' }) {
  const verified = status === 'verified';
  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-10" aria-live="polite">
      <div className={cn('mx-auto grid h-16 w-16 place-items-center rounded-2xl', verified ? 'bg-primary text-primary-foreground' : 'bg-[hsl(var(--status-pending))]/15 text-[hsl(var(--status-pending))]')}>
        {verified ? <ShieldCheck className="h-8 w-8" aria-hidden /> : <Clock className="h-8 w-8" aria-hidden />}
      </div>
      <h2 className="mt-5 font-headline text-2xl font-bold text-primary">{verified ? 'You are verified' : status === 'submitted' ? 'Documents submitted' : 'Awaiting approval'}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {verified ? 'Your identity is confirmed. You now have full access to incentives and network features, and you can refer others.' : 'Thank you. Our team is checking your documents. We will update this page as soon as there is a decision.'}
      </p>
      <div className="mt-8"><Timeline reached={verified ? 3 : 1} /></div>
      <Button asChild className="mt-8 h-11 rounded-xl px-6"><Link href="/dashboard">Back to dashboard</Link></Button>
    </section>
  );
}

export function KycRejectedNotice({ reason }: { reason?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-destructive"><AlertCircle className="h-4 w-4" aria-hidden />Your last submission was not approved</p>
      <p className="mt-1 text-sm text-destructive/90">{reason || 'The documents were unclear or invalid.'}</p>
      <p className="mt-2 text-xs text-muted-foreground">Please fix this and submit again. It only takes a few minutes.</p>
    </div>
  );
}
