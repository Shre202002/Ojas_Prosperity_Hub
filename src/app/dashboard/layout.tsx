
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Network, 
  Wallet, 
  User, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  TrendingUp,
  Package,
  ClipboardCheck,
  Sparkles,
  History,
  Globe,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Network', href: '/dashboard/network', icon: Network },
  { name: 'KYC Verification', href: '/dashboard/kyc', icon: ShieldCheck },
  { name: 'Network Reviews', href: '/dashboard/network/reviews', icon: ClipboardCheck },
  { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Sparkles },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user, loading } = useUser(auth);

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
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (!user) return null;

  const isAdmin = distributor?.rank === 'Admin' || user.email === 'sriyanshgupta24@gmail.com';

  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r hidden md:flex flex-col shadow-sm">
        <div className="p-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Package className="w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-lg tracking-tight text-slate-900">DirectSeller</span>
          </Link>
        </div>

        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-1.5 py-4">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                  pathname === item.href 
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                )}>
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", pathname === item.href ? "text-white" : "text-slate-400 group-hover:text-primary")} />
                  <span className="font-bold text-sm tracking-tight">{item.name}</span>
                  {pathname === item.href && <ChevronRight className="w-4 h-4 ml-auto opacity-60" />}
                </div>
              </Link>
            ))}

            {isAdmin && (
              <div className="pt-8 space-y-1.5">
                <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Management</p>
                <Link href="/dashboard/admin/transactions">
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                    pathname === '/dashboard/admin/transactions' ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                  )}>
                    <History className="w-5 h-5" />
                    <span className="font-bold text-sm tracking-tight">Ledger Audit</span>
                  </div>
                </Link>
                <Link href="/dashboard/admin/trees">
                  <div className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                    pathname === '/dashboard/admin/trees' ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
                  )}>
                    <Globe className="w-5 h-5" />
                    <span className="font-bold text-sm tracking-tight">Global Trees</span>
                  </div>
                </Link>
              </div>
            )}
          </nav>
        </ScrollArea>

        <div className="p-6 border-t mt-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-500 hover:text-red-500 hover:bg-red-50 h-14 rounded-2xl transition-all"
            onClick={() => auth && signOut(auth)}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm tracking-tight">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
