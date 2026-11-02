import Link from 'next/link';
import Image from '@/components/SiteImage';
import type { Metadata } from 'next';
import { Container, PageHero } from '@/components/store/PageParts';
import { GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Usage guides and ingredient explainers for Shri Jaya Ayur Neuro products.',
  alternates: { canonical: '/blog' },
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

export default function BlogPage() {
  return (
    <>
      <PageHero title="Blog" intro="Usage guides and ingredient explainers for our products." />
      <Container className="py-14">
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <article key={g.slug} className="group flex flex-col">
              <Link href={`/blog/${g.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                <Image src={g.image} alt="" fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground">{formatDate(g.date)} · {g.readMinutes} min read</p>
              <h2 className="mt-1 text-xl font-semibold leading-snug text-primary">
                <Link href={`/blog/${g.slug}`} className="hover:underline underline-offset-4 decoration-primary">{g.title}</Link>
              </h2>
              <p className="mt-2 text-foreground/75">{g.excerpt}</p>
            </article>
          ))}
        </div>
      </Container>
    </>
  );
}
