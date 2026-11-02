'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Image from '@/components/SiteImage';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BvBadge } from '@/components/store/BvBadge';
import { formatPrice } from '@/lib/money';
import type { HeroSlide, HeroTone } from '@/lib/hero-types';
import { cn } from '@/lib/utils';

const DELAY = 6500;

// Backdrop and text colours per tone. Text is chosen for contrast on that backdrop.
const TONE: Record<HeroTone, { bg: string; text: string; sub: string }> = {
  light: { bg: 'bg-secondary', text: 'text-foreground', sub: 'text-foreground/75' },
  mint: { bg: 'bg-accent', text: 'text-foreground', sub: 'text-foreground/75' },
  deep: { bg: 'bg-brand-gradient', text: 'text-white', sub: 'text-white/80' },
};

function SlideBody({ slide, active }: { slide: HeroSlide; active: boolean }) {
  const full = slide.layout === 'full' && !!slide.image;
  const tone = full ? { bg: 'bg-foreground', text: 'text-white', sub: 'text-white/85' } : TONE[slide.tone];
  const discount = slide.chips?.mrp && slide.chips.mrp > slide.chips.price ? Math.round(((slide.chips.mrp - slide.chips.price) / slide.chips.mrp) * 100) : 0;
  const d = (n: number) => ({ '--d': `${n}ms` }) as React.CSSProperties;

  return (
    <div data-active={active} className={cn('relative flex min-h-[calc(100svh-124px)] min-w-0 flex-[0_0_100%] items-center overflow-hidden', tone.bg, tone.text)}>
      {full && (
        <>
          <Image src={slide.image} alt="" fill priority={active} sizes="100vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        </>
      )}
      {!full && <div aria-hidden className="pointer-events-none absolute -right-32 top-1/2 hidden aspect-square h-[120%] -translate-y-1/2 rounded-full bg-primary/15 md:block" />}

      <div className={cn('relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-36 pt-10 sm:px-6 md:pb-32', !full && 'md:grid-cols-[1.05fr_1fr] md:gap-12')}>
        <div className={cn('order-2 max-w-xl text-center md:text-left', !full && 'md:order-1', full && 'md:max-w-2xl')}>
          {slide.eyebrow && <p className={cn('hero-in text-sm font-medium', tone.sub)} style={d(0)}>{slide.eyebrow}</p>}
          <h2 className="hero-in mt-2 text-4xl font-semibold leading-[1.06] sm:text-5xl lg:text-6xl xl:text-7xl" style={d(80)}>{slide.title}</h2>
          {slide.body && <p className={cn('hero-in mx-auto mt-4 max-w-md text-base leading-relaxed sm:text-lg md:mx-0', tone.sub)} style={d(160)}>{slide.body}</p>}

          {slide.chips && (
            <div className="hero-in mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start" style={d(240)}>
              <p className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold">{formatPrice(slide.chips.price)}</span>
                {slide.chips.mrp && slide.chips.mrp > slide.chips.price && <span className={cn('text-lg line-through', tone.sub)}>{formatPrice(slide.chips.mrp)}</span>}
                {discount > 0 && <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">{discount}% off</span>}
              </p>
              <BvBadge bv={slide.chips.bv} size="lg" className="text-primary" />
            </div>
          )}

          {(slide.cta || slide.secondary) && (
            <div className="hero-in mt-7 flex flex-wrap justify-center gap-3 md:justify-start" style={d(320)}>
              {slide.cta && <Button asChild size="lg" className="h-12 rounded-full px-8 text-base"><Link href={slide.cta.href} tabIndex={active ? 0 : -1}>{slide.cta.label}</Link></Button>}
              {slide.secondary && <Button asChild size="lg" variant="outline" className={cn('h-12 rounded-full bg-transparent px-8 text-base', tone.text === 'text-white' && 'border-white/60 text-white hover:bg-white/15 hover:text-white')}><Link href={slide.secondary.href} tabIndex={active ? 0 : -1}>{slide.secondary.label}</Link></Button>}
            </div>
          )}
        </div>

        {!full && (
          <div className="relative order-1 mx-auto w-[min(70vw,320px)] md:order-2 md:w-full md:max-w-[min(480px,62vh)]">
            {slide.kind === 'product' || slide.imageFit === 'contain' ? (
              <div className="hero-parallax relative aspect-square" style={{ transform: 'translate3d(calc(var(--px, 0) * 14px), calc(var(--py, 0) * 10px), 0)' }}>
                <div aria-hidden className="absolute inset-0 rounded-full bg-card shadow-xl ring-1 ring-primary/20" />
                {slide.image && <Image src={slide.image} alt={slide.title} fill priority={active} sizes="(min-width: 768px) 480px, 70vw" className="hero-float rounded-full object-contain p-4 md:p-6" />}
              </div>
            ) : (
              <div className="hero-parallax relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-primary/20" style={{ transform: 'translate3d(calc(var(--px, 0) * 12px), calc(var(--py, 0) * 8px), 0)' }}>
                {slide.image && <Image src={slide.image} alt={slide.title} fill priority={active} sizes="(min-width: 768px) 480px, 70vw" className="object-cover" />}
              </div>
            )}
            {slide.chips && (
              <>
                <div className="hero-parallax absolute -left-2 top-6 rounded-2xl bg-card px-4 py-2 text-foreground shadow-lg ring-1 ring-border sm:-left-6" style={{ transform: 'translate3d(calc(var(--px, 0) * -26px), calc(var(--py, 0) * -18px), 0)' }}>
                  <p className="text-xs text-muted-foreground">{slide.chips.category}</p>
                  <p className="text-lg font-semibold">{formatPrice(slide.chips.price)}</p>
                </div>
                {slide.chips.bv > 0 && (
                  <div className="hero-parallax absolute -right-2 bottom-8 rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow-lg sm:-right-6" style={{ transform: 'translate3d(calc(var(--px, 0) * -22px), calc(var(--py, 0) * -14px), 0)' }}>
                    <p className="text-xs opacity-80">Business volume</p>
                    <p className="text-lg font-semibold">{slide.chips.bv.toLocaleString('en-IN')} BV</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Full-screen hero slider. Slides come from admin-managed banners (or featured products when there are none); `editor` is the admin-only edit control. */
export function HomeHero({ slides, editor }: { slides: HeroSlide[]; editor?: ReactNode }) {
  const many = slides.length > 1;
  const [viewport, embla] = useEmblaCarousel({ loop: many, duration: 32, watchDrag: many });
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(many);
  const [hovering, setHovering] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    onSelect();
    embla.on('select', onSelect);
    embla.on('reInit', onSelect);
    return () => { embla.off('select', onSelect); embla.off('reInit', onSelect); };
  }, [embla]);

  // Reduced motion: never advance on its own.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  }, []);

  // The slider can shrink or grow when an admin edits banners.
  useEffect(() => { embla?.reInit(); setIndex(0); }, [slides.length, embla]);

  const next = useCallback(() => embla?.scrollNext(), [embla]);
  const prev = useCallback(() => embla?.scrollPrev(), [embla]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
  };

  // Pointer parallax (mouse only): publishes --px/--py (-1..1) for the image and floating chips.
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !sectionRef.current) return;
    const r = sectionRef.current.getBoundingClientRect();
    sectionRef.current.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5) * 2));
    sectionRef.current.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const resetPointer = () => { sectionRef.current?.style.setProperty('--px', '0'); sectionRef.current?.style.setProperty('--py', '0'); setHovering(false); };

  if (!slides.length) return null;
  const running = playing && !hovering && many;
  const upNext = slides[(index + 1) % slides.length];

  return (
    <section
      ref={sectionRef}
      aria-roledescription="carousel"
      aria-label="Featured offers and products"
      className="relative isolate overflow-hidden"
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={resetPointer}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={() => setHovering(false)}
    >
      <div className="overflow-hidden" ref={viewport}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div key={slide.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}: ${slide.title}`} inert={i !== index ? true : undefined} className="min-w-0 flex-[0_0_100%]">
              <SlideBody slide={slide} active={i === index} />
            </div>
          ))}
        </div>
      </div>

      {editor && <div className="absolute right-4 top-4 z-20">{editor}</div>}

      {/* Control bar: counter, story-style progress bars (also the navigation), next-up label, arrows, pause. */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t bg-card/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 pb-3 pt-1 sm:px-6">
          {many && (
            <div className="flex gap-1.5" role="tablist" aria-label="Choose slide">
              {slides.map((s, i) => (
                <button key={s.id} type="button" role="tab" aria-selected={i === index} aria-label={`Go to slide ${i + 1}: ${s.title}`} onClick={() => embla?.scrollTo(i)} className="group h-6 flex-1 focus-visible:outline-none">
                  <span className="relative block h-1 overflow-hidden rounded-full bg-foreground/25 transition-all group-hover:h-1.5 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                    {i < index && <span className="absolute inset-0 bg-primary" />}
                    {i === index && (
                      <span
                        key={`${index}-${playing}`}
                        className={cn('absolute inset-0 bg-primary', playing && 'hero-fill')}
                        style={{ ['--hero-delay' as string]: `${DELAY}ms`, animationPlayState: running ? 'running' : 'paused', ...(playing ? {} : { transform: 'scaleX(1)', transformOrigin: 'left' }) }}
                        onAnimationEnd={next}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-3">
            <p className="text-lg font-semibold tabular-nums text-foreground" aria-live="off">
              {String(index + 1).padStart(2, '0')}<span className="text-muted-foreground"> / {String(slides.length).padStart(2, '0')}</span>
            </p>
            {many && upNext && (
              <button type="button" onClick={next} className="ml-2 hidden max-w-xs truncate text-left text-sm text-foreground/80 hover:text-foreground md:block">
                <span className="text-muted-foreground">Up next: </span>{upNext.title}
              </button>
            )}
            {many && (
              <div className="ml-auto flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full bg-card" onClick={prev} aria-label="Previous slide"><ArrowLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full bg-card" onClick={next} aria-label="Next slide"><ArrowRight className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full bg-card" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause automatic slide change' : 'Play automatic slide change'}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
