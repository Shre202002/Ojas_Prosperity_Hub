import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Container } from '@/components/store/PageParts';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Container narrow className="py-24">
          <p lang="sa" aria-hidden className="font-deva text-8xl font-semibold leading-none text-accent/40">४०४</p>
          <h1 className="mt-4 font-headline text-5xl font-semibold leading-tight text-primary">We could not find that page.</h1>
          <p className="mt-4 text-lg text-muted-foreground">The link may be old, or the product may have been removed.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-12 px-7"><Link href="/shop">Browse products</Link></Button>
            <Button asChild variant="outline" className="h-12 px-7"><Link href="/">Go to the home page</Link></Button>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
