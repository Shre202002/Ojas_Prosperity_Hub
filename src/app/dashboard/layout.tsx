
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Network, 
  Wallet, 
  User, 
  ChevronRight, 
  LogOut, 
  Leaf, 
  Search,
  Bell,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Binary Tree', href: '/dashboard/tree', icon: Network },
  { name: 'Earnings', href: '/dashboard/income', icon: Wallet },
  { name: 'Withdrawal', href: '/dashboard/withdraw', icon: LogOut },
  { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Sparkles },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-full">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl text-primary tracking-tight uppercase">OJAS CARE</span>
        </div>
        
        <ScrollArea className="flex-1 px-4">
          <nav className="space-y-2 py-4">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                  pathname === item.href 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}>
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                  {pathname === item.href && <ChevronRight className="w-4 h-4 ml-auto" />}
                </div>
              </Link>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="bg-secondary/10 p-4 rounded-2xl flex items-center gap-3">
            <div className="bg-secondary p-2 rounded-full text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-secondary uppercase tracking-wider">Plan Active</div>
              <div className="text-sm font-headline font-bold truncate">Executive (₹2,800)</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b px-8 flex items-center justify-between">
          <div className="relative w-96 hidden lg:block">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input 
              className="w-full bg-muted/50 border-none rounded-full pl-10 h-10 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
              placeholder="Search member ID or transaction..."
            />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
            </Button>
            <div className="h-10 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold font-headline">Rajesh Kumar</div>
                <div className="text-xs text-secondary font-bold uppercase">Silver Rank</div>
              </div>
              <Avatar className="h-10 w-10 border-2 border-primary/20 p-0.5">
                <AvatarImage src="https://picsum.photos/seed/user1/200" />
                <AvatarFallback>RK</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
