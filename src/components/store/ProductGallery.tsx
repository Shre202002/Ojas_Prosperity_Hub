'use client';

import { useState } from 'react';
import { ProductImage } from '@/components/ProductImage';
import { cn } from '@/lib/utils';

/** Marketplace-style gallery: thumbnail rail on the left (below the image on phones), large image on white. Hover or tap a thumbnail to switch. */
export function ProductGallery({ images, name, discountPct }: { images: string[]; name: string; discountPct: number }) {
  const [active, setActive] = useState(0);
  const list = images.length ? images : [''];
  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" role="group" aria-label="Product images">
          {list.map((src, i) => (
            <button
              key={src}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${list.length}`}
              aria-pressed={i === active}
              className={cn('relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', i === active ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/60')}
            >
              <ProductImage src={src} alt="" sizes="64px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-lg border bg-white">
        <ProductImage src={list[active]} alt={name} priority sizes="(min-width: 1024px) 480px, 92vw" className="object-contain" />
        {discountPct > 0 && (
          <span className="absolute left-3 top-3 rounded-sm bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">{discountPct}% off</span>
        )}
      </div>
    </div>
  );
}
