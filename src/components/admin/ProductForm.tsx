
'use client';

import { useState, useRef } from 'react';
import { useFirestore, doc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from '@/lib/app-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Loader2, 
  Upload, 
  X, 
  Check, 
  Star, 
  Image as ImageIcon,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const CATEGORIES = [
  "Wellness Tonics",
  "Herbal Capsules",
  "Daily Nutrition",
  "Skin & Hair Care",
  "Personal Care",
  "Digestive Health"
];

interface ProductFormProps {
  initialData?: any;
  onSuccess: () => void;
}

export function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    sku: initialData?.sku || '',
    category: initialData?.category || '',
    price: initialData?.price || '',
    bvValue: initialData?.bvValue || '',
    stock: initialData?.stock || '',
    status: initialData?.status || 'active',
  });

  const [images, setImages] = useState<any[]>(initialData?.images || []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
          toast({ variant: 'destructive', title: 'File too large', description: `${file.name} is larger than 5MB.` });
          continue;
        }

        const imageId = Math.random().toString(36).substring(2, 15);
        const productId = initialData?.id || 'temp';
        const storagePath = `products/${productId}/${imageId}_${file.name}`;
        const url = URL.createObjectURL(file);

        newImages.push({
          url,
          storagePath,
          isPrimary: newImages.length === 0,
          order: newImages.length
        });
      }
      setImages(newImages);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index: number) => {
    const imageToRemove = images[index];
    const newImages = images.filter((_, i) => i !== index);
    
    // Adjust orders and primary status
    if (imageToRemove.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    
    newImages.forEach((img, i) => img.order = i);
    setImages(newImages);

    // Attempt to delete from storage if it's a real file
    if (imageToRemove.storagePath) {
      try {
        URL.revokeObjectURL(imageToRemove.url);
      } catch (e) {
        console.error('Failed to delete storage object:', e);
      }
    }
  };

  const setPrimary = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    setImages(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === images.length - 1)) return;
    
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    
    newImages.forEach((img, i) => img.order = i);
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (images.length === 0) {
      toast({ variant: 'destructive', title: 'Missing Images', description: 'At least one product image is required.' });
      return;
    }

    setLoading(true);
    try {
      // SKU Uniqueness Check (simplified for v1)
      if (!initialData || initialData.sku !== formData.sku) {
        const skuQuery = query(collection(db, 'products'), where('sku', '==', formData.sku));
        const skuSnap = await getDocs(skuQuery);
        if (!skuSnap.empty) {
          throw new Error('This SKU is already assigned to another product.');
        }
      }

      const productData = {
        ...formData,
        price: Number(formData.price),
        bvValue: Number(formData.bvValue),
        stock: formData.stock !== '' ? Number(formData.stock) : null,
        images,
        updatedAt: serverTimestamp(),
      };

      if (initialData) {
        await updateDoc(doc(db, 'products', initialData.id), productData);
        toast({ title: 'Product Updated' });
      } else {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, {
          ...productData,
          id: newDocRef.id,
          createdAt: serverTimestamp(),
          createdBy: 'admin' // In reality, fetch from current user context
        });
        toast({ title: 'Product Created Successfully' });
      }
      onSuccess();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product Name</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Liver Amrit"
              required
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe product benefits and ingredients..."
              className="min-h-[120px] rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">SKU / Code</Label>
              <Input 
                value={formData.sku} 
                onChange={e => setFormData({...formData, sku: e.target.value})}
                placeholder="AK-LA-500"
                required
                className="h-12 rounded-xl font-mono-data uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
              <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price (₹)</Label>
              <Input 
                type="number"
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
                className="h-12 rounded-xl font-mono-data"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">BV Value</Label>
              <Input 
                type="number"
                value={formData.bvValue} 
                onChange={e => setFormData({...formData, bvValue: e.target.value})}
                placeholder="0"
                required
                className="h-12 rounded-xl font-mono-data"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stock Qty</Label>
              <Input 
                type="number"
                value={formData.stock} 
                onChange={e => setFormData({...formData, stock: e.target.value})}
                placeholder="Unlimited"
                className="h-12 rounded-xl font-mono-data"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product Media</Label>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted rounded-xl p-10 text-center space-y-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
          >
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/10 transition-colors">
               {uploading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary" />}
            </div>
            <div className="space-y-1">
              <p className="font-bold text-foreground">Drag & Drop Images</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (Max 5MB)</p>
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {images.map((img, i) => (
               <div key={i} className={cn(
                 "relative group rounded-2xl overflow-hidden border-2 aspect-square bg-muted",
                 img.isPrimary ? "border-primary shadow-lg" : "border-muted"
               )}>
                  <Image src={img.url} alt="Product" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className={cn("h-8 w-8 rounded-full", img.isPrimary ? "bg-primary text-white" : "bg-white text-foreground")}
                      onClick={() => setPrimary(i)}
                     >
                       <Star className={cn("w-4 h-4", img.isPrimary ? "fill-current" : "")} />
                     </Button>
                     <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white text-foreground"
                      onClick={() => moveImage(i, 'up')}
                     >
                       <ArrowUp className="w-4 h-4" />
                     </Button>
                     <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full bg-white text-foreground"
                      onClick={() => moveImage(i, 'down')}
                     >
                       <ArrowDown className="w-4 h-4" />
                     </Button>
                     <Button 
                      type="button"
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                      onClick={() => removeImage(i)}
                     >
                       <X className="w-4 h-4" />
                     </Button>
                  </div>
                  {img.isPrimary && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Primary
                    </div>
                  )}
               </div>
             ))}
             {images.length === 0 && (
               <div className="col-span-2 border rounded-2xl aspect-[4/1] flex items-center justify-center gap-3 text-muted-foreground bg-muted">
                  <ImageIcon className="w-5 h-5" />
                  <p className="text-xs font-bold uppercase tracking-widest">No images uploaded yet</p>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-8 border-t">
        <Button 
          type="button" 
          variant="ghost" 
          className="h-14 px-8 rounded-xl font-bold"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 h-14 rounded-xl font-bold text-lg gap-2"
          disabled={loading || uploading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> {initialData ? 'Update Product' : 'Create Product'}</>}
        </Button>
      </div>
    </form>
  );
}
