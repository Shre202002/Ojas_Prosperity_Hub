import Link from 'next/link';
import Image from 'next/image';
import { Leaf, ShieldCheck, Network } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { BrandLogo } from './BrandLogo';

const points = [
  { icon: Leaf, text: 'Authentic Ayurvedic and neuro-wellness formulations' },
  { icon: Network, text: 'A transparent binary network with clear matching income' },
  { icon: ShieldCheck, text: 'KYC-verified payouts and a full ledger you can audit' },
];

// Split layout: brand panel (desktop only) + form column.
export function AuthShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-ivory-wash bg-background">
      <aside className="hidden lg:flex flex-col justify-between bg-brand-gradient text-white p-12 relative overflow-hidden">
        <Image
          src={BRAND.logo}
          alt=""
          width={640}
          height={640}
          aria-hidden
          className="absolute -right-40 -bottom-40 opacity-[0.07] rounded-full pointer-events-none"
        />
        <BrandLogo tone="light" size={56} />
        <div className="relative space-y-8 max-w-md">
          <p className="font-deva text-accent text-lg">{BRAND.tagline}</p>
          <h1 className="font-headline text-5xl font-bold leading-[1.1]">
            Wellness rooted in Ayurveda. A network built on trust.
          </h1>
          <ul className="space-y-4 text-white/80">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 text-accent shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} {BRAND.legalName}
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="lg:hidden mb-8">
          <BrandLogo />
        </div>
        <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>{children}</div>
        <Link href="/" className="mt-8 text-sm text-muted-foreground hover:text-primary transition-colors">
          ← Back to website
        </Link>
      </main>
    </div>
  );
}
