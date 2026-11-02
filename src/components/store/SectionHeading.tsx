import Link from 'next/link';
import { cn } from '@/lib/utils';

type Props = { title: string; description?: string; href?: string; linkLabel?: string; tone?: 'light' | 'dark'; className?: string; as?: 'h1' | 'h2' };

export function SectionHeading({ title, description, href, linkLabel, tone = 'dark', className, as: Tag = 'h2' }: Props) {
  const light = tone === 'light';
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        <Tag className={cn('font-headline text-4xl font-semibold leading-[1.05] sm:text-5xl', light ? 'text-white' : 'text-primary')}>{title}</Tag>
        {description && <p className={cn('mt-3 text-base leading-relaxed sm:text-lg', light ? 'text-white/70' : 'text-muted-foreground')}>{description}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className={cn('shrink-0 text-sm font-semibold underline underline-offset-4 decoration-primary decoration-2 hover:decoration-4', light ? 'text-white' : 'text-primary')}>{linkLabel}</Link>
      )}
    </div>
  );
}
