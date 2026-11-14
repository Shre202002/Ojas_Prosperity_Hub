import manifest from './site-images.json';

const MAP = manifest as Record<string, string>;

/** Maps a local `/assets/...` path to its WebP copy on ImageKit (/Site_Images). Other URLs pass through untouched. */
export function siteImage<T extends string | null | undefined>(src: T): T | string {
  if (!src) return src;
  return maskImageUrl(MAP[src] || src);
}

const IK_PREFIX = 'https://ik.imagekit.io/ari07rsa2/';

/** Serves ImageKit-hosted images from our own domain (`/media/...`, proxied by a rewrite in next.config.ts). */
export function maskImageUrl<T extends string | null | undefined>(url: T): T | string {
  return typeof url === 'string' && url.startsWith(IK_PREFIX) ? `/media/${url.slice(IK_PREFIX.length)}` : url;
}

/** Applies maskImageUrl to every string inside a JSON-like value (used before public data leaves the API). */
export function maskDeep<T>(value: T): T {
  if (typeof value === 'string') return maskImageUrl(value) as T;
  if (Array.isArray(value)) return value.map((v) => maskDeep(v)) as T;
  if (value && typeof value === 'object' && (value as any).constructor === Object) {
    return Object.fromEntries(Object.entries(value as object).map(([k, v]) => [k, maskDeep(v)])) as T;
  }
  return value;
}
