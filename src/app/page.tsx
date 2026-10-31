import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Leaf,
  ShieldCheck,
  HeartPulse,
  TrendingUp,
  UserPlus,
  Send,
  MapPin,
  Phone,
  ChevronRight,
  BrainCircuit,
  Network,
  Star,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PRODUCTS } from '@/lib/products';
import { BRAND } from '@/lib/brand';
import { ProductImage } from '@/components/ProductImage';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter, CONTACT } from '@/components/layout/SiteFooter';

const pillars = [
  { icon: Leaf, title: 'Rooted in Ayurveda', desc: 'Herbal formulations drawn from classical Ayurvedic tradition.' },
  { icon: BrainCircuit, title: 'Neuro-wellness focus', desc: 'Care that looks after the mind and nervous system, not only the body.' },
  { icon: ShieldCheck, title: 'Trust you can verify', desc: 'KYC-verified members and a ledger you can audit line by line.' },
  { icon: Network, title: 'A network that rewards', desc: 'A transparent binary plan with matching income and clear rules.' },
];

function SectionHeading({ eyebrow, title, body, center = true }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={center ? 'text-center max-w-2xl mx-auto space-y-4' : 'space-y-4'}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">{title}</h2>
      {body && <p className="text-lg text-muted-foreground">{body}</p>}
    </div>
  );
}

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-ayurveda');

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-accent/30">
      <SiteHeader />

      <main className="pt-[72px] overflow-x-hidden">
        {/* Hero */}
        <section className="bg-ivory-wash">
          <div className="px-4 sm:px-6 py-14 lg:py-24 max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-deva border border-accent/30">
                {BRAND.tagline}
                <span className="font-sans text-xs text-muted-foreground">· {BRAND.taglineEn}</span>
              </p>
              <h1 className="font-headline text-5xl sm:text-6xl lg:text-7xl font-bold text-primary leading-[1.05]">
                Ayurvedic care for the body,{' '}
                <span className="text-accent">calm for the mind.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                {BRAND.name} brings authentic herbal wellness and neuro-care together, and a rewarding network for members who share it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="h-12 px-7 font-semibold gap-2">
                  <Link href="/join"><UserPlus className="w-5 h-5" /> Start your journey</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7 font-semibold border-primary/30 text-primary hover:bg-primary/5">
                  <Link href="#products">View products</Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -inset-4 rounded-[2rem] border border-accent/40" aria-hidden />
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-card">
                {heroImage && (
                  <Image src={heroImage.imageUrl} alt={heroImage.description} fill unoptimized priority className="object-cover" />
                )}
              </div>
              <div className="absolute -bottom-6 -left-4 sm:-left-8 bg-card rounded-full p-1.5 shadow-xl ring-2 ring-accent/50">
                <Image src={BRAND.logo} alt={`${BRAND.name} seal`} width={92} height={92} className="rounded-full" />
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="bg-brand-gradient py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {pillars.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-white space-y-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-accent"><Icon className="w-5 h-5" /></div>
                <h3 className="font-headline text-2xl font-semibold">{title}</h3>
                <p className="text-sm text-white/65 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section id="products" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
          <SectionHeading eyebrow="Our range" title="Herbal solutions you can trust" body="Ayurvedic tonics and supplements made for modern lifestyles and lasting vitality." />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRODUCTS.map((product) => (
              <Link key={product.slug} href={`/products/${product.slug}`} className="group">
                <Card className="h-full overflow-hidden border-border/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="relative aspect-square bg-secondary/50">
                    <ProductImage src={product.image} alt={product.name} className="object-contain p-3 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {product.isBestSeller && (
                        <span className="bg-accent text-accent-foreground text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Best seller</span>
                      )}
                      {product.discount > 0 && (
                        <span className="bg-destructive text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">{product.discount}% off</span>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-3 flex-1 flex flex-col">
                    <div className="flex items-center gap-1 text-accent">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-semibold">{product.rating} ({product.reviews})</span>
                    </div>
                    <h3 className="font-headline text-2xl font-bold text-primary line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">{product.shortDescription}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-headline font-bold text-primary">₹{product.salePrice}</span>
                        {product.salePrice < product.price && <span className="text-xs text-muted-foreground line-through">₹{product.price}</span>}
                      </div>
                      <span className="p-2 rounded-full bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Business plan */}
        <section id="plan" className="py-24 bg-secondary/40 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <SectionHeading center={false} eyebrow="Business plan" title="Share wellness. Build a legacy." body="As you introduce people to better health, you build a team and an income that grows with it." />
              <div className="grid gap-4">
                {[
                  { icon: ShieldCheck, title: 'A clear, structured plan', desc: 'A binary structure with spillover support, so your team grows together.' },
                  { icon: HeartPulse, title: 'Health first', desc: 'Authentic products that deliver real results build lasting customer trust.' },
                  { icon: TrendingUp, title: 'Room to grow', desc: 'Matching bonuses and direct rewards as your network scales.' },
                ].map(item => (
                  <div key={item.title} className="flex gap-5 p-5 rounded-xl bg-card border border-border/60">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg h-fit"><item.icon className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <h4 className="font-headline text-xl font-bold text-primary">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-brand-gradient rounded-2xl p-8 md:p-12 text-white space-y-8 shadow-2xl">
              <div className="space-y-2">
                <h3 className="font-headline text-3xl font-bold">Registration packages</h3>
                <p className="text-white/65">Pick the level that fits your ambition. Current prices are shown when you register.</p>
              </div>
              <ul className="space-y-3">
                {['Starter', 'Growth', 'Platinum'].map(title => (
                  <li key={title} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.07] border border-white/10">
                    <span className="font-headline text-xl font-semibold">{title}</span>
                    <span className="text-sm text-accent">Live pricing &amp; BV at signup</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" className="w-full h-12 font-semibold text-base bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/join">Join the network</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 scroll-mt-20">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div className="space-y-8">
              <SectionHeading center={false} eyebrow="Contact" title="Get in touch" body="Questions about our products or the business plan? Our team is happy to guide you." />
              {/* shortcut: form has no handler yet; wire to an email/CRM endpoint before launch */}
              <form className="space-y-5 p-6 md:p-8 bg-card rounded-2xl shadow-lg border border-border/60">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Full name</Label>
                    <Input id="contact-name" placeholder="Your name" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email address</Label>
                    <Input id="contact-email" type="email" placeholder="you@example.com" className="h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone number</Label>
                  <Input id="contact-phone" type="tel" placeholder="+91" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">How can we help?</Label>
                  <Textarea id="contact-message" placeholder="Describe your inquiry…" className="min-h-[130px]" />
                </div>
                <Button className="w-full h-12 font-semibold gap-2"><Send className="w-4 h-4" /> Send message</Button>
              </form>
            </div>

            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="flex gap-4 p-5 rounded-xl bg-card border border-border/60">
                  <MapPin className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <h4 className="font-headline text-xl font-bold text-primary">Visit us</h4>
                    <p className="text-sm text-muted-foreground mt-1">{CONTACT.address}</p>
                  </div>
                </div>
                <div className="flex gap-4 p-5 rounded-xl bg-card border border-border/60">
                  <Phone className="w-5 h-5 text-accent shrink-0 mt-1" />
                  <div>
                    <h4 className="font-headline text-xl font-bold text-primary">Call support</h4>
                    <p className="text-sm text-muted-foreground mt-1">{CONTACT.phone}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-brand-gradient text-white p-8 flex items-center gap-6">
                <Image src={BRAND.logo} alt="" width={96} height={96} className="rounded-full ring-2 ring-accent shrink-0" />
                <div className="space-y-2">
                  <p className="font-deva text-accent text-lg">{BRAND.tagline}</p>
                  <p className="text-sm text-white/70">{BRAND.taglineEn}. That is the promise behind every product we make.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
