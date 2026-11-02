import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AccountLink } from '@/components/store/AccountLink';
import { CartButton } from '@/components/store/CartButton';
import { SITE } from '@/lib/site-config';
import { BrandLogo } from './BrandLogo';
import { HideOnScrollHeader } from './HideOnScrollHeader';

export const NAV_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Shop', href: '/shop' },
  { name: 'Services', href: '/services' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];

function SearchForm({ className, id }: { className?: string; id: string }) {
  return (
    <form action="/shop" role="search" className={className}>
      <label htmlFor={id} className="sr-only">Search products</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} name="q" type="search" placeholder="Search products" className="h-10 rounded-full bg-secondary pl-9" autoComplete="off" />
      </div>
    </form>
  );
}

export function SiteHeader() {
  return (
    <>
      <div className="bg-foreground px-3 py-1.5 text-center text-xs text-background sm:px-4 sm:py-2 sm:text-sm">
        Order online and our team confirms your order{SITE.phone || SITE.whatsapp ? ' by phone or WhatsApp' : ''} before anything ships.
      </div>

      <HideOnScrollHeader>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-6 sm:px-6 md:h-[88px]">
          <span className="md:hidden"><BrandLogo size={48} showName={false} /></span>
          <span className="hidden md:block"><BrandLogo size={68} showName={false} /></span>

          <nav aria-label="Main" className="ml-6 hidden lg:block">
            <ul className="flex items-center gap-8 text-[15px] font-medium">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="py-2 text-foreground/80 transition-colors hover:text-primary">{link.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <SearchForm id="site-search" className="mr-2 hidden w-56 xl:block" />
            <AccountLink />
            <CartButton />
            <Button asChild className="ml-2 hidden rounded-full px-6 md:inline-flex"><Link href="/shop">Shop now</Link></Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu className="w-6 h-6" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px]">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Site pages.</SheetDescription>
                </SheetHeader>
                <SearchForm id="mobile-search" className="mt-10" />
                <nav aria-label="Mobile" className="mt-6 flex flex-col gap-4 text-2xl font-semibold text-primary">
                  {NAV_LINKS.map((link) => (
                    <SheetClose asChild key={link.href}><Link href={link.href}>{link.name}</Link></SheetClose>
                  ))}
                  <SheetClose asChild><Link href="/join">Join us</Link></SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </HideOnScrollHeader>
    </>
  );
}
