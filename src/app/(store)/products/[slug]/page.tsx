import Link from 'next/link';
import Image from '@/components/SiteImage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Check, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { AddToCartButton } from '@/components/store/AddToCartButton';
import { BvBadge } from '@/components/store/BvBadge';
import { ProductGallery } from '@/components/store/ProductGallery';
import { ProductCard } from '@/components/store/ProductCard';
import { Container } from '@/components/store/PageParts';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getProductBySlug, loadCatalog } from '@/lib/catalog';
import { formatPrice } from '@/lib/money';
import { BRAND } from '@/lib/brand';
import { COMPANY, SITE } from '@/lib/site-config';

export const revalidate = 60;

export async function generateStaticParams() {
  return (await loadCatalog()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: 'Product not found' };
  const title = product.seo.metaTitle || product.name;
  const description = product.seo.metaDescription || product.shortDescription || product.description.slice(0, 160);
  return {
    title: { absolute: title },
    description,
    keywords: product.tags.length ? product.tags : undefined,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title, description, type: 'website', images: product.image ? [product.image] : undefined },
  };
}

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="text-2xl font-semibold text-primary sm:text-3xl">{children}</h2>;
}

const Dots = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((b) => <li key={b} className="flex gap-3"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />{b}</li>)}
  </ul>
);

/** One "story" block: a product photo beside its text. Alternates sides on large screens. */
function Story({ image, flip, title, children }: { image?: string; flip: boolean; title: string; children: React.ReactNode }) {
  return (
    <section className={`grid items-center gap-8 py-10 ${image ? 'lg:grid-cols-2 lg:gap-14' : ''}`}>
      {image && (
        <div className={`relative aspect-square w-full overflow-hidden rounded-lg border bg-white ${flip ? 'lg:order-2' : ''}`}>
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 560px, 92vw" className="object-cover" />
        </div>
      )}
      <div className="max-w-xl">
        <h3 className="text-2xl font-semibold text-primary sm:text-3xl">{title}</h3>
        <div className="mt-4 space-y-4 leading-relaxed text-foreground/80">{children}</div>
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();

  // Curated "related" first, then the rest of the same category.
  const all = (await loadCatalog()).filter((p) => p.id !== product.id);
  const rank = (p: (typeof all)[number]) => { const i = product.relatedSkus.indexOf(p.sku); return i >= 0 ? i : 100 + Number(p.category !== product.category); };
  const related = [...all].sort((a, b) => rank(a) - rank(b)).slice(0, 8);

  const paragraphs = product.description.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const hasQuantity = product.ingredients.some((i) => i.quantity);
  const hasRole = product.ingredients.some((i) => i.role);
  const aboutItems = product.highlights.length ? product.highlights : product.benefits;
  const story = product.images.slice(1); // photo 1 is the pack shot used in the gallery
  const dosage = product.howToUse.dosage || product.usage;

  // Structured data for search engines. No ratings or reviews are claimed.
  const jsonLd: any[] = [{
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    sku: product.sku || undefined,
    category: product.category,
    brand: { '@type': 'Brand', name: BRAND.name },
    image: product.images,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }];
  if (product.faqs.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: product.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    });
  }

  // Product information table: only rows we actually have data for.
  const info: [string, string][] = ([
    ['Brand', BRAND.name],
    ['Pack size', product.packSize],
    ['Category', product.category],
    ['Type', product.classification],
    ['Licence no.', product.licenseNumber],
    ['Shelf life', product.shelfLife],
    ['Storage', product.storage],
    ['Quality marks', product.certifications.join(', ')],
    ['SKU', product.sku],
    ['Country of origin', 'India'],
    ['Marketed by', `${COMPANY.marketer.name}, ${COMPANY.marketer.address}`],
    ['Manufactured by', `${COMPANY.manufacturer.name}, ${COMPANY.manufacturer.address}`],
  ] as [string, string][]).filter(([, v]) => v);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <Container className="py-6 sm:py-8">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted-foreground">
          <Link href="/shop" className="hover:text-primary hover:underline">Shop</Link>
          <span aria-hidden className="mx-2">/</span>
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-primary hover:underline">{product.category}</Link>
          <span aria-hidden className="mx-2">/</span>
          <span className="text-foreground/70">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_300px] lg:gap-10">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery images={product.images} name={product.name} discountPct={product.discountPct} />
          </div>

          <div>
            <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{product.name}</h1>
            {product.subtitle && <p className="mt-2 text-lg text-foreground/70">{product.subtitle}</p>}
            <p className="mt-2 text-sm">Brand: <Link href="/shop" className="text-primary hover:underline">{BRAND.name}</Link></p>

            <hr className="my-4" />

            <p className="flex flex-wrap items-baseline gap-x-3">
              {product.discountPct > 0 && <span className="text-2xl font-light text-primary">-{product.discountPct}%</span>}
              <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
            </p>
            {product.mrp && <p className="text-sm text-muted-foreground">M.R.P.: <span className="line-through">{formatPrice(product.mrp)}</span></p>}
            <p className="mt-1 text-sm text-muted-foreground">Inclusive of all taxes</p>
            <BvBadge bv={product.bv} size="lg" className="mt-3" />

            <hr className="my-4" />

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              {product.packSize && (<><dt className="font-semibold">Pack size</dt><dd>{product.packSize}</dd></>)}
              <dt className="font-semibold">Category</dt><dd>{product.category}</dd>
              {product.classification && (<><dt className="font-semibold">Type</dt><dd>{product.classification}</dd></>)}
              {product.shelfLife && (<><dt className="font-semibold">Shelf life</dt><dd>{product.shelfLife}</dd></>)}
            </dl>

            {aboutItems.length > 0 && (
              <section className="mt-6" aria-labelledby="about-item">
                <h2 id="about-item" className="text-lg font-semibold">About this item</h2>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-foreground/85">
                  {aboutItems.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </section>
            )}

            {product.certifications.length > 0 && (
              <p className="mt-5 flex flex-wrap gap-2">
                {product.certifications.map((c) => <span key={c} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{c}</span>)}
              </p>
            )}
          </div>

          <aside aria-label="Buy box" className="h-fit rounded-lg border p-5 lg:sticky lg:top-28">
            <p className="text-3xl font-semibold">{formatPrice(product.price)}</p>
            <BvBadge bv={product.bv} className="mt-2" />
            <p className="mt-4 flex gap-2 text-sm"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Dispatch in {SITE.policy.dispatchDays}. Delivery in {SITE.policy.deliveryDays}. Charges, if any, are confirmed when we contact you.</p>
            <p className={`mt-4 text-lg font-semibold ${product.inStock ? 'text-green-700' : 'text-destructive'}`}>{product.inStock ? 'In stock' : 'Out of stock'}</p>
            <div className="mt-4"><AddToCartButton product={product} variant="buybox" /></div>
            <p className="mt-3 text-xs text-muted-foreground">
              No payment now. Our team confirms your order with you.
              {product.maxOrderQty ? ` Up to ${product.maxOrderQty} per order.` : ''}
            </p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t pt-4 text-xs">
              <dt className="text-muted-foreground">Sold by</dt><dd>{COMPANY.marketer.name}</dd>
              <dt className="text-muted-foreground">Made by</dt><dd>{COMPANY.manufacturer.name}</dd>
              <dt className="text-muted-foreground">Returns</dt><dd><Link href="/refund-policy" className="text-primary hover:underline">{SITE.policy.returnWindowDays}-day returns, see policy</Link></dd>
            </dl>
            <p className="mt-3 flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" />Made in a GMP certified facility in India.</p>
            <p className="mt-2 flex gap-2 text-xs text-muted-foreground"><MapPin className="h-4 w-4 shrink-0 text-primary" />Orders are confirmed by phone or WhatsApp.</p>
          </aside>
        </div>
      </Container>

      <section className="border-t" aria-labelledby="from-brand">
        <Container className="py-10">
          <H2 id="from-brand">From the brand</H2>
          <p className="mt-1 text-foreground/70">{product.name}: the story, the ingredients and how to use it.</p>

          <div className="divide-y">
            <Story image={story[0]} flip={false} title="About this product">
              {paragraphs.map((t) => <p key={t}>{t}</p>)}
            </Story>

            {product.ingredients.length > 0 && (
              <Story image={story[1]} flip title="What is inside">
                {product.ingredientsBasis && <p className="text-sm text-muted-foreground">{product.ingredientsBasis}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-2 pr-4 font-medium">Ingredient</th>
                        <th className="py-2 pr-4 font-medium">Botanical name</th>
                        {hasQuantity && <th className="py-2 font-medium">Quantity</th>}
                        {hasRole && <th className="py-2 font-medium">Role</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {product.ingredients.map((i) => (
                        <tr key={i.name} className="border-b border-border/60 align-top">
                          <td className="py-2 pr-4 font-medium">{i.name}</td>
                          <td className="py-2 pr-4 italic text-foreground/70">{i.botanicalName || '-'}</td>
                          {hasQuantity && <td className="py-2 tabular-nums">{i.quantity || '-'}</td>}
                          {hasRole && <td className="py-2">{i.role || '-'}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Story>
            )}

            {(product.benefitItems.length > 0 || product.benefits.length > 0) && (
              <Story image={story[2]} flip={false} title="What it supports">
                {product.benefitItems.length > 0 ? (
                  <dl className="space-y-3">
                    {product.benefitItems.map((b) => (
                      <div key={b.title}>
                        <dt className="flex gap-2 font-semibold text-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />{b.title}</dt>
                        {b.description && <dd className="pl-6">{b.description}</dd>}
                      </div>
                    ))}
                  </dl>
                ) : <Dots items={product.benefits} />}
              </Story>
            )}

            {(product.howToUse.steps.length > 0 || dosage) && (
              <Story image={story[3]} flip title="How to use">
                {dosage && <p className="font-medium text-foreground">{dosage}</p>}
                {product.howToUse.steps.length > 0 && (
                  <ol className="list-decimal space-y-2 pl-5">{product.howToUse.steps.map((s) => <li key={s} className="pl-1">{s}</li>)}</ol>
                )}
                {product.suitableFor.length > 0 && (<><p className="pt-2 font-semibold text-foreground">Suitable for</p><Dots items={product.suitableFor} /></>)}
              </Story>
            )}
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section className="border-t bg-secondary/50 py-12" aria-labelledby="related">
          <Container>
            <H2 id="related">Products related to this item</H2>
            <div className="-mx-4 mt-6 flex snap-x gap-5 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
              {related.map((p) => (
                <div key={p.id} className="w-[220px] shrink-0 snap-start sm:w-[250px]"><ProductCard product={p} /></div>
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="border-t py-12" aria-labelledby="info">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <H2 id="info">Product information</H2>
            <dl className="mt-5 divide-y rounded-lg border text-sm">
              {info.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[130px_1fr] gap-4 px-4 py-2.5 sm:grid-cols-[170px_1fr]">
                  <dt className="bg-transparent font-medium text-muted-foreground">{k}</dt><dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-10">
            {product.precautions.length > 0 && (
              <div><H2>Safety information</H2><div className="mt-4 text-foreground/80"><Dots items={product.precautions} /></div></div>
            )}
            {product.faqs.length > 0 && (
              <div>
                <H2>Questions and answers</H2>
                <Accordion type="single" collapsible className="mt-2">
                  {product.faqs.map((f, i) => (
                    <AccordionItem key={f.question} value={`faq-${i}`}>
                      <AccordionTrigger className="text-left text-base">{f.question}</AccordionTrigger>
                      <AccordionContent className="text-foreground/80">{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <p className="mt-3 text-sm text-muted-foreground">Have another question? <Link href="/contact" className="text-primary underline underline-offset-4">Contact us</Link>.</p>
              </div>
            )}
          </div>
        </Container>
      </section>

      <Container className="pb-12">
        <p className="text-xs leading-relaxed text-muted-foreground">
          This product is not intended to diagnose, treat, cure or prevent any disease. Consult a qualified practitioner before use, especially if you are pregnant, nursing or on medication. Individual results may vary. <Link href="/disclaimer" className="underline underline-offset-4">Read the full disclaimer</Link>.
        </p>
      </Container>
    </>
  );
}
