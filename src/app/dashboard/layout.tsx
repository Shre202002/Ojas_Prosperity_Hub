'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, doc, signOut } from '@/lib/app-auth';
import {
  LayoutDashboard, Network, User, ShieldCheck, LogOut, Package, ClipboardCheck, Sparkles, History, Globe, ShoppingBag,
  Fingerprint, WalletCards, Menu, Loader2, GalleryHorizontal, Moon, Sun, ChevronDown, Settings2, type LucideIcon,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BrandLogo } from '@/components/layout/BrandLogo';
import '@/components/vertix/vertix.css';

type NavItem = { name: string; short: string; href: string; icon: LucideIcon };

const memberNav: NavItem[] = [
  { name: 'Dashboard', short: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Network', short: 'Network', href: '/dashboard/network', icon: Network },
  { name: 'Wallets', short: 'Wallets', href: '/dashboard/wallet', icon: WalletCards },
  { name: 'KYC Verification', short: 'KYC', href: '/dashboard/kyc', icon: ShieldCheck },
  { name: 'Network Reviews', short: 'Reviews', href: '/dashboard/network/reviews', icon: ClipboardCheck },
  { name: 'AI Assistant', short: 'Assistant', href: '/dashboard/ai-assistant', icon: Sparkles },
  { name: 'Profile', short: 'Profile', href: '/dashboard/profile', icon: User },
];

// Admins get the shared pages that apply to them plus the management group.
const adminShared = memberNav.filter((item) => !['/dashboard/kyc', '/dashboard/wallet'].includes(item.href));
const adminNav: NavItem[] = [
  { name: 'Wallets & Income', short: 'Wallets', href: '/dashboard/admin/wallet', icon: WalletCards },
  { name: 'KYC Review Hub', short: 'KYC Hub', href: '/dashboard/admin/kyc', icon: Fingerprint },
  { name: 'Product Catalog', short: 'Products', href: '/dashboard/admin/products', icon: ShoppingBag },
  { name: 'Hero Banners', short: 'Banners', href: '/dashboard/admin/hero', icon: GalleryHorizontal },
  { name: 'Ledger Audit', short: 'Audit', href: '/dashboard/admin/transactions', icon: History },
  { name: 'Transaction Ledger', short: 'Ledger', href: '/dashboard/admin/ledger', icon: History },
  { name: 'Global Trees & Add Member', short: 'Trees', href: '/dashboard/admin/trees', icon: Globe },
  { name: 'Packages & Rates', short: 'Packages', href: '/dashboard/admin/packages', icon: Package },
  { name: 'Withdrawals', short: 'Withdrawals', href: '/dashboard/admin/withdrawals', icon: WalletCards },
  { name: 'Users', short: 'Users', href: '/dashboard/admin/users', icon: User },
];

/** The nav item whose href is the longest prefix of the current path (so /network/reviews does not also light up /network). */
function activeHref(pathname: string, items: NavItem[]) {
  return items
    .filter((i) => pathname === i.href || (i.href !== '/dashboard' && pathname.startsWith(i.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

function SheetNav({ items, active, label, onNavigate }: { items: NavItem[]; active?: string; label?: string; onNavigate: () => void }) {
  return (
    <div className="space-y-1">
      {label && <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-primary">{label}</p>}
      {items.map((item) => (
        <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active === item.href ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active === item.href ? 'bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-primary/40' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60'}`}>
          <item.icon className="h-4 w-4 shrink-0" /><span className="truncate">{item.name}</span>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading } = useUser(auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => { try { setDark(localStorage.getItem('sjapl_dash_theme') === 'dark'); } catch { /* storage unavailable */ } }, []);
  const setTheme = (d: boolean) => { setDark(d); try { localStorage.setItem('sjapl_dash_theme', d ? 'dark' : 'light'); } catch { /* ignore */ } };

  const distributorRef = useMemoFirebase(() => (user && db ? doc(db, 'distributors', user.uid) : null), [db, user?.uid]);
  const { data: distributor } = useDoc(distributorRef);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  if (loading) return (
    <div className="flex h-screen w-screen items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  );
  if (!user) return null;

  const isAdmin = user.role === 'admin' || distributor?.rank === 'Admin';
  const displayName = user.displayName || distributor?.name || user.email;
  const initials = String(displayName || '?').trim().slice(0, 2).toUpperCase();
  const handleSignOut = () => { signOut(auth).then(() => router.push('/login')); };
  const primary = isAdmin ? adminShared : memberNav;
  const active = activeHref(pathname, [...primary, ...(isAdmin ? adminNav : [])]);
  const adminActive = isAdmin && adminNav.some((i) => i.href === active);
  const isHome = pathname === '/dashboard';

  return (
    <div className="vx" data-theme={dark ? 'dark' : 'light'}>
      <div className="mx-auto max-w-[1560px] p-2 sm:p-4">
        <div className="rounded-[28px] p-3 sm:rounded-[32px] sm:p-5" style={{ background: 'var(--vx-shell)' }}>
          <motion.header data-vx-motion initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2 sm:gap-3">
            <div className="vx-pill flex items-center p-1.5"><BrandLogo href="/dashboard" size={36} showName={false} /></div>

            <nav aria-label="Dashboard" className="vx-pill vx-scroll hidden min-w-0 max-w-full gap-1 overflow-x-auto p-1.5 md:mx-auto md:flex">
              {primary.map((item) => {
                const on = active === item.href;
                return (
                  <Link key={item.href} href={item.href} aria-current={on ? 'page' : undefined} className="relative whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium lg:px-4">
                    {on && <motion.span data-vx-motion layoutId="vx-nav" className="absolute inset-0 rounded-full" style={{ background: 'var(--vx-on)' }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className="relative" style={{ color: on ? 'var(--vx-on-fg)' : 'var(--vx-ink)', opacity: on ? 1 : 0.75 }}>{item.short}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium lg:px-4" style={adminActive ? { background: 'var(--vx-on)', color: 'var(--vx-on-fg)' } : { color: 'var(--vx-ink)', opacity: 0.75 }}>
                      <Settings2 className="h-3.5 w-3.5" />Admin<ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Management</DropdownMenuLabel><DropdownMenuSeparator />
                    {adminNav.map((i) => <DropdownMenuItem key={i.href} onClick={() => router.push(i.href)}><i.icon className="mr-2 h-4 w-4" />{i.name}</DropdownMenuItem>)}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
              <div className="vx-pill flex items-center gap-0.5 p-1">
                {[{ d: false, I: Sun, l: 'Light mode' }, { d: true, I: Moon, l: 'Dark mode' }].map(({ d, I, l }) => (
                  <button key={l} aria-label={l} aria-pressed={dark === d} onClick={() => setTheme(d)} className="grid h-8 w-8 place-items-center rounded-full sm:h-9 sm:w-9" style={dark === d ? { background: 'var(--vx-soft)' } : undefined}><I className="h-4 w-4" /></button>
                ))}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="vx-pill flex items-center gap-2 py-1 pl-1 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3 sm:pr-3" aria-label="Account menu">
                    <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white sm:h-9 sm:w-9" style={{ background: 'var(--vx-accent)' }}>{initials}</span>
                    <span className="hidden text-left leading-tight xl:block"><span className="block max-w-[140px] truncate text-xs font-semibold">{displayName}</span><span className="block text-[10px]" style={{ color: 'var(--vx-mute)' }}>{isAdmin ? 'Administrator' : 'Member'}</span></span>
                    <ChevronDown className="hidden h-3.5 w-3.5 opacity-60 sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel><DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild><button className="vx-pill grid h-11 w-11 place-items-center md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button></SheetTrigger>
                <SheetContent side="right" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="border-b border-sidebar-border p-5"><BrandLogo href="/dashboard" tone="light" size={40} /></div>
                  <ScrollArea className="h-[calc(100%-5rem)] px-3 pb-6">
                    <SheetNav items={primary} active={active} onNavigate={() => setMenuOpen(false)} />
                    {isAdmin && <SheetNav items={adminNav} active={active} label="Management" onNavigate={() => setMenuOpen(false)} />}
                    <button onClick={handleSignOut} className="mt-6 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/60"><LogOut className="h-4 w-4" />Sign out</button>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </motion.header>

          <div className="mt-4 flex gap-4 sm:mt-5 lg:gap-6">
            <motion.aside data-vx-motion initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="sticky top-4 hidden h-fit shrink-0 flex-col gap-4 md:flex">
              <div className="vx-pill flex flex-col gap-1 p-1">
                {primary.map((item) => {
                  const on = active === item.href;
                  return (
                    <Link key={item.href} href={item.href} aria-label={item.name} title={item.name} className="relative grid h-9 w-9 place-items-center rounded-full">
                      {on && <motion.span data-vx-motion layoutId="vx-rail" className="absolute inset-0 rounded-full" style={{ background: 'var(--vx-on)' }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                      <item.icon className="relative h-4 w-4" style={{ color: on ? 'var(--vx-on-fg)' : 'var(--vx-ink)' }} />
                    </Link>
                  );
                })}
              </div>
              <div className="vx-pill flex flex-col p-1">
                <button aria-label="Sign out" title="Sign out" onClick={handleSignOut} className="grid h-9 w-9 place-items-center rounded-full"><LogOut className="h-4 w-4" /></button>
              </div>
            </motion.aside>

            <main className="min-w-0 flex-1 pb-4">
              {isHome ? children : <div className="vx-light-panel p-3 sm:p-5 lg:p-6">{children}</div>}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
