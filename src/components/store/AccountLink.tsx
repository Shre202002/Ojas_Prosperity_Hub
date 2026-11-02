'use client';

import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/app-auth';

// Shows "Dashboard" for signed-in members and "Login" for everyone else (also while the session is still loading).
export function AccountLink() {
  const { user } = useUser();
  return (
    <Button asChild variant="ghost" className="gap-2 px-2 sm:px-3">
      <Link href={user ? '/dashboard' : '/login'}>
        <UserRound className="w-5 h-5" />
        <span className="hidden sm:inline">{user ? 'Dashboard' : 'Login'}</span>
        <span className="sr-only sm:hidden">{user ? 'Dashboard' : 'Login'}</span>
      </Link>
    </Button>
  );
}
