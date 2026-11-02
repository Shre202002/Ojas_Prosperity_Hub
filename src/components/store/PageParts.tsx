import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Opening block for inner pages: the headline does the work; one short intro line. */
export function PageHero({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <header className="border-b bg-ivory-wash">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
        <h1 className="max-w-3xl font-headline text-5xl font-semibold leading-[1.02] text-primary sm:text-6xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{intro}</p>}
        {children}
      </div>
    </header>
  );
}

export function Container({ children, className, narrow = false }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={cn('mx-auto px-4 sm:px-6', narrow ? 'max-w-3xl' : 'max-w-7xl', className)}>{children}</div>;
}

/** Long-form legal text with readable measure and spacing. */
export function PolicyBody({ updated, children }: { updated: string; children: ReactNode }) {
  return (
    <Container narrow className="py-12 sm:py-16">
      <p className="mb-8 text-sm text-muted-foreground">Last updated {updated}</p>
      <div className="space-y-5 text-base leading-[1.8] text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:font-headline [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:text-primary [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </Container>
  );
}
