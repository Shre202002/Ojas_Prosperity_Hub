// Converts every storefront image to WebP and uploads it to ImageKit (folder /Site_Images), then writes
// src/lib/site-images.json (local path -> ImageKit URL) which `siteImage()` uses at render time.
//   node scripts/upload-site-images.mjs
// Raw per-product PNG folders ("Gyne Care Syrup (300 ml)" etc.) are skipped: the site only uses the optimised <slug>/<n>.webp copies.
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const KEY = process.env.Imagekit_PRIVATE_KEY;
const ENDPOINT = (process.env.Imagekit_URL_endpoint || '').replace(/\/$/, '');
if (!KEY || !ENDPOINT) throw new Error('ImageKit env vars missing');
const FOLDER = '/Site_Images';
const root = path.resolve('public');

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (dir === path.join(root, 'assets', 'products') && !/^[a-z0-9-]+$/.test(e.name)) continue; // raw PNG folders
      walk(full);
    } else if (/\.(png|jpe?g|webp)$/i.test(e.name)) files.push(full);
  }
})(path.join(root, 'assets'));

const manifest = {};
const auth = Buffer.from(`${KEY}:`).toString('base64');
for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join('/'); // assets/...
  const webpRel = rel.replace(/\.(png|jpe?g)$/i, '.webp');
  const buf = /\.webp$/i.test(file) ? fs.readFileSync(file) : await sharp(file).rotate().webp({ quality: 82 }).toBuffer();
  const dir = path.posix.dirname(webpRel).replace(/^assets\/?/, '');
  const body = new FormData();
  body.append('file', new Blob([buf], { type: 'image/webp' }), path.posix.basename(webpRel));
  body.append('fileName', path.posix.basename(webpRel));
  body.append('folder', `${FOLDER}${dir ? '/' + dir : ''}`);
  body.append('useUniqueFileName', 'false');
  body.append('overwriteFile', 'true');
  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { Authorization: `Basic ${auth}` }, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${rel}: ${res.status} ${json.message}`);
  manifest['/' + rel] = json.url;
  console.log('ok', rel, '->', json.filePath, `(${Math.round(buf.length / 1024)}KB)`);
}
fs.writeFileSync('src/lib/site-images.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Uploaded ${files.length} images; manifest written.`);
