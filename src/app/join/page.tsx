import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import { AuthShell } from '@/components/layout/AuthShell';
import { BRAND } from '@/lib/brand';

const perks = [
  'Mentorship and team support from your sponsor',
  'Placement into an established binary network',
  'Wallet, matching income and transparent ledger',
];

export default function JoinPage() {
  return (
    <AuthShell>
      <Card className="shadow-xl border-border/60">
        <CardHeader className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <CardTitle className="text-3xl">Join {BRAND.short}</CardTitle>
          <CardDescription>Membership is by invitation. Have your sponsor&apos;s referral code ready.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3 text-sm text-muted-foreground">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3"><Zap className="w-4 h-4 text-accent shrink-0" /> {perk}</li>
            ))}
          </ul>
          <Button asChild className="w-full h-12 font-semibold gap-2">
            <Link href="/register">Continue with referral code <ChevronRight className="w-4 h-4" /></Link>
          </Button>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" /> All members complete KYC verification before payouts.
          </p>
          <div className="gold-rule" />
          <p className="text-sm text-center text-muted-foreground">
            Already a member? <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
