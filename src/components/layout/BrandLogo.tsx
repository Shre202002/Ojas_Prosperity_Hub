import Link from 'next/link';
import Image from 'next/image';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

type Props = { size?: number; showName?: boolean; href?: string; className?: string; tone?: 'dark' | 'light' };

// The seal is a circle on white, so rounded-full clips the white corners.
export function BrandLogo({ size = 44, showName = true, href = '/', className, tone = 'dark' }: Props) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-3', className)} aria-label={BRAND.name}>
      <Image
        src={BRAND.logo}
        alt={`${BRAND.name} logo`}
        width={size}
        height={size}
        priority
        className="rounded-full ring-2 ring-accent/60 shadow-sm shrink-0"
      />
      {showName && (
        <span className="flex flex-col leading-tight">
          <span className={cn('font-headline text-xl font-bold', tone === 'light' ? 'text-white' : 'text-primary')}>
            {BRAND.name}
          </span>
          <span className={cn('font-deva text-[11px] tracking-wide', tone === 'light' ? 'text-accent' : 'text-accent')}>
            {BRAND.tagline}
          </span>
        </span>
      )}
    </Link>
  );
}
