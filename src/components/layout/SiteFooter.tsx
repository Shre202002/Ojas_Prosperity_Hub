import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { BRAND } from '@/lib/brand';
import { BrandLogo } from './BrandLogo';

// TODO(client): replace with SJAPL's registered address, phone and email.
export const CONTACT = {
  address: 'Registered office address to be confirmed',
  phone: '+91 00000 00000',
  email: 'care@example.com',
};

export function SiteFooter() {
  return (
    <footer className="bg-brand-gradient text-white pt-20 pb-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="space-y-5">
          <BrandLogo tone="light" size={52} />
          <p className="text-sm text-white/65 leading-relaxed">
            Authentic Ayurvedic and neuro-wellness care, with a transparent network for the people who share it.
          </p>
          <p className="font-deva text-accent">{BRAND.tagline}</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-headline text-xl font-semibold text-accent">Explore</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li><Link href="/join" className="hover:text-white">Business opportunity</Link></li>
            <li><Link href="/login" className="hover:text-white">Member dashboard</Link></li>
            <li><Link href="/#products" className="hover:text-white">Product catalogue</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="font-headline text-xl font-semibold text-accent">Products</h4>
          <ul className="space-y-3 text-sm text-white/70">
            {PRODUCTS.slice(0, 4).map(p => (
              <li key={p.slug}><Link href={`/products/${p.slug}`} className="hover:text-white">{p.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="font-headline text-xl font-semibold text-accent">Contact</h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex gap-3"><MapPin className="w-4 h-4 mt-0.5 text-accent shrink-0" />{CONTACT.address}</li>
            <li className="flex gap-3"><Phone className="w-4 h-4 mt-0.5 text-accent shrink-0" />{CONTACT.phone}</li>
            <li className="flex gap-3"><Mail className="w-4 h-4 mt-0.5 text-accent shrink-0" />{CONTACT.email}</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-xs text-white/50">
        <p>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white">Privacy policy</Link>
          <Link href="#" className="hover:text-white">Terms of service</Link>
        </div>
      </div>
    </footer>
  );
}
