// Server-side loader for the home page hero.
import { collection } from './mongodb';
import { loadCatalog } from './catalog';
import { resolveSlides, type HeroProduct, type HeroRecord, type HeroSlide } from './hero-types';

export async function loadHeroSlides(): Promise<HeroSlide[]> {
  const catalog = await loadCatalog();
  const products: HeroProduct[] = catalog.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, category: p.category, subtitle: p.subtitle, shortDescription: p.shortDescription,
    image: p.image, price: p.price, mrp: p.mrp, bv: p.bv, isFeatured: p.isFeatured,
  }));
  let records: HeroRecord[] = [];
  try {
    const docs = await (await collection<any>('heroSlides')).find({}).sort({ order: 1, createdAt: 1 }).limit(50).toArray();
    records = docs.map((d) => ({ ...d, _id: String(d._id) }));
  } catch (error) {
    console.error('[hero] could not read banners, using featured products:', (error as Error).message);
  }
  return resolveSlides(records, products);
}
