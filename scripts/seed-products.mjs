// Loads the client's product catalogue (scripts/data/product-catalog.json) into the `products` collection.
// Dry run by default: `node scripts/seed-products.mjs`
// Write:              `node scripts/seed-products.mjs --confirm`
// Products are matched by SKU, then slug (and the old starter SKU for Special 15).
//  - Untouched seed/starter products are refreshed from the catalogue.
//  - Products an admin created or edited only get their EMPTY fields filled, so admin changes are never overwritten.
// Run `node scripts/optimize-product-images.mjs` first so the images exist.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ojas_prosperity_hub';
if (!uri) throw new Error('MONGODB_URI or MONGO_URI is required.');
const confirm = process.argv.includes('--confirm');

const catalog = JSON.parse(fs.readFileSync('scripts/data/product-catalog.json', 'utf8'));
const skuById = Object.fromEntries(catalog.products.map((p) => [p.id, p.sku]));
const LEGACY_SKU = { 'SJNP-SP15-500': 'SPECIAL-15-500' };
const isEmpty = (v) => v === null || v === undefined || v === '' || v === 0 || (Array.isArray(v) && v.length === 0);

function imagesFor(slug) {
  const dir = path.join('public/assets/products', slug);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).sort((a, b) => parseInt(a) - parseInt(b)) : [];
  return files.map((f, i) => ({ url: `/assets/products/${slug}/${f}`, order: i, isPrimary: i === 0 }));
}

function toDoc(p) {
  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));
  return clean({
    slug: p.slug, name: p.name, sku: p.sku, category: catalog.categories[p.categoryId],
    subtitle: p.subtitle, price: p.pricing.salePrice, mrp: p.pricing.mrp, bvValue: p.pricing.bv,
    dp: p.pricing.dp, // member price: stored for the network, never shown on the public site
    maxOrderQty: p.maxOrderQuantity, packSize: p.packSize,
    shortDescription: p.shortDescription, description: p.longDescription,
    highlights: p.highlights, benefitItems: p.keyBenefits, benefits: p.keyBenefits.map((b) => b.title),
    ingredients: p.ingredients, ingredientsBasis: p.ingredientsBasis, howToUse: p.howToUse, usage: p.howToUse?.dosage,
    suitableFor: p.suitableFor, precautions: p.precautions, storage: p.storage, shelfLife: p.shelfLife,
    licenseNumber: p.licenseNumber, classification: p.classification, certifications: p.certifications,
    tags: p.tags, faqs: p.faqs, seo: p.seo, relatedSkus: (p.relatedProductIds || []).map((id) => skuById[id]).filter(Boolean),
    isFeatured: p.isFeatured, isBestSeller: p.isBestseller, images: imagesFor(p.slug),
  });
}

const client = new MongoClient(uri);
await client.connect();
try {
  const products = client.db(dbName).collection('products');
  console.log(`${confirm ? 'WRITING' : 'DRY RUN'} database "${dbName}" (${catalog.products.length} products)\n`);
  for (const p of catalog.products) {
    const doc = toDoc(p);
    const existing = await products.findOne({ $or: [{ sku: p.sku }, { slug: p.slug }, ...(LEGACY_SKU[p.sku] ? [{ sku: LEGACY_SKU[p.sku] }] : [])] });
    const label = `${p.name.padEnd(40)} ₹${String(doc.price).padStart(5)}  BV ${String(doc.bvValue).padStart(3)}  ${doc.images.length} imgs`;
    const now = new Date();
    if (!existing) {
      if (confirm) await products.insertOne({ id: `seed-${p.slug}`, ...doc, stock: null, status: 'active', createdAt: now, updatedAt: now, createdBy: 'seed' });
      console.log(`  ${confirm ? 'added  ' : 'would add   '} ${label}`);
      continue;
    }
    const untouched = existing.createdBy === 'seed';
    const set = untouched ? { ...doc, status: 'active' } : Object.fromEntries(Object.entries(doc).filter(([k]) => isEmpty(existing[k])));
    if (confirm && Object.keys(set).length) await products.updateOne({ _id: existing._id }, { $set: { ...set, updatedAt: now } });
    console.log(`  ${confirm ? 'updated' : 'would update'} ${label}  (${untouched ? 'starter draft refreshed' : `${Object.keys(set).length} empty fields filled`}, matched ${existing.sku})`);
  }
  if (!confirm) console.log('\nNothing changed. Re-run with --confirm to apply.');
} finally {
  await client.close();
}
