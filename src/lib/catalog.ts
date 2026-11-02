// Server-side product catalogue for the public storefront.
// Source of truth is the admin-managed `products` collection; the static list is only a fallback
// so the site still renders if the database is empty or unreachable.
import { cache } from 'react';
import { collection } from './mongodb';
import { PRODUCTS, type Product } from './products';

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  mrp: number | null;
  discountPct: number;
  image: string;
  images: string[];
  shortDescription: string;
  description: string;
  benefits: string[];
  usage: string;
  packSize: string;
  sku: string;
  stock: number | null;
  inStock: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  /** Business volume points per unit (member plan). Shown under the price. */
  bv: number;
  maxOrderQty: number | null;
  subtitle: string;
  highlights: string[];
  benefitItems: { title: string; description: string }[];
  ingredients: { name: string; botanicalName: string; quantity: string; role: string }[];
  ingredientsBasis: string;
  howToUse: { dosage: string; steps: string[] };
  suitableFor: string[];
  precautions: string[];
  storage: string;
  shelfLife: string;
  licenseNumber: string;
  classification: string;
  certifications: string[];
  faqs: { question: string; answer: string }[];
  seo: { metaTitle: string; metaDescription: string };
  relatedSkus: string[];
  tags: string[];
};

type Details = Pick<ShopProduct, 'bv' | 'maxOrderQty' | 'subtitle' | 'highlights' | 'benefitItems' | 'ingredients' | 'ingredientsBasis' | 'howToUse' | 'suitableFor' | 'precautions' | 'storage' | 'shelfLife' | 'licenseNumber' | 'classification' | 'certifications' | 'faqs' | 'seo' | 'relatedSkus' | 'tags'>;
const EMPTY_DETAILS: Details = {
  bv: 0, maxOrderQty: null, subtitle: '', highlights: [], benefitItems: [], ingredients: [], ingredientsBasis: '',
  howToUse: { dosage: '', steps: [] }, suitableFor: [], precautions: [], storage: '', shelfLife: '', licenseNumber: '',
  classification: '', certifications: [], faqs: [], seo: { metaTitle: '', metaDescription: '' }, relatedSkus: [], tags: [],
};

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const list = (v: unknown) => (Array.isArray(v) ? v.map(text).filter(Boolean) : []);

export type ProductSort = 'featured' | 'price-asc' | 'price-desc' | 'name';

import { slugify } from './slug';
export { slugify };

const money = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function build(base: Omit<ShopProduct, 'discountPct' | 'inStock' | 'image' | keyof typeof EMPTY_DETAILS> & Partial<typeof EMPTY_DETAILS> & { images: string[] }): ShopProduct {
  const mrp = base.mrp && base.mrp > base.price ? base.mrp : null;
  return {
    ...EMPTY_DETAILS,
    ...base,
    mrp,
    image: base.images[0] || '',
    discountPct: mrp ? Math.round(((mrp - base.price) / mrp) * 100) : 0,
    inStock: base.stock === null || base.stock > 0,
  };
}

function fromDb(doc: any): ShopProduct {
  const images = (Array.isArray(doc.images) ? doc.images : [])
    .filter((img: any) => img?.url)
    .sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || (a.order ?? 0) - (b.order ?? 0))
    .map((img: any) => String(img.url));
  const benefits = Array.isArray(doc.benefits)
    ? doc.benefits.map(String)
    : String(doc.benefits || '').split('\n').map((line: string) => line.trim()).filter(Boolean);
  const description = String(doc.description || '');
  return build({
    id: String(doc._id),
    slug: String(doc.slug || slugify(String(doc.name || doc.sku || doc._id))),
    name: String(doc.name || 'Product'),
    category: String(doc.category || 'Wellness'),
    price: money(doc.price),
    mrp: money(doc.mrp) || null,
    images,
    shortDescription: String(doc.shortDescription || description.slice(0, 140)),
    description,
    benefits,
    usage: String(doc.usage || ''),
    packSize: String(doc.packSize || ''),
    sku: String(doc.sku || ''),
    stock: doc.stock === null || doc.stock === undefined || doc.stock === '' ? null : Number(doc.stock),
    isFeatured: Boolean(doc.isFeatured),
    isBestSeller: Boolean(doc.isBestSeller),
    bv: Math.max(0, Math.round(Number(doc.bvValue) || 0)),
    maxOrderQty: Number(doc.maxOrderQty) > 0 ? Math.floor(Number(doc.maxOrderQty)) : null,
    subtitle: text(doc.subtitle),
    highlights: list(doc.highlights),
    benefitItems: (Array.isArray(doc.benefitItems) ? doc.benefitItems : []).filter((b: any) => b?.title).map((b: any) => ({ title: text(b.title), description: text(b.description) })),
    ingredients: (Array.isArray(doc.ingredients) ? doc.ingredients : []).filter((i: any) => i?.name).map((i: any) => ({ name: text(i.name), botanicalName: text(i.botanicalName), quantity: text(i.quantity), role: text(i.role) })),
    ingredientsBasis: text(doc.ingredientsBasis),
    howToUse: { dosage: text(doc.howToUse?.dosage), steps: list(doc.howToUse?.steps) },
    suitableFor: list(doc.suitableFor),
    precautions: list(doc.precautions),
    storage: text(doc.storage),
    shelfLife: text(doc.shelfLife),
    licenseNumber: text(doc.licenseNumber),
    classification: text(doc.classification),
    certifications: list(doc.certifications),
    faqs: (Array.isArray(doc.faqs) ? doc.faqs : []).filter((q: any) => q?.question && q?.answer).map((q: any) => ({ question: text(q.question), answer: text(q.answer) })),
    seo: { metaTitle: text(doc.seo?.metaTitle), metaDescription: text(doc.seo?.metaDescription) },
    relatedSkus: list(doc.relatedSkus),
    tags: list(doc.tags),
  });
}

function fromStatic(p: Product): ShopProduct {
  return build({
    id: `static-${p.id}`, slug: p.slug, name: p.name, category: p.category,
    price: p.salePrice, mrp: p.price || null, images: p.gallery?.length ? p.gallery : [p.image],
    shortDescription: p.shortDescription, description: p.description, benefits: p.benefits, usage: p.usage,
    packSize: p.packSize, sku: p.sku, stock: p.stock, isFeatured: p.isFeatured, isBestSeller: p.isBestSeller,
  });
}

/** Every purchasable product (active in the DB, with a price). */
export const loadCatalog = cache(async (): Promise<ShopProduct[]> => {
  try {
    const docs = await (await collection<any>('products')).find({ status: 'active' }).sort({ createdAt: -1 }).limit(500).toArray();
    const items = docs.map(fromDb).filter((p) => p.price > 0 && p.name);
    if (items.length) return items;
  } catch (error) {
    console.error('[catalog] database unavailable, using the built-in product list:', (error as Error).message);
  }
  // Unpriced starter products are never sold; set a price in Admin > Products to publish one.
  return PRODUCTS.map(fromStatic).filter((p) => p.price > 0);
});

export async function getProducts({ q, category, sort = 'featured', limit }: { q?: string; category?: string; sort?: ProductSort; limit?: number } = {}) {
  let items = await loadCatalog();
  const term = q?.trim().toLowerCase();
  if (term) items = items.filter((p) => [p.name, p.category, p.subtitle, p.shortDescription, p.description, p.sku, ...p.tags].some((field) => field.toLowerCase().includes(term)));
  if (category) items = items.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  const sorted = [...items];
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  else if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || Number(b.isBestSeller) - Number(a.isBestSeller));
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getProductBySlug(slug: string) {
  return (await loadCatalog()).find((p) => p.slug === slug) ?? null;
}

export async function getProductsByIds(ids: string[]) {
  const wanted = new Set(ids);
  return (await loadCatalog()).filter((p) => wanted.has(p.id));
}

export async function getCategories() {
  const counts = new Map<string, number>();
  for (const p of await loadCatalog()) counts.set(p.category, (counts.get(p.category) || 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

export { formatPrice } from './money';
