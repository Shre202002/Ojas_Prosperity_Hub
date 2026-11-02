'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Copy, ImagePlus, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/app-auth';
import { bannerSlide, productSlide, type HeroProduct, type HeroRecord } from '@/lib/hero-types';
import { cn } from '@/lib/utils';

type Rec = HeroRecord & { _id?: string };
const select = 'h-11 w-full rounded-md border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const newId = () => `hero_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const blank = (order: number): Rec => ({ type: 'product', title: '', body: '', eyebrow: '', ctaLabel: '', ctaHref: '', secondaryLabel: '', secondaryHref: '', image: '', imageFit: 'contain', layout: 'split', tone: 'light', active: true, order });

async function refreshSite() {
  try { await apiRequest('/api/admin/revalidate', 'POST'); } catch { /* the page still refreshes within a minute */ }
}

async function uploadImage(file: File): Promise<string> {
  const token = localStorage.getItem('sjapl_session_token');
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/admin/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Upload failed.');
  return result.url;
}

/** Small preview that mirrors how the slide will look on the home page. */
function Preview({ draft, products }: { draft: Rec; products: HeroProduct[] }) {
  const product = draft.type === 'product' ? products.find((p) => p.id === draft.productId) : undefined;
  const slide = draft.type === 'product' ? (product ? productSlide(product, 0, draft) : null) : bannerSlide(draft, 0);
  if (!slide) return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Fill in the details to see a preview.</p>;
  const dark = slide.tone === 'deep' || slide.layout === 'full';
  return (
    <div className={cn('relative overflow-hidden rounded-xl border', slide.tone === 'deep' ? 'bg-brand-gradient' : slide.tone === 'mint' ? 'bg-accent' : 'bg-secondary', dark ? 'text-white' : 'text-foreground')}>
      {slide.layout === 'full' && slide.image && <><Image src={slide.image} alt="" fill sizes="400px" className="object-cover" /><div aria-hidden className="absolute inset-0 bg-black/55" /></>}
      <div className="relative grid grid-cols-[1.2fr_1fr] items-center gap-3 p-4">
        <div>
          {slide.eyebrow && <p className="text-[11px] opacity-75">{slide.eyebrow}</p>}
          <p className="text-lg font-semibold leading-tight">{slide.title}</p>
          {slide.body && <p className="mt-1 line-clamp-3 text-xs opacity-80">{slide.body}</p>}
          {slide.chips && <p className="mt-2 text-sm font-semibold">₹{slide.chips.price}{slide.chips.bv ? ` · ${slide.chips.bv} BV` : ''}</p>}
          {slide.cta && <span className="mt-2 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{slide.cta.label}</span>}
        </div>
        {slide.layout !== 'full' && slide.image && (
          <div className={cn('relative aspect-square overflow-hidden', slide.kind === 'product' || slide.imageFit === 'contain' ? 'rounded-full bg-card' : 'rounded-xl')}>
            <Image src={slide.image} alt="" fill sizes="160px" className={slide.imageFit === 'cover' ? 'object-cover' : 'object-contain p-1'} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Add, edit, reorder, hide and delete the home page hero banners. Used in the hero's edit sheet and on the dashboard page. */
export function HeroManager({ onChanged }: { onChanged?: () => void }) {
  const { toast } = useToast();
  const [records, setRecords] = useState<Rec[]>([]);
  const [products, setProducts] = useState<HeroProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Rec | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, p] = await Promise.all([apiRequest('/api/data/heroSlides'), apiRequest('/api/data/products')]);
      setRecords(((h.data || []) as Rec[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
      setProducts(((p.data || []) as any[]).filter((x) => x.status === 'active' && Number(x.price) > 0).map((x) => ({
        id: String(x._id ?? x.id), slug: String(x.slug || ''), name: String(x.name || ''), category: String(x.category || ''), subtitle: String(x.subtitle || ''),
        shortDescription: String(x.shortDescription || ''), image: String(x.images?.[0]?.url || ''), price: Number(x.price), mrp: Number(x.mrp) || null, bv: Number(x.bvValue) || 0,
      })));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Could not load banners', description: e.message });
    } finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const after = async () => { await refreshSite(); await load(); onChanged?.(); };
  const key = (r: Rec) => String(r.id || r._id);
  const productName = (id?: string) => products.find((p) => p.id === id)?.name;
  const set = (patch: Partial<Rec>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const nextOrder = useMemo(() => (records.length ? Math.max(...records.map((r) => r.order ?? 0)) + 10 : 10), [records]);

  const save = async () => {
    if (!draft) return;
    if (draft.type === 'product' && !draft.productId) return toast({ variant: 'destructive', title: 'Choose a product' });
    if (draft.type === 'banner' && !(draft.title || '').trim() && !draft.image) return toast({ variant: 'destructive', title: 'Add a headline or an image' });
    setSaving(true);
    try {
      const product = products.find((p) => p.id === draft.productId);
      const body = { ...draft, productSlug: product?.slug || draft.productSlug || '', updatedAt: new Date() };
      delete (body as any)._id;
      if (draft._id) await apiRequest('/api/data/heroSlides', 'PATCH', { ...body, _id: draft._id });
      else await apiRequest('/api/data/heroSlides', 'POST', { ...body, id: draft.id || newId(), createdAt: new Date() });
      toast({ title: 'Hero updated' });
      setDraft(null);
      await after();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: e.message });
    } finally { setSaving(false); }
  };

  const patch = async (r: Rec, data: Partial<Rec>) => {
    try { await apiRequest('/api/data/heroSlides', 'PATCH', { ...data, _id: key(r) }); await after(); }
    catch (e: any) { toast({ variant: 'destructive', title: 'Update failed', description: e.message }); }
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= records.length) return;
    const list = [...records];
    [list[i], list[j]] = [list[j], list[i]];
    try {
      await Promise.all(list.map((r, idx) => apiRequest('/api/data/heroSlides', 'PATCH', { order: (idx + 1) * 10, _id: key(r) })));
      await after();
    } catch (e: any) { toast({ variant: 'destructive', title: 'Reorder failed', description: e.message }); }
  };

  const duplicate = async (r: Rec) => {
    try {
      const { _id, ...rest } = r;
      await apiRequest('/api/data/heroSlides', 'POST', { ...rest, id: newId(), title: rest.title ? `${rest.title} (copy)` : rest.title, order: nextOrder, active: false, createdAt: new Date() });
      await after();
    } catch (e: any) { toast({ variant: 'destructive', title: 'Duplicate failed', description: e.message }); }
  };

  const remove = async (r: Rec) => {
    if (!window.confirm('Delete this banner? This cannot be undone.')) return;
    try { await apiRequest(`/api/data/heroSlides?id=${encodeURIComponent(key(r))}`, 'DELETE'); await after(); }
    catch (e: any) { toast({ variant: 'destructive', title: 'Delete failed', description: e.message }); }
  };

  const onFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try { set({ image: await uploadImage(file) }); }
    catch (e: any) { toast({ variant: 'destructive', title: 'Upload failed', description: e.message }); }
    finally { setUploading(false); }
  };

  // ---------- Editor ----------
  if (draft) {
    const isProduct = draft.type === 'product';
    const product = products.find((p) => p.id === draft.productId);
    return (
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{draft._id ? 'Edit banner' : 'New banner'}</h3>
          <Button type="button" variant="ghost" onClick={() => setDraft(null)}>Back to list</Button>
        </div>

        <Preview draft={draft} products={products} />

        <div className="space-y-2">
          <Label>Banner type</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['product', 'banner'] as const).map((t) => (
              <button key={t} type="button" onClick={() => set({ type: t, imageFit: t === 'product' ? 'contain' : 'cover' })} aria-pressed={draft.type === t}
                className={cn('rounded-lg border p-3 text-left text-sm', draft.type === t ? 'border-primary bg-accent' : 'hover:bg-muted')}>
                <span className="block font-semibold">{t === 'product' ? 'Product' : 'Banner'}</span>
                <span className="text-xs text-muted-foreground">{t === 'product' ? 'Shows a product with its live price and BV' : 'Your own headline, text and image'}</span>
              </button>
            ))}
          </div>
        </div>

        {isProduct && (
          <div className="space-y-2">
            <Label htmlFor="hero-product">Product</Label>
            <select id="hero-product" className={select} value={draft.productId || ''} onChange={(e) => set({ productId: e.target.value })}>
              <option value="">Choose a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Name, price, BV and photo come from the product and stay up to date. Fill the fields below only to override them.</p>
          </div>
        )}

        <div className="grid gap-4">
          <div className="space-y-2"><Label htmlFor="hero-eyebrow">Small line above the headline</Label><Input id="hero-eyebrow" value={draft.eyebrow || ''} onChange={(e) => set({ eyebrow: e.target.value })} placeholder={isProduct ? product?.category || 'Category' : 'e.g. New arrival'} /></div>
          <div className="space-y-2"><Label htmlFor="hero-title">Headline</Label><Input id="hero-title" value={draft.title || ''} onChange={(e) => set({ title: e.target.value })} placeholder={isProduct ? product?.name || 'Product name' : 'e.g. Diwali offer'} /></div>
          <div className="space-y-2"><Label htmlFor="hero-body">Text</Label><Textarea id="hero-body" rows={3} value={draft.body || ''} onChange={(e) => set({ body: e.target.value })} placeholder={isProduct ? product?.subtitle || product?.shortDescription || '' : 'A sentence or two'} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="hero-cta">Main button text</Label><Input id="hero-cta" value={draft.ctaLabel || ''} onChange={(e) => set({ ctaLabel: e.target.value })} placeholder="Shop now" /></div>
            <div className="space-y-2"><Label htmlFor="hero-cta-href">Main button link</Label><Input id="hero-cta-href" value={draft.ctaHref || ''} onChange={(e) => set({ ctaHref: e.target.value })} placeholder={isProduct ? '/products/…' : '/shop'} /></div>
            <div className="space-y-2"><Label htmlFor="hero-sec">Second button text</Label><Input id="hero-sec" value={draft.secondaryLabel || ''} onChange={(e) => set({ secondaryLabel: e.target.value })} placeholder="Optional" /></div>
            <div className="space-y-2"><Label htmlFor="hero-sec-href">Second button link</Label><Input id="hero-sec-href" value={draft.secondaryHref || ''} onChange={(e) => set({ secondaryHref: e.target.value })} placeholder="/shop" /></div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">Links must start with / (a page on this site) or https://.</p>
        </div>

        <div className="space-y-3">
          <Label>Image {isProduct && <span className="font-normal text-muted-foreground">(optional, the product photo is used if empty)</span>}</Label>
          <div className="flex items-center gap-3">
            {draft.image ? <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-card"><Image src={draft.image} alt="" fill sizes="80px" className="object-cover" /></div> : <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-dashed text-muted-foreground"><ImagePlus className="h-6 w-6" /></div>}
            <div className="space-y-2">
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border bg-card px-4 text-sm font-medium hover:bg-muted">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {uploading ? 'Uploading…' : 'Upload image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              {draft.image && <Button type="button" variant="ghost" size="sm" onClick={() => set({ image: '' })}>Remove image</Button>}
            </div>
          </div>
          <Input aria-label="Image link" value={draft.image || ''} onChange={(e) => set({ image: e.target.value })} placeholder="…or paste an image link (https://)" />
          <p className="text-xs text-muted-foreground">JPG, PNG or WEBP, up to 5 MB. Wide images (about 3:2) work best for the full-background layout.</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2"><Label htmlFor="hero-layout">Layout</Label>
            <select id="hero-layout" className={select} value={draft.layout || 'split'} onChange={(e) => set({ layout: e.target.value as any })}><option value="split">Text and image</option><option value="full">Image behind text</option></select></div>
          <div className="space-y-2"><Label htmlFor="hero-tone">Colour</Label>
            <select id="hero-tone" className={select} value={draft.tone || 'light'} onChange={(e) => set({ tone: e.target.value as any })}><option value="light">Light blue</option><option value="mint">Mint</option><option value="deep">Deep green</option></select></div>
          <div className="space-y-2"><Label htmlFor="hero-fit">Image fit</Label>
            <select id="hero-fit" className={select} value={draft.imageFit || 'contain'} onChange={(e) => set({ imageFit: e.target.value as any })}><option value="contain">Show whole image</option><option value="cover">Fill the frame</option></select></div>
        </div>

        <label className="flex items-center justify-between rounded-lg border p-3">
          <span><span className="block text-sm font-semibold">Show on the home page</span><span className="text-xs text-muted-foreground">Turn off to hide it without deleting.</span></span>
          <Switch checked={draft.active !== false} onCheckedChange={(v) => set({ active: v })} />
        </label>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="flex-1">{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save banner</Button>
          <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
        </div>
      </form>
    );
  }

  // ---------- List ----------
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{records.length ? `${records.length} banner${records.length === 1 ? '' : 's'}. Visitors see the active ones, in this order.` : 'No banners yet. The hero shows your featured products until you add one.'}</p>
        <Button type="button" onClick={() => setDraft(blank(nextOrder))} className="shrink-0 gap-2"><Plus className="h-4 w-4" />Add banner</Button>
      </div>

      {loading ? <div className="grid place-items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
        <ul className="space-y-3">
          {records.map((r, i) => (
            <li key={key(r)} className="rounded-xl border bg-card p-3">
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {(r.image || products.find((p) => p.id === r.productId)?.image) && <Image src={r.image || products.find((p) => p.id === r.productId)!.image} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title || productName(r.productId) || 'Untitled banner'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{r.type === 'product' ? `Product${productName(r.productId) ? `: ${productName(r.productId)}` : ' (not found)'}` : 'Banner'}</Badge>
                    {r.active === false && <Badge variant="outline">Hidden</Badge>}
                  </div>
                </div>
                <Switch checked={r.active !== false} onCheckedChange={(v) => patch(r, { active: v })} aria-label={`Show ${r.title || 'banner'} on the home page`} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9" disabled={i === records.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" size="sm" variant="outline" className="ml-auto gap-1.5" onClick={() => setDraft({ ...r })}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => duplicate(r)} aria-label="Duplicate"><Copy className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => remove(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
