'use client';

import { useCallback, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { siteImage } from '@/lib/site-images';
import { cn } from '@/lib/utils';

/**
 * Drop-in replacement for next/image: serves local /assets paths from ImageKit (WebP), lazy-loads by default
 * (eager when `priority`), and shows a pulsing skeleton until the picture has loaded.
 */
export default function SiteImage({ src, className, onLoad, priority, loading, ...rest }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const resolved = typeof src === 'string' ? siteImage(src) : src;
  // Images served from cache can finish before hydration; catch those so the skeleton never sticks.
  const ref = useCallback((el: HTMLImageElement | null) => { if (el?.complete && el.naturalWidth) setLoaded(true); }, []);
  return (
    <Image
      {...rest}
      ref={ref}
      src={resolved}
      priority={priority}
      loading={priority ? undefined : loading || 'lazy'}
      onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
      className={cn(className, !loaded && 'animate-pulse bg-muted')}
    />
  );
}
