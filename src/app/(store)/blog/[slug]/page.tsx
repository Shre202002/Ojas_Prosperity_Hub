import Link from 'next/link';
import Image from '@/components/SiteImage';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/store/PageParts';
import { ProductCard } from '@/components/store/ProductCard';
import { GUIDES, getGuide } from '@/lib/guides';
import { getProductBySlug } from '@/lib/catalog';

export const revalidate = 300;

export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return { title: 'Article not found' };
  return { title: guide.title, description: guide.excerpt, alternates: { canonical: `/blog/${guide.slug}` }, openGraph: { title: guide.title, description: guide.excerpt, type: 'article', images: [guide.image] } };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const product = guide.productSlug ? await getProductBySlug(guide.productSlug) : null;
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);
  const date = new Date(guide.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const jsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: guide.title, datePublished: guide.date, image: guide.image, description: guide.excerpt };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Container narrow className="py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-primary hover:underline">Blog</Link>
        </nav>
        <h1 className="text-4xl font-semibold leading-tight text-primary sm:text-5xl">{guide.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{date} · {guide.readMinutes} min read</p>
        <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-lg bg-secondary">
          <Image src={guide.image} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
        </div>
        <div className="mt-10 space-y-8 text-lg leading-[1.8] text-foreground/85">
          {guide.sections.map((s, i) => (
            <section key={i}>
              {s.heading && <h2 className="mb-3 text-2xl font-semibold text-primary">{s.heading}</h2>}
              {s.paragraphs?.map((p) => <p key={p} className="mb-4">{p}</p>)}
              {s.list && <ul className="list-disc space-y-1.5 pl-6">{s.list.map((l) => <li key={l}>{l}</li>)}</ul>}
            </section>
          ))}
        </div>
        <p className="mt-10 text-xs leading-relaxed text-muted-foreground">
          This article is general information about our products and is not medical advice. These products are not intended to diagnose, treat, cure or prevent any disease. <Link href="/disclaimer" className="underline underline-offset-4">Read the disclaimer</Link>.
        </p>
      </Container>

      {product && (
        <section className="border-t bg-secondary/60 py-14">
          <Container narrow>
            <h2 className="mb-8 text-2xl font-semibold text-primary">The product in this article</h2>
            <div className="max-w-xs"><ProductCard product={product} /></div>
          </Container>
        </section>
      )}

      <section className="border-t py-14">
        <Container>
          <h2 className="mb-8 text-2xl font-semibold text-primary">More to read</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {others.map((g) => (
              <Link key={g.slug} href={`/blog/${g.slug}`} className="group block">
                <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-secondary"><Image src={g.image} alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></span>
                <span className="mt-3 block font-semibold text-primary group-hover:underline underline-offset-4">{g.title}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
