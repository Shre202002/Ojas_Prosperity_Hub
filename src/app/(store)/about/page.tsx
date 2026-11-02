import Link from 'next/link';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Container, PageHero } from '@/components/store/PageParts';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Our story',
  description: `${BRAND.legalName} offers Ayurvedic and neuro-wellness products for daily use.`,
  alternates: { canonical: '/about' },
};

const COMMITMENTS = [
  ['Say what a product is for', 'Every product page lists its purpose, benefits and directions for use in plain language.'],
  ['Show the real price', 'The price on the page is the price we confirm. Any delivery charge is told to you before you pay.'],
  ['Answer your questions', 'Message us before you order. Real people read and reply to every message.'],
  ['Keep claims modest', 'Our products support wellness. They are not a substitute for medical care, and we say so.'],
];

export default function AboutPage() {
  return (
    <>
      <PageHero title="Health is the supreme happiness." intro={`${BRAND.legalName} offers Ayurvedic and neuro-wellness products for daily use.`} />

      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div>
          <p lang="sa" className="font-deva text-5xl font-semibold leading-snug text-accent sm:text-6xl">{BRAND.tagline}</p>
          <p className="mt-3 font-headline text-2xl italic text-primary/80">{BRAND.taglineEn}</p>
        </div>
        <div className="max-w-2xl space-y-5 text-lg leading-[1.8] text-foreground/85">
          <p>
            Ayurveda treats wellness as a daily practice, not an occasional fix. {BRAND.name} brings Ayurvedic and neuro-wellness formulations to people who want simple, regular support for their energy, vitality and overall health.
          </p>
          <p>
            We sell directly through this website, and through a network of independent members who share the products with people they know. Both routes follow the same rule: be clear about what a product is, who it is for, and how to use it.
          </p>
        </div>
      </Container>

      <section className="border-y bg-secondary/50 py-16">
        <Container>
          <h2 className="font-headline text-4xl font-semibold text-primary sm:text-5xl">How we work</h2>
          <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {COMMITMENTS.map(([title, text]) => (
              <div key={title} className="border-t border-accent/50 pt-4">
                <dt className="font-headline text-2xl font-semibold text-primary">{title}</dt>
                <dd className="mt-1 text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="grid gap-10 py-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="font-headline text-4xl font-semibold text-primary">The business network</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Members can share our products and earn from the sales they help create. Joining is by invitation from an existing member. Income depends on individual effort and is not guaranteed.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="h-11"><Link href="/join">How joining works</Link></Button>
            <Button asChild variant="ghost" className="h-11"><Link href="/disclaimer">Income disclaimer</Link></Button>
          </div>
        </div>
        <div>
          <h2 className="font-headline text-4xl font-semibold text-primary">Ready to look around?</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">Browse the products, or send us a message if you are not sure which one fits.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-11 px-7"><Link href="/shop">Shop products</Link></Button>
            <Button asChild variant="outline" className="h-11 px-7"><Link href="/contact">Contact us</Link></Button>
          </div>
        </div>
      </Container>
    </>
  );
}
