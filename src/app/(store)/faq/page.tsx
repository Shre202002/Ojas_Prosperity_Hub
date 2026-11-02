import Link from 'next/link';
import type { Metadata } from 'next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Container, PageHero } from '@/components/store/PageParts';
import { FAQS } from '@/lib/faq';

export const metadata: Metadata = {
  title: 'Frequently asked questions',
  description: 'Answers about ordering, delivery, returns, using our products and joining the business.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHero title="Questions, answered." intro="If yours is not here, send us a message." />
      <Container narrow className="py-12">
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`q${i}`}>
              <AccordionTrigger className="text-left font-headline text-2xl font-semibold text-primary hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-10"><Button asChild className="h-12 px-7"><Link href="/contact">Ask us something else</Link></Button></div>
      </Container>
    </>
  );
}
