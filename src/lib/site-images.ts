import manifest from './site-images.json';

const MAP = manifest as Record<string, string>;

/** Maps a local `/assets/...` path to its WebP copy on ImageKit (/Site_Images). Other URLs pass through untouched. */
export function siteImage<T extends string | null | undefined>(src: T): T | string {
  if (!src) return src;
  return MAP[src] || src;
}
