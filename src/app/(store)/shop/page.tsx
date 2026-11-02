import Link from 'next/link';
import type { Metadata } from 'next';
import { ProductGrid } from '@/components/store/ProductCard';
import { Container, PageHero } from '@/components/store/PageParts';
import { getCategories, getProducts, loadCatalog, type ProductSort } from '@/lib/catalog';
import { cn } from '@/lib/utils';

export const revalidate = 60;

type Search = { q?: string; category?: string; sort?: string };

const SORTS: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name' },
];

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const { category, q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : category ? category : 'Shop',
    description: 'Browse Ayurvedic and neuro-wellness products from Shri Jaya Ayur Neuro.',
    alternates: { canonical: '/shop' },
    robots: q ? { index: false, follow: true } : undefined,
  };
}

const href = (params: Search) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) qs.set(key, value);
  const text = qs.toString();
  return text ? `/shop?${text}` : '/shop';
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const q = params.q?.trim().slice(0, 80) || '';
  const sort = SORTS.some((s) => s.value === params.sort) ? (params.sort as ProductSort) : 'featured';
  const [categories, products, catalogSize] = await Promise.all([getCategories(), getProducts({ q, category: params.category, sort }), loadCatalog().then((c) => c.length)]);
  const category = categories.find((c) => c.name === params.category)?.name;

  return (
    <>
      <PageHero
        title={q ? `Results for “${q}”` : category ?? 'Shop'}
        intro={q || category ? undefined : 'Ayurvedic tonics and supplements. Add what you need to your cart and send your order.'}
      />

      <Container className="py-10">
        <div className="flex flex-col gap-6 border-b pb-6 lg:flex-row lg:items-center lg:justify-start">
          <nav aria-label="Sort" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="text-muted-foreground">Sort by</span>
            {SORTS.map((s) => (
              <Link key={s.value} href={href({ q, category, sort: s.value === 'featured' ? '' : s.value })} aria-current={sort === s.value ? 'true' : undefined}
                className={cn('underline-offset-4 decoration-primary decoration-2 hover:underline', sort === s.value ? 'font-semibold text-primary underline' : 'text-foreground/70')}>
                {s.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">{products.length} {products.length === 1 ? 'product' : 'products'}</p>

        {products.length ? (
          <div className="mt-8 pb-10"><ProductGrid products={products} /></div>
        ) : (
          <div className="py-20 text-center">
            {catalogSize === 0 ? (
              <>
                <p className="font-headline text-3xl font-semibold text-primary">Products are on their way.</p>
                <p className="mt-2 text-muted-foreground">We are adding products to the shop. Message us to ask what is available.</p>
                <Link href="/contact" className="mt-6 inline-block font-semibold text-primary underline underline-offset-4 decoration-primary decoration-2">Contact us</Link>
              </>
            ) : (
              <>
                <p className="font-headline text-3xl font-semibold text-primary">Nothing matches that search.</p>
                <p className="mt-2 text-muted-foreground">Try a different word, or browse everything we have.</p>
                <Link href="/shop" className="mt-6 inline-block font-semibold text-primary underline underline-offset-4 decoration-primary decoration-2">Show all products</Link>
              </>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
