
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Network, 
  Wallet, 
  User, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  TrendingUp,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Network', href: '/dashboard/network', icon: Network },
  { name: 'KYC Verification', href: '/dashboard/kyc', icon: ShieldCheck },
  { name: 'Incentives', href: '/dashboard/incentives', icon: Wallet },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, loading } = useUser(auth);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/register');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r hidden md:flex flex-col shadow-sm">
        <div className="p-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-lg tracking-tight">DirectSeller</span>
          </Link>
        </div>

        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-1.5 py-4">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group",
                  pathname === item.href 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}>
                  <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                  <span className="font-medium text-sm">{item.name}</span>
                  {pathname === item.href && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                </div>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-6 border-t mt-auto">
          <div className="bg-slate-900 p-6 rounded-[1.5rem] mb-6 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Current Goal</p>
                <TrendingUp className="w-3 h-3 text-primary" />
              </div>
              <p className="text-white font-headline font-bold">Reach Gold Rank</p>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%]" />
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-500 hover:text-destructive hover:bg-destructive/5 h-12 rounded-xl"
            onClick={() => auth && signOut(auth)}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
