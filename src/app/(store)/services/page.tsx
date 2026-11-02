import Link from 'next/link';
import type { Metadata } from 'next';
import { Container, PageHero } from '@/components/store/PageParts';
import { SERVICES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Services',
  description: 'What Shri Jaya Ayur Neuro offers: Ayurvedic products, order confirmation, product guidance, quality manufacturing and a member business network.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero title="Our services" intro="From choosing a product to receiving your order, here is how we help." />
      <Container className="py-14">
        <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <article key={s.title} className="flex flex-col bg-card p-8">
              <h2 className="text-xl font-semibold text-primary">{s.title}</h2>
              <p className="mt-3 flex-1 leading-relaxed text-foreground/75">{s.body}</p>
              <Link href={s.href} className="mt-6 font-semibold text-primary underline underline-offset-4 decoration-primary decoration-2">{s.cta}</Link>
            </article>
          ))}
        </div>
      </Container>
    </>
  );
}
