
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Leaf, ShieldCheck, HeartPulse, TrendingUp, ArrowRight, UserPlus } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-ayurveda');
  const products = [
    { id: 'product-ashwagandha', name: 'Ojas Ashwagandha', tag: 'Stress & Energy' },
    { id: 'product-triphala', name: 'Ojas Triphala', tag: 'Digestion' },
    { id: 'product-neem', name: 'Ojas Neem Care', tag: 'Skin & Immunity' },
    { id: 'product-chyawanprash', name: 'Ojas Vital Jam', tag: 'Vitality' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-full">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">OJAS CARE</span>
        </div>
        <nav className="hidden md:flex gap-8 font-medium">
          <Link href="#products" className="hover:text-primary transition-colors">Products</Link>
          <Link href="#plan" className="hover:text-primary transition-colors">Business Plan</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
        </nav>
        <Link href="/join">
          <Button className="font-semibold shadow-lg shadow-primary/20">Join Now</Button>
        </Link>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary-foreground font-semibold text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              India's Premier Ayurvedic MLM
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary leading-tight">
              सेहत से समृद्धि <br />
              <span className="text-secondary italic">Ojas Care</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Experience the ancient wisdom of Ayurveda combined with a powerful business opportunity. 
              Join a community dedicated to holistic health and financial freedom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/join">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold gap-2">
                  <UserPlus className="w-5 h-5" /> Start Your Journey
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-primary text-primary hover:bg-primary/5">
                Explore Products
              </Button>
            </div>
          </div>
          <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right duration-1000">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Active Members', value: '10K+' },
              { label: 'Products', value: '25+' },
              { label: 'Pincodes Covered', value: '15000+' },
              { label: 'Awards Won', value: '12' },
            ].map((stat, i) => (
              <div key={i} className="text-white space-y-2">
                <div className="text-3xl md:text-4xl font-headline font-bold">{stat.value}</div>
                <div className="text-sm opacity-80 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section id="products" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="font-headline text-4xl font-bold text-primary">Nature's Best For You</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our products are crafted using 100% natural herbs, following traditional Ayurvedic formulations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const imgData = PlaceHolderImages.find(img => img.id === product.id);
              return (
                <Card key={product.id} className="overflow-hidden border-none shadow-xl hover:-translate-y-2 transition-transform duration-300">
                  <div className="relative aspect-square">
                    {imgData && (
                      <Image 
                        src={imgData.imageUrl} 
                        alt={imgData.description} 
                        fill 
                        className="object-cover"
                        data-ai-hint={imgData.imageHint}
                      />
                    )}
                  </div>
                  <CardContent className="p-6 space-y-2">
                    <span className="text-xs font-bold text-secondary tracking-widest uppercase">{product.tag}</span>
                    <h3 className="font-headline text-lg font-bold">{product.name}</h3>
                    <Button variant="link" className="p-0 h-auto text-primary font-bold group">
                      Learn More <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Business Opportunity */}
        <section id="plan" className="py-24 bg-muted/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="font-headline text-4xl font-bold text-primary">Prosperity Through Health</h2>
                <p className="text-lg text-muted-foreground">
                  Our unique business plan ensures that as you share the gift of health, you also build a legacy of wealth.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: ShieldCheck, title: 'Safe & Proven Plan', desc: 'Secure binary structure with automated spillover logic.' },
                    { icon: HeartPulse, title: 'Health First', desc: 'Real products that provide real results for real people.' },
                    { icon: TrendingUp, title: 'Scalable Growth', desc: 'From Star to Kohinoor, your effort is rewarded at every rank.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-border/50">
                      <div className="bg-secondary/20 p-3 rounded-full h-fit">
                        <item.icon className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-primary rounded-3xl p-8 md:p-12 text-white space-y-8 shadow-2xl">
                <h3 className="text-2xl font-headline font-bold">Registration Packages</h3>
                <div className="space-y-4">
                  {[
                    { price: '1400', bv: '2 BV', income: '8% Matching' },
                    { price: '2800', bv: '4 BV', income: '9% Matching' },
                    { price: '7000', bv: '10 BV', income: '10% Matching' },
                  ].map((pkg, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/20 bg-white/5">
                      <div>
                        <div className="text-xs opacity-60">Starter Package</div>
                        <div className="text-xl font-bold">₹{pkg.price}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-secondary">{pkg.bv}</div>
                        <div className="text-xs opacity-60">{pkg.income}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/join" className="block">
                  <Button variant="secondary" className="w-full h-14 font-bold text-lg">Join the Network</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6" />
              <span className="font-headline font-bold text-2xl tracking-tight">OJAS CARE</span>
            </div>
            <p className="opacity-70">
              Ojas Care Private Limited is dedicated to restoring global health through the authentic wisdom of Ayurveda.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-headline font-bold text-lg">Quick Links</h4>
            <ul className="space-y-2 opacity-70">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/join">Join Now</Link></li>
              <li><Link href="/login">Login</Link></li>
              <li><Link href="/terms">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-headline font-bold text-lg">Contact Us</h4>
            <p className="opacity-70">
              Ojas Prosperity Hub, MG Road,<br />
              New Delhi, India - 110001<br />
              Email: support@ojascare.pro
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/10 text-center opacity-40 text-sm">
          © {new Date().getFullYear()} Ojas Care Private Limited. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
