// Hero banner types and the pure logic that turns admin-edited records into renderable slides.
// No server imports here, so the client-side editor can reuse it for its live preview.

export type HeroTone = 'light' | 'mint' | 'deep';
export type HeroLayout = 'split' | 'full';

/** What an admin edits and what is stored in the `heroSlides` collection. */
export type HeroRecord = {
  id?: string;
  _id?: string;
  type: 'product' | 'banner';
  productId?: string;
  productSlug?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image?: string;
  imageFit?: 'contain' | 'cover';
  layout?: HeroLayout;
  tone?: HeroTone;
  order?: number;
  active?: boolean;
};

/** A slide ready to render. */
export type HeroSlide = {
  id: string;
  kind: 'product' | 'banner';
  layout: HeroLayout;
  tone: HeroTone;
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string } | null;
  secondary: { label: string; href: string } | null;
  image: string;
  imageFit: 'contain' | 'cover';
  /** Live product facts, only for product slides. */
  chips: { price: number; mrp: number | null; bv: number; category: string } | null;
};

/** The product fields a slide needs (a subset of the catalogue's ShopProduct). */
export type HeroProduct = {
  id: string; slug: string; name: string; category: string; subtitle: string; shortDescription: string;
  image: string; price: number; mrp: number | null; bv: number; isFeatured?: boolean;
};

const TONES: HeroTone[] = ['light', 'mint', 'deep'];
const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
// Only same-site paths or http(s) links are allowed for buttons.
const safeHref = (v: unknown) => { const h = clean(v); return /^(\/(?!\/)|https?:\/\/)/.test(h) ? h : ''; };

export function productSlide(p: HeroProduct, i = 0, over: Partial<HeroRecord> = {}): HeroSlide {
  const secLabel = clean(over.secondaryLabel);
  const secHref = safeHref(over.secondaryHref);
  return {
    id: String(over.id || over._id || `product-${p.id}`),
    kind: 'product',
    layout: over.layout === 'full' ? 'full' : 'split',
    tone: TONES.includes(over.tone as HeroTone) ? (over.tone as HeroTone) : TONES[i % TONES.length],
    eyebrow: clean(over.eyebrow) || p.category,
    title: clean(over.title) || p.name,
    body: clean(over.body) || p.subtitle || p.shortDescription,
    cta: { label: clean(over.ctaLabel) || 'Shop now', href: safeHref(over.ctaHref) || `/products/${p.slug}` },
    secondary: secLabel && secHref ? { label: secLabel, href: secHref } : { label: 'All products', href: '/shop' },
    image: clean(over.image) || p.image,
    imageFit: over.imageFit === 'cover' ? 'cover' : 'contain',
    chips: { price: p.price, mrp: p.mrp, bv: p.bv, category: p.category },
  };
}

export function bannerSlide(r: HeroRecord, i = 0): HeroSlide | null {
  const title = clean(r.title);
  const image = clean(r.image);
  if (!title && !image) return null;
  const ctaLabel = clean(r.ctaLabel), ctaHref = safeHref(r.ctaHref);
  const secLabel = clean(r.secondaryLabel), secHref = safeHref(r.secondaryHref);
  return {
    id: String(r.id || r._id || `banner-${i}`),
    kind: 'banner',
    layout: r.layout === 'full' && image ? 'full' : 'split',
    tone: TONES.includes(r.tone as HeroTone) ? (r.tone as HeroTone) : TONES[i % TONES.length],
    eyebrow: clean(r.eyebrow),
    title,
    body: clean(r.body),
    cta: ctaLabel && ctaHref ? { label: ctaLabel, href: ctaHref } : null,
    secondary: secLabel && secHref ? { label: secLabel, href: secHref } : null,
    image,
    imageFit: r.imageFit === 'contain' ? 'contain' : 'cover',
    chips: null,
  };
}

/** Admin records -> slides (inactive ones and product slides whose product is gone are dropped). With no records, every featured product becomes a slide. */
export function resolveSlides(records: HeroRecord[], products: HeroProduct[]): HeroSlide[] {
  const fallback = () => [...products].filter((p) => p.image).sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured)).slice(0, 6).map((p, i) => productSlide(p, i));
  if (!records.length) return fallback();
  const out: HeroSlide[] = [];
  [...records].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).filter((r) => r.active !== false).forEach((r, i) => {
    if (r.type === 'product') {
      const p = products.find((x) => x.id === r.productId || (r.productSlug && x.slug === r.productSlug));
      if (p) out.push(productSlide(p, i, r));
    } else {
      const s = bannerSlide(r, i);
      if (s) out.push(s);
    }
  });
  // Never leave the home page without a hero, even if every banner is hidden.
  return out.length ? out : fallback();
}
