'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, doc, signOut } from '@/lib/app-auth';
import {
  LayoutDashboard,
  Network,
  User,
  ShieldCheck,
  LogOut,
  Package,
  ClipboardCheck,
  Sparkles,
  History,
  Globe,
  ShoppingBag,
  Fingerprint,
  WalletCards,
  Menu,
  Loader2,
  GalleryHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { cn } from '@/lib/utils';

type NavItem = { name: string; href: string; icon: LucideIcon };

const memberNav: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Network', href: '/dashboard/network', icon: Network },
  { name: 'Wallets', href: '/dashboard/wallet', icon: WalletCards },
  { name: 'KYC Verification', href: '/dashboard/kyc', icon: ShieldCheck },
  { name: 'Network Reviews', href: '/dashboard/network/reviews', icon: ClipboardCheck },
  { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Sparkles },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

// Admins get the shared pages that apply to them plus the management group.
const adminShared = memberNav.filter(item => !['/dashboard/kyc', '/dashboard/wallet'].includes(item.href));
const adminNav: NavItem[] = [
  { name: 'Wallets & Income', href: '/dashboard/admin/wallet', icon: WalletCards },
  { name: 'KYC Review Hub', href: '/dashboard/admin/kyc', icon: Fingerprint },
  { name: 'Product Catalog', href: '/dashboard/admin/products', icon: ShoppingBag },
  { name: 'Hero Banners', href: '/dashboard/admin/hero', icon: GalleryHorizontal },
  { name: 'Ledger Audit', href: '/dashboard/admin/transactions', icon: History },
  { name: 'Transaction Ledger', href: '/dashboard/admin/ledger', icon: History },
  { name: 'Global Trees & Add Member', href: '/dashboard/admin/trees', icon: Globe },
  { name: 'Packages & Rates', href: '/dashboard/admin/packages', icon: Package },
  { name: 'Withdrawals', href: '/dashboard/admin/withdrawals', icon: WalletCards },
  { name: 'Users', href: '/dashboard/admin/users', icon: User },
];

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-primary/40'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-sidebar-primary' : 'text-sidebar-foreground/50')} />
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

function SidebarBody({ isAdmin, pathname, onNavigate, onSignOut }: { isAdmin: boolean; pathname: string; onNavigate?: () => void; onSignOut: () => void }) {
  const primary = isAdmin ? adminShared : memberNav;
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="p-5 border-b border-sidebar-border">
        <BrandLogo href="/dashboard" tone="light" size={40} />
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-4">
          {primary.map(item => <NavLink key={item.href} item={item} active={pathname === item.href} onNavigate={onNavigate} />)}
          {isAdmin && (
            <div className="pt-6 space-y-1">
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-primary">Management</p>
              {adminNav.map(item => <NavLink key={item.href} item={item} active={pathname === item.href} onNavigate={onNavigate} />)}
            </div>
          )}
        </nav>
      </ScrollArea>
      <div className="p-3 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground" onClick={onSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
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

  const distributorRef = useMemoFirebase(() => (
    user && db ? doc(db, 'distributors', user.uid) : null
  ), [db, user?.uid]);

  const { data: distributor } = useDoc(distributorRef);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (!user) return null;

  const isAdmin = user.role === 'admin' || distributor?.rank === 'Admin';
  const displayName = user.displayName || distributor?.name || user.email;
  const initials = String(displayName || '?').trim().slice(0, 2).toUpperCase();
  const handleSignOut = () => { signOut(auth).then(() => router.push('/login')); };

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:block w-64 shrink-0 border-r border-sidebar-border">
        <SidebarBody isAdmin={isAdmin} pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b bg-card/80 backdrop-blur flex items-center gap-3 px-4 md:px-8">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-sidebar-border">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody isAdmin={isAdmin} pathname={pathname} onNavigate={() => setMenuOpen(false)} onSignOut={handleSignOut} />
            </SheetContent>
          </Sheet>
          <div className="md:hidden"><BrandLogo href="/dashboard" size={32} showName={false} /></div>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
                  <span className="hidden sm:block text-right leading-tight">
                    <span className="block text-sm font-semibold">{displayName}</span>
                    <span className="block text-xs text-muted-foreground">{isAdmin ? 'Administrator' : 'Member'}</span>
                  </span>
                  <Avatar className="h-9 w-9 ring-2 ring-accent/50"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback></Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
