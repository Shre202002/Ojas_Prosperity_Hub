'use client';

import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { HeroManager } from '@/components/admin/HeroManager';
import { useUser } from '@/lib/app-auth';

/** Shown on the hero for signed-in administrators only. Opens the banner editor in a side sheet. */
export function HeroEditButton() {
  const { user } = useUser();
  const router = useRouter();
  if (user?.role !== 'admin') return null;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2 rounded-full shadow-lg"><Pencil className="h-4 w-4" />Edit hero</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="mb-6 text-left">
          <SheetTitle>Hero banners</SheetTitle>
          <SheetDescription>Add a banner, change the product, update the text or the order. Changes show on the home page right away.</SheetDescription>
        </SheetHeader>
        <HeroManager onChanged={() => router.refresh()} />
      </SheetContent>
    </Sheet>
  );
}
