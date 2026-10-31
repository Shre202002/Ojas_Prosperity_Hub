'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  ShoppingCart, 
  ShieldCheck, 
  Info, 
  Leaf,
  Phone,
  Star,
  Tag
} from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { ProductImage } from '@/components/ProductImage';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const product = PRODUCTS.find((p) => p.slug === id);

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
      <SiteHeader />

      <main className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/50 shadow-xl border border-border/60">
              <ProductImage src={product.image} alt={product.name} className="object-contain p-4" />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {product.isBestSeller && (
                  <Badge className="px-4 py-1.5 text-sm uppercase tracking-wider shadow-lg bg-accent text-accent-foreground">
                    Best Seller
                  </Badge>
                )}
                {product.discount > 0 && (
                  <Badge className="px-4 py-1.5 text-sm uppercase tracking-wider shadow-lg bg-destructive text-white">
                    {product.discount}% OFF
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xs font-bold uppercase opacity-60">100% Herbal</div>
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-accent/10 p-2 rounded-full">
                    <Leaf className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-xs font-bold uppercase opacity-60">Pure Ayurveda</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-accent">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <span className="text-sm font-bold">({product.reviews} Reviews)</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{product.name}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed italic">{product.shortDescription}</p>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-4">
                  <div className="text-4xl font-bold text-accent">₹{product.salePrice}</div>
                  {product.salePrice < product.price && (
                    <div className="text-xl text-muted-foreground line-through">₹{product.price}</div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1"><Tag className="w-3 h-3" /> SKU: {product.sku}</div>
                  <div className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Pack: {product.packSize}</div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> About Product
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
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

            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> How to Use
              </h3>
              <p className="text-sm leading-relaxed">{product.usage}</p>
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
      </main>

      <SiteFooter />
    </div>
  );
}
