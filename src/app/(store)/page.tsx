import Link from 'next/link';
import { siteImage } from '@/lib/site-images';
import Image from '@/components/SiteImage';
import type { Metadata } from 'next';
import { Check, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ApertureCarousel from '@/components/ui/aperture-carousel';
import { ProductGrid } from '@/components/store/ProductCard';
import { SectionHeading } from '@/components/store/SectionHeading';
import { Container } from '@/components/store/PageParts';
import { getCategories, getProducts, loadCatalog } from '@/lib/catalog';
import { FAQS } from '@/lib/faq';
import { GUIDES } from '@/lib/guides';
import { BRAND } from '@/lib/brand';
import { SITE, whatsappLink } from '@/lib/site-config';

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} | Ayurvedic wellness store` },
  description: 'Shop Ayurvedic and neuro-wellness formulations from Shri Jaya Ayur Neuro. Send your order online and our team confirms it with you.',
  alternates: { canonical: '/' },
};

const WHY = [
  { title: 'Traditional herbs', body: 'Formulas built on well-known Ayurvedic herbs such as Ashwagandha, Giloy, Tulsi and Triphala.' },
  { title: 'GMP certified', body: 'Made by Shri Amrit Herbals in a GMP certified facility in Jaipur, Rajasthan.' },
  { title: 'Clear ingredient lists', body: 'Every product page shows the full ingredient list with botanical names.' },
  { title: 'Confirmed with you', body: 'Our team contacts you to confirm every order before it ships.' },
];

// The 2.6 MB source PNGs are served resized through the Next image optimizer.
const heroImg = (n: number) => siteImage(`/assets/Hero_section/${n}.jpg`) as string;
const HERO_SLIDES = [
  { image: heroImg(1), eyebrow: 'Herbal Wellness Juice', title: 'Special 15 with Noni', caption: 'Enriched with 15 powerful herbs.', description: 'A daily herbal juice that blends Noni with Ashwagandha, Giloy, Shilajit and more to support immunity, energy, digestion and overall vitality.', points: ['Supports immunity', 'Boosts energy', 'Liver wellness', 'Mental alertness'], cta: { label: 'Shop Special 15', href: '/products/special-15-noni-juice-500ml' }, alt: 'Shri Special 15 with Noni juice on a rock by a turquoise lagoon' },
  { image: heroImg(2), eyebrow: 'Daily Immunity', title: 'Sea Buckthorn & Tulsi', caption: 'Omega-rich juice and Panchamrit Tulsi Drop.', description: 'Himalayan Sea Buckthorn juice with Amla and Turmeric, paired with concentrated drops of five Tulsi varieties for natural defences through every season.', points: ['Omega 3, 6, 7 & 9', 'Five Tulsi types', 'Throat comfort', 'Antioxidant support'], cta: { label: 'Shop Sea Buckthorn', href: '/products/sea-buckthorn-juice-body-detox-500ml' }, alt: 'Sea Buckthorn Juice and Panchamrit Tulsi Drop in a mountain meadow' },
  { image: heroImg(3), eyebrow: 'Digestive & Liver Care', title: 'Churn & LivoCare', caption: 'Constipation Churn and LivoCare Syrup.', description: 'An Isabgol and Triphala churna for easy bowel movement, with Bhumi Amla and Kalmegh liver syrup that supports digestion and natural detox.', points: ['Easy bowel movement', 'Eases gas & bloating', 'Liver function', 'Natural detox'], cta: { label: 'Shop LivoCare', href: '/products/shri-livocare-syrup-300ml' }, alt: 'Constipation Churn and LivoCare Syrup on a wooden table in a field' },
  { image: heroImg(4), eyebrow: 'Joint & Muscle Care', title: 'Ortho Go Oil', caption: 'For joint and muscle care.', description: 'An Ayurvedic massage oil made with 14 herbal oils, including Camphor, Wintergreen, Boswellia and Nirgundi, to soothe joint stiffness and tired muscles.', points: ['Soothes discomfort', 'Eases stiffness', 'Supports mobility', '14 herbal oils'], cta: { label: 'Shop Ortho Go Oil', href: '/products/shri-ortho-go-oil-50ml' }, alt: 'Ortho Go Oil on a river stone' },
];

export default async function HomePage() {
  const [all, categories, top] = await Promise.all([loadCatalog(), getCategories(), getProducts({ sort: 'featured', limit: 4 })]);
  const topIds = new Set(top.map((p) => p.id));
  const more = all.filter((p) => !topIds.has(p.id)).slice(0, 4);
  const categoryImage = (name: string) => all.find((p) => p.category === name)?.image || '';
  const wa = whatsappLink('Hello, I have a question about your products.');

  const stats = [
    { value: String(all.length), label: 'Ayurvedic products' },
    { value: String(categories.length), label: 'Care categories' },
    { value: 'GMP', label: 'Certified manufacturing' },
    { value: 'ISO 9001', label: 'Quality management, 2015' },
  ];

  return (
    <>
      <h1 className="sr-only">{BRAND.name}: Ayurvedic wellness store</h1>
      <ApertureCarousel slides={HERO_SLIDES} height="var(--hero-h)" className="[--hero-h:calc(100svh-6.5rem)] md:[--hero-h:calc(100svh-8.5rem)] min-h-[560px] [&_.ap-img]:object-[72%_40%] md:[&_.ap-img]:object-[60%_40%] xl:[&_.ap-img]:object-center" autoplay={6500} ariaLabel="Featured products" />

      {categories.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container>
            <SectionHeading title="Shop by care category" description="Find products by what you want to support." href="/shop" linkLabel="View all products" />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((c) => (
                <Link key={c.name} href={`/shop?category=${encodeURIComponent(c.name)}`} className="group text-center">
                  <span className="relative mx-auto block aspect-square w-full max-w-[180px] overflow-hidden rounded-full bg-secondary ring-1 ring-border transition group-hover:ring-accent">
                    {categoryImage(c.name) && <Image src={categoryImage(c.name)} alt="" fill sizes="180px" className="object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />}
                  </span>
                  <span className="mt-3 block font-semibold text-primary">{c.name}</span>                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {top.length > 0 && (
        <section className="bg-secondary/60 py-16 sm:py-20">
          <Container>
            <SectionHeading title="Our top products" href="/shop" linkLabel="View more" />
            <div className="mt-10"><ProductGrid products={top} /></div>
          </Container>
        </section>
      )}

      <section className="py-16 sm:py-24">
        <Container className="grid items-center gap-12 md:grid-cols-2">
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-full bg-secondary ring-1 ring-accent/40">
              <Image src={all[0]?.images[1] || all[0]?.image || BRAND.logo} alt="Herbs and a bottle of Special 15" fill sizes="(min-width: 768px) 420px, 90vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-5 right-0 rounded-lg bg-primary px-5 py-4 text-primary-foreground shadow-lg sm:-right-4">
              <p className="text-lg font-semibold leading-tight">GMP certified</p>
              <p className="text-sm text-primary-foreground/85">manufacturing in Jaipur</p>
            </div>
          </div>
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold leading-tight text-primary sm:text-5xl">Who we are</h2>
            <p className="mt-2 text-lg font-medium text-foreground/80">{BRAND.taglineEn}</p>
            <p className="mt-5 leading-relaxed text-foreground/75">
              Shri Jaya Ayur Neuro brings time-tested Ayurvedic formulations to modern homes. Every product is made from carefully chosen herbs, manufactured in a GMP certified facility in Jaipur, and designed for simple daily use.
            </p>
            <Button asChild size="lg" className="mt-8 h-12 rounded-full px-8"><Link href="/about">Know more</Link></Button>
          </div>
        </Container>
      </section>

      <section className="bg-primary py-14 text-primary-foreground">
        <Container>
          <dl className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="text-4xl font-semibold sm:text-5xl">{s.value}</dd>
                <p aria-hidden className="mt-2 text-sm text-primary-foreground/80">{s.label}</p>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {more.length > 0 && (
        <section className="py-16 sm:py-20">
          <Container>
            <SectionHeading title="More from our range" href="/shop" linkLabel="Shop all" />
            <div className="mt-10"><ProductGrid products={more} /></div>
          </Container>
        </section>
      )}

      <section className="bg-secondary/60 py-16 sm:py-24">
        <Container>
          <SectionHeading title="Why choose Shri Jaya Ayur" description="What goes into every product, and how we handle your order." />
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w) => (
              <div key={w.title} className="flex gap-4">
                <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-4 w-4" aria-hidden /></span>
                <div>
                  <h3 className="text-lg font-semibold text-primary">{w.title}</h3>
                  <p className="mt-1 text-foreground/75">{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading title="From our blog" href="/blog" linkLabel="All articles" />
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDES.slice(0, 3).map((g) => (
              <article key={g.slug} className="group">
                <Link href={`/blog/${g.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                  <Image src={g.image} alt="" fill sizes="(min-width: 1024px) 380px, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </Link>
                <h3 className="mt-4 text-lg font-semibold leading-snug text-primary"><Link href={`/blog/${g.slug}`} className="hover:underline underline-offset-4 decoration-primary">{g.title}</Link></h3>
                <p className="mt-1 text-sm text-muted-foreground">{g.readMinutes} min read</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t bg-secondary/60 py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-4xl font-semibold leading-tight text-primary sm:text-5xl">Questions, answered.</h2>
            <p className="mt-4 max-w-md text-lg text-foreground/75">Ordering, delivery, returns and how to use our products.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-full px-7"><Link href="/contact">Contact us</Link></Button>
              {wa && <Button asChild variant="outline" className="h-12 rounded-full bg-transparent px-7"><a href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></Button>}
              {SITE.phone && <Button asChild variant="ghost" className="h-12 gap-2 px-5"><a href={`tel:${SITE.phone.replace(/\s/g, '')}`}><Phone className="h-4 w-4" />{SITE.phone}</a></Button>}
            </div>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.slice(0, 5).map((faq, i) => (
              <AccordionItem key={faq.q} value={`q${i}`}>
                <AccordionTrigger className="text-left text-lg font-semibold text-primary hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>
    </>
  );
}
