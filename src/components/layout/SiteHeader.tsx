import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BrandLogo } from './BrandLogo';

const navLinks = [
  { name: 'Products', href: '/#products' },
  { name: 'Business Plan', href: '/#plan' },
  { name: 'Contact', href: '/#contact' },
];

export function SiteHeader() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-[72px]">
        <BrandLogo size={44} />

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-foreground/70">
          {navLinks.map(link => (
            <Link key={link.name} href={link.href} className="hover:text-primary transition-colors">{link.name}</Link>
          ))}
          <Link href="/login" className="hover:text-primary transition-colors">Member login</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden sm:inline-flex font-semibold">
            <Link href="/join">Join now</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu"><Menu className="w-6 h-6" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>Products, business plan, contact and login.</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-5 mt-12 font-headline text-2xl font-semibold text-primary">
                {navLinks.map(link => <Link key={link.name} href={link.href}>{link.name}</Link>)}
                <div className="gold-rule" />
                <Link href="/login">Member login</Link>
                <Button asChild className="h-12 font-sans font-semibold text-base"><Link href="/join">Join now</Link></Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
