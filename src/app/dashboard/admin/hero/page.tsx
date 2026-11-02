'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeroManager } from '@/components/admin/HeroManager';

export default function AdminHeroPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Hero banners</CardTitle>
          <CardDescription>The big slider at the top of the home page. Add banners, switch the product shown, update the text, reorder or hide slides.</CardDescription>
          <div><Button asChild variant="outline" size="sm"><Link href="/" target="_blank">View home page</Link></Button></div>
        </CardHeader>
        <CardContent><HeroManager /></CardContent>
      </Card>
    </div>
  );
}
