'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Leaf } from 'lucide-react';

// Some catalogue products have no photo yet; show a branded placeholder instead of a broken image.
export function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-primary/40" role="img" aria-label={alt}>
        <Leaf className="w-12 h-12" />
        <span className="text-xs font-medium">Photo coming soon</span>
      </div>
    );
  }
  return <Image src={src} alt={alt} fill unoptimized className={className} onError={() => setFailed(true)} />;
}
