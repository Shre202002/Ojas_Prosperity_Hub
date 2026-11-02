import type { Metadata } from 'next';
import { ContactForm } from '@/components/store/ContactForm';
import { Container, PageHero } from '@/components/store/PageParts';
import { BRAND } from '@/lib/brand';
import { SITE, whatsappLink } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Contact us',
  description: `Questions about a product or an order? Send ${BRAND.name} a message.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  const wa = whatsappLink('Hello, I have a question.');
  const details = [
    SITE.phone && { label: 'Phone', node: <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="underline underline-offset-4">{SITE.phone}</a> },
    wa && { label: 'WhatsApp', node: <a href={wa} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Start a chat</a> },
    SITE.email && { label: 'Email', node: <a href={`mailto:${SITE.email}`} className="underline underline-offset-4">{SITE.email}</a> },
    SITE.address && { label: 'Address', node: <span className="whitespace-pre-line">{SITE.address}</span> },
    SITE.hours && { label: 'Hours', node: <span>{SITE.hours}</span> },
  ].filter(Boolean) as { label: string; node: React.ReactNode }[];

  return (
    <>
      <PageHero title="Talk to us" intro="Ask about a product, an order, or the business. We reply to every message." />
      <Container className="grid gap-14 py-14 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <section aria-labelledby="form-heading">
          <h2 id="form-heading" className="mb-6 font-headline text-3xl font-semibold text-primary">Send a message</h2>
          <ContactForm />
        </section>

        <aside aria-labelledby="details-heading">
          <h2 id="details-heading" className="mb-6 font-headline text-3xl font-semibold text-primary">Other ways to reach us</h2>
          {details.length ? (
            <dl className="divide-y border-y">
              {details.map((d) => (
                <div key={d.label} className="grid grid-cols-[6rem_1fr] gap-4 py-4">
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd>{d.node}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground">The form is the best way to reach us right now. We reply by email.</p>
          )}
          <p className="mt-6 text-sm text-muted-foreground">{BRAND.legalName}{SITE.gstin ? ` · GSTIN ${SITE.gstin}` : ''}</p>
        </aside>
      </Container>
    </>
  );
}
