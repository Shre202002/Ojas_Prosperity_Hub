import type { MetadataRoute } from 'next';

const base = () => (process.env.APP_URL || 'http://localhost:9002').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/admin', '/cart', '/order-received', '/reset-password'] }],
    sitemap: `${base()}/sitemap.xml`,
  };
}
