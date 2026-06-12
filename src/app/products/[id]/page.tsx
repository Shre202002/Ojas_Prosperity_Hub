'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShoppingCart, 
  ShieldCheck, 
  Info, 
  Leaf,
  Phone,
  MessageSquare
} from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const product = PRODUCTS.find((p) => p.id === id);
  const imageData = PlaceHolderImages.find((img) => img.id === id);
  const logoImage = PlaceHolderImages.find(img => img.id === 'site-logo');

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-primary mb-4">Product Not Found</h1>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-primary/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {logoImage && (
            <Image 
              src={logoImage.imageUrl} 
              alt="Logo" 
              width={40} 
              height={40} 
              className="object-contain"
              unoptimized
            />
          )}
          <span className="font-headline font-bold text-lg text-primary tracking-tight uppercase hidden sm:inline-block">Ayurvedic Kendra & Neuropathy</span>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
      </header>

      <main className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-2xl border-4 border-white">
              {imageData && (
                <Image 
                  src={imageData.imageUrl} 
                  alt={product.name} 
                  fill 
                  className="object-cover p-8"
                  unoptimized
                />
              )}
              <Badge className="absolute top-6 left-6 px-4 py-1.5 text-sm uppercase tracking-wider shadow-lg">
                {product.tag}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xs font-bold uppercase opacity-60">100% Herbal</div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Leaf className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="text-xs font-bold uppercase opacity-60">Pure Ayurveda</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{product.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed italic">{product.shortDesc}</p>
              <div className="text-3xl font-bold text-secondary">{product.price}</div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> About Product
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.fullDesc}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Key Benefits</h3>
              <ul className="grid gap-3">
                {product.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> How to Use
              </h3>
              <p className="text-sm leading-relaxed">{product.howToUse}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="flex-1 h-14 text-lg font-bold gap-2">
                Order Now <ShoppingCart className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="flex-1 h-14 text-lg font-bold gap-2 border-primary text-primary hover:bg-primary/5">
                <Phone className="w-5 h-5" /> Enquire
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              *Individual results may vary. Consult your physician before starting any herbal supplement.
            </p>
          </div>
        </div>

        {/* Ingredients Section */}
        <section className="mt-24 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-headline font-bold text-primary">Key Ingredients</h2>
            <div className="h-1 w-24 bg-secondary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {product.ingredients.map((ing, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl shadow-lg border border-border/50 hover:border-primary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Leaf className="w-6 h-6" />
                </div>
                <div className="font-bold text-primary">{ing}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 px-6 border-t border-white/10 mt-16 text-center">
        <div className="max-w-7xl mx-auto space-y-6">
          <Link href="/" className="inline-flex items-center gap-3">
            {logoImage && (
              <Image 
                src={logoImage.imageUrl} 
                alt="Logo" 
                width={40} 
                height={40} 
                className="brightness-0 invert object-contain"
                unoptimized
              />
            )}
            <span className="font-headline font-bold text-xl tracking-tight uppercase">Ayurvedic Kendra & Neuropathy</span>
          </Link>
          <p className="opacity-70 max-w-2xl mx-auto">
            Experience the healing power of nature with our scientifically verified Ayurvedic solutions.
          </p>
          <div className="pt-8 opacity-40 text-sm">
            © {new Date().getFullYear()} Ayurvedic Kendra & Neuropathy. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
