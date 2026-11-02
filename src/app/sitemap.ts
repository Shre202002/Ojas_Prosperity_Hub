import type { MetadataRoute } from 'next';
import { loadCatalog } from '@/lib/catalog';
import { GUIDES } from '@/lib/guides';

const base = () => (process.env.APP_URL || 'http://localhost:9002').replace(/\/+$/, '');
const PAGES = ['', '/shop', '/about', '/services', '/blog', '/contact', '/faq', '/join', '/privacy', '/terms', '/refund-policy', '/shipping-policy', '/disclaimer'];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const products = await loadCatalog();
  return [
    ...PAGES.map((path) => ({ url: `${base()}${path}`, lastModified: now, changeFrequency: 'weekly' as const, priority: path === '' ? 1 : 0.6 })),
    ...GUIDES.map((g) => ({ url: `${base()}/blog/${g.slug}`, lastModified: new Date(g.date), changeFrequency: 'monthly' as const, priority: 0.5 })),
    ...products.map((p) => ({ url: `${base()}/products/${p.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ];
}
