import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/store/PageParts';
import { SITE, whatsappLink } from '@/lib/site-config';

export const metadata: Metadata = { title: 'Order received', robots: { index: false, follow: false } };

export default async function OrderReceivedPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const ref = ((await searchParams).ref || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
  const wa = whatsappLink(`Hello, I placed order enquiry ${ref}.`);

  return (
    <Container narrow className="py-20">
      <h1 className="font-headline text-5xl font-semibold leading-tight text-primary sm:text-6xl">We have your order.</h1>
      {ref && (
        <p className="mt-5 text-lg">Your reference is <strong className="font-mono-data text-primary">{ref}</strong>. Keep it handy if you contact us.</p>
      )}

      <h2 className="mt-12 font-headline text-3xl font-semibold text-primary">What happens next</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-6 text-lg leading-relaxed text-foreground/85">
        <li>Our team calls or messages you{SITE.phone || SITE.whatsapp ? '' : ' on the phone number you gave'} to confirm your items and address.</li>
        <li>We tell you the final amount, delivery charges (if any) and how to pay.</li>
        <li>Once you confirm, we pack and dispatch your order.</li>
      </ol>
      <p className="mt-6 text-muted-foreground">You have not been charged anything yet.</p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild className="h-12 px-7"><Link href="/shop">Continue shopping</Link></Button>
        {wa && <Button asChild variant="outline" className="h-12 px-7"><a href={wa} target="_blank" rel="noopener noreferrer">Message us on WhatsApp</a></Button>}
      </div>
    </Container>
  );
}
