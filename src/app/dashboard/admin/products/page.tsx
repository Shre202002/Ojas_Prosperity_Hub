'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, collection, query, orderBy, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from '@/lib/app-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  Package, 
  Loader2,
  AlertCircle,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ProductForm } from '@/components/admin/ProductForm';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog';

export default function AdminProductsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: products, loading } = useCollection(productsQuery, 'products (admin)');

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleToggleStatus = async (product: any) => {
    if (!db) return;
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'products', product.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Product ${newStatus === 'active' ? 'Activated' : 'Deactivated'}` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Status update failed', description: e.message });
    }
  };

  const handleArchive = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'products', id), {
        status: 'archived',
        updatedAt: serverTimestamp()
      });
      toast({ title: 'Product Archived' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Archiving failed', description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    // In a real app, we would call a Cloud Function to check order history first
    if (!db) return;
    if (!confirm('Are you sure you want to PERMANENTLY delete this product? This should only be done for products with NO order history.')) return;
    
    try {
      await deleteDoc(doc(db, 'products', id));
      toast({ title: 'Product Deleted Permanently' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Deletion failed', description: e.message });
    }
  };

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-foreground">Product Catalog</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Manage inventory, categories, and BV values for the platform.
          </p>
        </div>

        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingProduct(null);
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold h-12 shadow-xl shadow-primary/20 gap-2">
              <Plus className="w-5 h-5" /> Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </DialogTitle>
              <DialogDescription>
                Configure details, pricing, and business volume for the shopping wallet.
              </DialogDescription>
            </DialogHeader>
            <ProductForm 
              initialData={editingProduct} 
              onSuccess={() => setIsFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Inventory</p>
              <p className="text-2xl font-mono-data font-bold">{products?.filter(p => p.status === 'active').length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-card">
          <CardContent className="p-6">
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total SKU Count</p>
              <p className="text-2xl font-mono-data font-bold">{products?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-card overflow-hidden rounded-2xl">
        <CardHeader className="bg-muted border-b pb-6 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Name or SKU..." 
                className="pl-12 h-14 rounded-2xl border-border font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl border">
                 <Filter className="w-4 h-4 text-muted-foreground" />
                 <select 
                  className="bg-transparent text-sm font-bold outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                 >
                   <option value="all">All Status</option>
                   <option value="active">Active</option>
                   <option value="inactive">Inactive</option>
                   <option value="archived">Archived</option>
                 </select>
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="font-bold w-[100px]">Thumb</TableHead>
                <TableHead className="font-bold">Product Details</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold">Price</TableHead>
                <TableHead className="font-bold">BV Value</TableHead>
                <TableHead className="font-bold">Stock</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-muted-foreground italic">
                    No products found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : filteredProducts.map((p) => {
                const primaryImage = p.images?.find((img: any) => img.isPrimary) || p.images?.[0];
                return (
                  <TableRow key={p.id} className="group hover:bg-muted transition-colors">
                    <TableCell>
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
                        {primaryImage ? (
                          <Image 
                            src={primaryImage.url} 
                            alt={p.name} 
                            fill 
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono-data uppercase">SKU: {p.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                        {p.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-primary">₹{p.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-accent">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-mono-data font-bold">{p.bvValue}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-xs font-bold",
                        p.stock < 10 ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {p.stock !== null ? p.stock : 'Unlimited'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "font-bold text-[10px] uppercase tracking-widest",
                        p.status === 'active' ? "bg-primary text-primary-foreground" : 
                        p.status === 'inactive' ? "bg-muted text-muted-foreground" : "bg-destructive text-white"
                      )}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-primary"
                          onClick={() => {
                            setEditingProduct(p);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-accent"
                          onClick={() => handleToggleStatus(p)}
                        >
                          {p.status === 'active' ? <Archive className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
