// Makes web-sized WebP copies of the product photos used on the storefront (originals are left untouched).
//   node scripts/optimize-product-images.mjs
// public/assets/products/<imageFolder>/<n>.png  ->  public/assets/products/<slug>/<n>.webp
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve('public/assets/products');
const { products } = JSON.parse(fs.readFileSync('scripts/data/product-catalog.json', 'utf8'));

// Photos 6-7 are AI-made "customer" portraits (they read as endorsements) and are not used.
// Constipation #5 and Gyne Care #5 still show "[DOSE]" / "[TIMING]" placeholders until the real dose is known.
const SKIP = { 'shri-constipation-churn-200g': [5] };
// Gyne Care and Ortho Go Oil keep photos 5-7 at the client's request (6-7 are AI portraits; Gyne photo 5 shows [DOSE]/[TIMING] placeholders).
const MAX = { 'gyne-care-syrup-300ml': 7, 'shri-ortho-go-oil-50ml': 7 };
for (const p of products) {
  const from = path.join(root, p.imageFolder);
  const files = fs.readdirSync(from).filter((f) => /^\d+\.png$/i.test(f) && parseInt(f) <= (MAX[p.slug] || 5) && !(SKIP[p.slug] || []).includes(parseInt(f))).sort((a, b) => parseInt(a) - parseInt(b));
  fs.mkdirSync(path.join(root, p.slug), { recursive: true });
  for (const file of files) {
    const out = path.join(root, p.slug, `${parseInt(file)}.webp`);
    const info = await sharp(path.join(from, file)).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
    console.log(`${p.slug}/${parseInt(file)}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)}KB`);
  }
}
