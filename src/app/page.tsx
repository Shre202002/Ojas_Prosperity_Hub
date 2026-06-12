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
  ShoppingCart, 
  Mail, 
  Phone, 
  Send,
  MapPin
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-ayurveda');
  const products = [
    { id: 'product-veershakti', name: 'Ojas Veer Shakti', tag: 'Best Seller', desc: 'Ayurvedic Vitality Tonic for Men', price: '₹899' },
    { id: 'product-narishakti', name: 'Ojas Nari Shakti', tag: 'Women Care', desc: "Women's Wellness & Vitality Tonic", price: '₹899' },
    { id: 'product-seathorn', name: 'Ojas Sea Thorn', tag: 'Daily Nutrition', desc: 'Herbal Nutritional Supplement', price: '₹899' },
    { id: 'product-liveramrit', name: 'Ojas Liver Amrit', tag: 'Liver Care', desc: 'Herbal Liver Detox & Wellness Tonic', price: '₹899' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-full">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-headline font-bold text-xl text-primary tracking-tight uppercase">Ayurvedic Kendra & Neuropathy</span>
        </div>
        <nav className="hidden md:flex gap-8 font-medium">
          <Link href="#products" className="hover:text-primary transition-colors">Products</Link>
          <Link href="#plan" className="hover:text-primary transition-colors">Business Plan</Link>
          <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
          <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/join">
            <Button className="font-semibold shadow-lg shadow-primary/20">Join Now</Button>
          </Link>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="px-6 py-12 md:py-24 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-secondary-foreground font-semibold text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              सेहत से समृद्धि - Health to Prosperity
            </div>
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-primary leading-tight">
              Natural Care, <br />
              <span className="text-secondary">Trusted Results</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              100% Herbal formulations crafted for your health and wellness. Experience the power of pure Ayurveda with Ayurvedic Kendra & Neuropathy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/join">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold gap-2">
                  <UserPlus className="w-5 h-5" /> Start Your Journey
                </Button>
              </Link>
              <Link href="#products">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-primary text-primary hover:bg-primary/5">
                  View Products
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right duration-1000 border-4 border-white">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                unoptimized
                className="object-cover"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
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
            <h2 className="font-headline text-4xl font-bold text-primary">Our Trusted Herbal Solutions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Scientifically proven Ayurvedic tonics designed for modern lifestyle needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => {
              const imgData = PlaceHolderImages.find(img => img.id === product.id);
              return (
                <Card key={product.id} className="overflow-hidden border-none shadow-xl hover:-translate-y-2 transition-transform duration-300 bg-white">
                  <div className="relative aspect-square">
                    {imgData && (
                      <Image 
                        src={imgData.imageUrl} 
                        alt={imgData.description} 
                        fill 
                        className="object-cover p-4"
                        data-ai-hint={imgData.imageHint}
                      />
                    )}
                    <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm uppercase tracking-wider">
                      {product.tag}
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-3">
                    <h3 className="font-headline text-lg font-bold text-primary">{product.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.desc}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-secondary">{product.price}</span>
                      <Button size="sm" className="h-9 gap-2">
                        <ShoppingCart className="w-3 h-3" /> Add
                      </Button>
                    </div>
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

        {/* Contact & Map Section */}
        <section id="contact" className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
              <div>
                <h2 className="font-headline text-4xl font-bold text-primary mb-4">Get in Touch</h2>
                <p className="text-muted-foreground">Have questions about our treatments or business plan? Reach out to our expert team.</p>
              </div>
              <form className="space-y-4 p-8 bg-white rounded-3xl shadow-xl border border-primary/10">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Full Name</Label>
                    <Input id="contact-name" placeholder="John Doe" className="rounded-xl h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email Address</Label>
                    <Input id="contact-email" type="email" placeholder="john@example.com" className="rounded-xl h-12" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Phone Number</Label>
                  <Input id="contact-phone" type="tel" placeholder="+91 XXXXX XXXXX" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea id="contact-message" placeholder="How can we help you?" className="min-h-[120px] rounded-xl" />
                </div>
                <Button className="w-full h-14 font-bold gap-2 text-lg shadow-lg shadow-primary/20">
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </form>
            </div>

            {/* Map & Info */}
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-700">
              <div>
                <h2 className="font-headline text-4xl font-bold text-primary mb-4">Our Location</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Visit us at our center in Jaipur for authentic Ayurvedic care and Neuropathy treatments.
                </p>
              </div>
              <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white h-[450px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3560.175364156085!2d75.8968982!3d26.834374099999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396dc922de47ff65%3A0x65988b46ab7db175!2sAyurved%20and%20Neurotherapy%20Kendra!5e0!3m2!1sen!2sin!4v1781255680119!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                 <div className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-border/50">
                    <div className="bg-primary/10 p-3 rounded-full h-fit">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">Visit Us</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Shiv mandir ke pas,<br />
                        Night and day Cafe ke aage,<br />
                        Goner Rd, Keshar Vihar, Chatarpura,<br />
                        Jaipur, Rajasthan 303012
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-border/50">
                    <div className="bg-secondary/10 p-3 rounded-full h-fit">
                      <Phone className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">Call Us</h4>
                      <p className="text-sm text-muted-foreground">+91 94142 56321</p>
                    </div>
                  </div>
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
              <span className="font-headline font-bold text-xl tracking-tight uppercase">Ayurvedic Kendra & Neuropathy</span>
            </div>
            <p className="opacity-70">
              Ayurvedic Kendra & Neuropathy is dedicated to restoring global health through the authentic wisdom of Ayurveda and Natural Healing.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-headline font-bold text-lg">Quick Links</h4>
            <ul className="space-y-2 opacity-70">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/join">Join Now</Link></li>
              <li><Link href="/login">Login</Link></li>
              <li><Link href="#contact">Contact Us</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-headline font-bold text-lg">Contact Info</h4>
            <p className="opacity-70 flex items-start gap-2 text-sm leading-relaxed">
              <MapPin className="w-4 h-4 shrink-0 mt-1" />
              Shiv mandir ke pas, Night and day Cafe ke aage,<br />
              Goner Rd, Keshar Vihar, Chatarpura,<br />
              Jaipur, Rajasthan 303012
            </p>
            <p className="opacity-70 flex items-center gap-2 mt-2">
              <Phone className="w-4 h-4" /> +91 94142 56321
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/10 text-center opacity-40 text-sm">
          © {new Date().getFullYear()} Ayurvedic Kendra & Neuropathy. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
