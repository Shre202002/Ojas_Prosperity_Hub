import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Leaf,
  ShieldCheck,
  HeartPulse,
  TrendingUp,
  UserPlus,
  ShoppingCart,
  Mail,
  Phone,
  Send,
  MapPin,
  ChevronRight,
  Menu,
  CheckCircle2,
  Award,
  Users
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PRODUCTS } from '@/lib/products';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-ayurveda');
  const logoImage = PlaceHolderImages.find(img => img.id === 'site-logo');

  const navLinks = [
    { name: 'Products', href: '#products' },
    { name: 'Business Plan', href: '#plan' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-primary/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {logoImage ? (
              <Image 
                src={logoImage.imageUrl} 
                alt="Ayurvedic Kendra Logo" 
                width={48} 
                height={48} 
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="bg-primary p-2 rounded-full text-white">
                <Leaf className="w-6 h-6" />
              </div>
            )}
            <span className="font-headline font-bold text-lg md:text-xl text-primary tracking-tight uppercase hidden sm:block">
              Ayurvedic Kendra & Neuropathy
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex gap-8 font-semibold text-primary/80">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="hover:text-primary transition-colors">
                {link.name}
              </Link>
            ))}
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/join" className="hidden sm:block">
              <Button className="font-bold shadow-lg shadow-primary/20 px-6">Join Now</Button>
            </Link>

            {/* Mobile Nav */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-primary">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-6 mt-12">
                  {navLinks.map((link) => (
                    <Link key={link.name} href={link.href} className="text-xl font-headline font-bold text-primary hover:text-secondary transition-colors">
                      {link.name}
                    </Link>
                  ))}
                  <hr className="border-primary/10" />
                  <Link href="/login" className="text-xl font-headline font-bold text-primary">Login</Link>
                  <Link href="/join">
                    <Button className="w-full font-bold h-12">Join Now</Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="px-6 py-12 lg:py-24 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary-foreground font-bold text-sm border border-secondary/20 mx-auto lg:mx-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              सेहत से समृद्धि - Health to Prosperity
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary leading-[1.1]">
              Natural Care, <br />
              <span className="text-secondary drop-shadow-sm">Trusted Results</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
              Empowering lives with 100% Herbal formulations crafted for your holistic health and business prosperity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/join">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold gap-2 shadow-xl shadow-primary/20">
                  <UserPlus className="w-5 h-5" /> Start Your Journey
                </Button>
              </Link>
              <Link href="#products">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-primary/20 text-primary hover:bg-primary/5">
                  View Products
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right duration-1000 border-8 border-white bg-white group">
            {heroImage && (
              <Image
                src={heroImage.imageUrl}
                alt={heroImage.description}
                fill
                unoptimized
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-primary py-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
          
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center relative z-10">
            {[
              { label: 'Active Members', value: '10K+', icon: Users },
              { label: 'Products', value: '25+', icon: ShoppingCart },
              { label: 'Network Reach', value: '15K+', icon: TrendingUp },
              { label: 'Awards Won', value: '12', icon: Award },
            ].map((stat, i) => (
              <div key={i} className="text-white space-y-3 group">
                <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary group-hover:text-primary transition-all">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-4xl lg:text-5xl font-headline font-bold">{stat.value}</div>
                <div className="text-xs lg:text-sm opacity-70 uppercase font-bold tracking-[0.2em]">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section id="products" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-20">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">Our Trusted Herbal Solutions</h2>
            <div className="h-1.5 w-24 bg-secondary mx-auto rounded-full"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg pt-4">
              Scientifically proven Ayurvedic tonics designed for modern lifestyle needs and peak physical health.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PRODUCTS.map((product) => {
              const imgData = PlaceHolderImages.find(img => img.id === product.id);
              return (
                <Link key={product.id} href={`/products/${product.id}`} className="group">
                  <Card className="h-full overflow-hidden border-none shadow-lg hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 bg-white flex flex-col">
                    <div className="relative aspect-square overflow-hidden bg-muted/20">
                      {imgData && (
                        <Image
                          src={imgData.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover p-6 group-hover:scale-110 transition-transform duration-500"
                          unoptimized
                        />
                      )}
                      <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                        {product.tag}
                      </div>
                    </div>
                    <CardContent className="p-8 space-y-4 flex-1 flex flex-col">
                      <h3 className="font-headline text-xl font-bold text-primary group-hover:text-secondary transition-colors line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">{product.shortDesc}</p>
                      <div className="flex items-center justify-between pt-6 border-t border-muted/50">
                        <span className="text-2xl font-bold text-secondary font-headline">{product.price}</span>
                        <div className="bg-primary/5 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Business Opportunity */}
        <section id="plan" className="py-24 bg-primary/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="space-y-4">
                  <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">Prosperity Through Health</h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Our unique business plan ensures that as you share the gift of health, you also build a legacy of sustainable wealth.
                  </p>
                </div>
                
                <div className="grid gap-6">
                  {[
                    { icon: ShieldCheck, title: 'Safe & Proven Plan', desc: 'Secure binary structure with automated spillover logic for maximum team support.' },
                    { icon: HeartPulse, title: 'Health First Philosophy', desc: 'Authentic products that provide real results, ensuring customer retention and trust.' },
                    { icon: TrendingUp, title: 'Unlimited Growth Potentials', desc: 'Earn matching bonuses, direct rewards, and rank-based incentives as you scale.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 p-6 rounded-[2rem] bg-white shadow-sm border border-primary/5 hover:border-secondary transition-colors group">
                      <div className="bg-secondary/10 p-4 rounded-2xl h-fit group-hover:bg-secondary transition-colors">
                        <item.icon className="w-7 h-7 text-secondary group-hover:text-primary transition-colors" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-headline font-bold text-lg text-primary">{item.title}</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary rounded-[3rem] p-8 md:p-14 text-white space-y-10 shadow-3xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

                <div className="space-y-2 relative z-10 text-center lg:text-left">
                  <h3 className="text-3xl font-headline font-bold">Registration Packages</h3>
                  <p className="opacity-70">Start your journey at a level that fits your ambition.</p>
                </div>

                <div className="space-y-6 relative z-10">
                  {[
                    { title: 'Basic Starter', price: '1400', bv: '2 BV', income: '8% Matching', color: 'bg-white/5 border-white/10' },
                    { title: 'Executive Kit', price: '2800', bv: '4 BV', income: '9% Matching', color: 'bg-white/10 border-white/20' },
                    { title: 'Business Builder', price: '7000', bv: '10 BV', income: '10% Matching', color: 'bg-secondary/20 border-secondary/30' },
                  ].map((pkg, i) => (
                    <div key={i} className={`flex items-center justify-between p-6 rounded-[1.5rem] border ${pkg.color} group hover:bg-white/20 transition-all cursor-pointer`}>
                      <div>
                        <div className="text-xs font-bold uppercase opacity-60 mb-1">{pkg.title}</div>
                        <div className="text-2xl font-bold font-headline">₹{pkg.price}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-secondary">{pkg.bv}</div>
                        <div className="text-xs font-bold opacity-60 uppercase">{pkg.income}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/join" className="block relative z-10">
                  <Button variant="secondary" className="w-full h-16 font-bold text-xl rounded-2xl shadow-2xl shadow-black/20 hover:scale-[1.02] transition-transform">
                    Join the Network Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Map Section */}
        <section id="contact" className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Contact Form */}
            <div className="space-y-10 animate-in fade-in slide-in-from-left duration-700">
              <div className="space-y-4">
                <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">Get in Touch</h2>
                <div className="h-1.5 w-24 bg-secondary rounded-full"></div>
                <p className="text-lg text-muted-foreground pt-2">Have questions about our treatments or business plan? Our experts are here to guide you.</p>
              </div>

              <form className="space-y-6 p-8 md:p-10 bg-white rounded-[2.5rem] shadow-xl border border-primary/5">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="contact-name" className="font-bold text-primary ml-1">Full Name</Label>
                    <Input id="contact-name" placeholder="John Doe" className="rounded-2xl h-14 bg-muted/30 border-none focus-visible:ring-primary/20" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="contact-email" className="font-bold text-primary ml-1">Email Address</Label>
                    <Input id="contact-email" type="email" placeholder="john@example.com" className="rounded-2xl h-14 bg-muted/30 border-none focus-visible:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="contact-phone" className="font-bold text-primary ml-1">Phone Number</Label>
                  <Input id="contact-phone" type="tel" placeholder="+91 XXXXX XXXXX" className="rounded-2xl h-14 bg-muted/30 border-none focus-visible:ring-primary/20" />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="contact-message" className="font-bold text-primary ml-1">How can we help?</Label>
                  <Textarea id="contact-message" placeholder="Describe your inquiry..." className="min-h-[150px] rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20" />
                </div>
                <Button className="w-full h-16 font-bold gap-3 text-xl rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform">
                  <Send className="w-5 h-5" /> Send Message
                </Button>
              </form>
            </div>

            {/* Map & Info */}
            <div className="space-y-12 animate-in fade-in slide-in-from-right duration-700 lg:sticky lg:top-32">
              <div className="space-y-4">
                <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary">Our Center</h2>
                <div className="h-1.5 w-24 bg-secondary rounded-full"></div>
                <p className="text-lg text-muted-foreground pt-2">
                  Experience authentic Ayurvedic care and Neuropathy treatments in the heart of Jaipur.
                </p>
              </div>

              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white h-[400px] lg:h-[450px] relative group">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.175364156085!2d75.8968982!3d26.834374099999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396dc922de47ff65%3A0x65988b46ab7db175!2sAyurved%20and%20Neurotherapy%20Kendra!5e0!3m2!1sen!2sin!4v1781255680119!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-700"
                ></iframe>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex gap-5 p-6 rounded-[2rem] bg-white shadow-md border border-primary/5 hover:border-primary transition-colors">
                  <div className="bg-primary/10 p-4 rounded-2xl h-fit">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-headline font-bold text-lg text-primary">Visit Us</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Shiv mandir ke pas,<br />
                      Night and day Cafe ke aage,<br />
                      Goner Rd, Keshar Vihar, Chatarpura,<br />
                      Jaipur, Rajasthan 303012
                    </p>
                  </div>
                </div>
                <div className="flex gap-5 p-6 rounded-[2rem] bg-white shadow-md border border-secondary/5 hover:border-secondary transition-colors">
                  <div className="bg-secondary/10 p-4 rounded-2xl h-fit">
                    <Phone className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-headline font-bold text-lg text-primary">Call Support</h4>
                    <p className="text-xl font-headline font-bold text-secondary">+91 94142 56321</p>
                    <p className="text-xs text-muted-foreground">Mon-Sat, 9AM - 7PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white pt-24 pb-12 px-6 border-t border-white/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
          <div className="space-y-8 col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              {logoImage ? (
                <Image
                  src={logoImage.imageUrl}
                  alt="Ayurvedic Kendra Logo"
                  width={40}
                  height={40}
                  className="brightness-0 invert object-contain"
                  unoptimized
                />
              ) : (
                <Leaf className="w-8 h-8 text-secondary" />
              )}
              <span className="font-headline font-bold text-xl tracking-tight uppercase">Ayurvedic Kendra</span>
            </Link>
            <p className="opacity-70 leading-relaxed text-sm">
              Dedicated to restoring global health through the authentic wisdom of Ayurveda and Natural Healing since 2012.
            </p>
            <div className="flex gap-4">
              {/* Social placeholders could go here */}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-headline font-bold text-lg border-b border-white/10 pb-4">Quick Navigation</h4>
            <ul className="space-y-4 opacity-70 text-sm">
              <li><Link href="/" className="hover:text-secondary transition-colors">Home</Link></li>
              <li><Link href="/join" className="hover:text-secondary transition-colors">Business Opportunities</Link></li>
              <li><Link href="/login" className="hover:text-secondary transition-colors">Member Dashboard</Link></li>
              <li><Link href="#products" className="hover:text-secondary transition-colors">Product Catalogue</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-headline font-bold text-lg border-b border-white/10 pb-4">Product Care</h4>
            <ul className="space-y-4 opacity-70 text-sm">
              {PRODUCTS.slice(0, 4).map(p => (
                <li key={p.id}><Link href={`/products/${p.id}`} className="hover:text-secondary transition-colors">{p.name}</Link></li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="font-headline font-bold text-lg border-b border-white/10 pb-4">Direct Contact</h4>
            <div className="space-y-4 opacity-70 text-sm leading-relaxed">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-secondary shrink-0" />
                <p>Shiv mandir ke pas, Goner Rd, Jaipur, Rajasthan</p>
              </div>
              <div className="flex gap-3 items-center">
                <Phone className="w-5 h-5 text-secondary shrink-0" />
                <p>+91 94142 56321</p>
              </div>
              <div className="flex gap-3 items-center">
                <Mail className="w-5 h-5 text-secondary shrink-0" />
                <p>care@ayurvedickendra.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs md:text-sm opacity-50">
          <p>© {new Date().getFullYear()} Ayurvedic Kendra & Neuropathy. All Rights Reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
