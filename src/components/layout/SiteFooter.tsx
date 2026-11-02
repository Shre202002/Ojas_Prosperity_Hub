import Link from 'next/link';
import { Instagram, Facebook, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { getCategories } from '@/lib/catalog';
import { BRAND } from '@/lib/brand';
import { COMPANY, SITE } from '@/lib/site-config';
import { BrandLogo } from './BrandLogo';

const links = [
  { name: 'About us', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Blog', href: '/blog' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Contact us', href: '/contact' },
  { name: 'Business opportunity', href: '/join' },
  { name: 'Member login', href: '/login' },
];
const policies = [
  { name: 'Privacy policy', href: '/privacy' },
  { name: 'Terms of service', href: '/terms' },
  { name: 'Refund and cancellation', href: '/refund-policy' },
  { name: 'Shipping policy', href: '/shipping-policy' },
  { name: 'Disclaimer', href: '/disclaimer' },
];

export async function SiteFooter() {
  const categories = (await getCategories()).slice(0, 6);
  const socials = [
    { label: 'Instagram', href: SITE.social.instagram, Icon: Instagram },
    { label: 'Facebook', href: SITE.social.facebook, Icon: Facebook },
    { label: 'YouTube', href: SITE.social.youtube, Icon: Youtube },
  ].filter((s) => s.href);
  const address = SITE.address || COMPANY.marketer.address;

  return (
    <footer className="bg-foreground px-4 pb-8 pt-16 text-background sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-5">
          <BrandLogo tone="light" size={52} />
          <p className="max-w-sm text-sm leading-relaxed text-background/80">
            Ayurvedic and neuro-wellness formulations from {BRAND.legalName}, made in a GMP certified facility in Jaipur.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-chart-1" />{address}</li>
            {SITE.phone && <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-chart-1" /><a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="hover:text-white">{SITE.phone}</a></li>}
            {SITE.email && <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-chart-1" /><a href={`mailto:${SITE.email}`} className="hover:text-white">{SITE.email}</a></li>}
          </ul>
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-white/25 hover:bg-white/10"><Icon className="h-4 w-4" /></a>
              ))}
            </div>
          )}
        </div>

        <nav aria-label="Shop" className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Shop</h2>
          <ul className="space-y-3 text-sm">
            <li><Link href="/shop" className="hover:text-white">All products</Link></li>
            {categories.map((c) => (
              <li key={c.name}><Link href={`/shop?category=${encodeURIComponent(c.name)}`} className="hover:text-white">{c.name}</Link></li>
            ))}
            <li><Link href="/cart" className="hover:text-white">Your cart</Link></li>
          </ul>
        </nav>

        <nav aria-label="Useful links" className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Useful links</h2>
          <ul className="space-y-3 text-sm">
            {links.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-white">{l.name}</Link></li>)}
          </ul>
        </nav>

        <nav aria-label="Policies" className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Policies</h2>
          <ul className="space-y-3 text-sm">
            {policies.map((l) => <li key={l.href}><Link href={l.href} className="hover:text-white">{l.name}</Link></li>)}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-14 max-w-7xl space-y-3 border-t border-white/10 pt-6 text-xs leading-relaxed text-background/60">
        <p>
          These products are not intended to diagnose, treat, cure or prevent any disease. Consult a qualified practitioner before use, especially if you are pregnant, nursing or on medication.
          Income from the business opportunity depends on individual effort and is not guaranteed.
        </p>
        <p>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.{SITE.gstin ? ` GSTIN ${SITE.gstin}.` : ''}</p>
      </div>
    </footer>
  );
}
