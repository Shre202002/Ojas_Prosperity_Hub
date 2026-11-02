import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.short,
    description: BRAND.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f0f8ff',
    theme_color: '#21c45d',
    icons: [{ src: BRAND.logo, sizes: '512x512', type: 'image/webp' }],
  };
}
