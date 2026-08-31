'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/app-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Pencil, Plus, Save, Settings2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const empty = { id: '', name: '', bv: '', description: '' };

export default function AdminPackagesPage() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [settings, setSettings] = useState({ bvRate: 1, withdrawalLimit12h: 10000 });
  const [savedSettings, setSavedSettings] = useState(settings);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState('');
  const [packageOpen, setPackageOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [packagesResult, settingsResult] = await Promise.all([apiRequest('/api/admin/packages'), apiRequest('/api/admin/settings')]);
      setPackages(packagesResult.data);
      setSettings(settingsResult.data);
      setSavedSettings(settingsResult.data);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Could not load settings', description: error.message });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (settings.bvRate <= 0 || settings.withdrawalLimit12h < 0) {
      toast({ variant: 'destructive', title: 'Invalid policy values', description: 'BV rate must be greater than zero and withdrawal limit cannot be negative.' });
      return;
    }
    setSaving(true);
    try {
      if (settings.bvRate !== savedSettings.bvRate) await apiRequest('/api/admin/bv-rate', 'PUT', { rate: settings.bvRate, currency: 'INR' });
      const response = await apiRequest('/api/admin/settings', 'PATCH', { withdrawalLimit12h: settings.withdrawalLimit12h });
      const next = { ...settings, ...(response.data || {}) };
      setSettings(next); setSavedSettings(next); setPolicyOpen(false);
      toast({ title: 'Platform policy updated', description: 'The current BV rate is now used dynamically for package prices.' });
      load();
    } catch (error: any) { toast({ variant: 'destructive', title: 'Update failed', description: error.message }); }
    finally { setSaving(false); }
  };

  const savePackage = async () => {
    setSaving(true);
    try {
      await apiRequest('/api/admin/packages', editingId ? 'PATCH' : 'POST', editingId ? { ...form, id: editingId } : form);
      const wasEditing = Boolean(editingId); setForm(empty); setEditingId(''); setPackageOpen(false);
      toast({ title: wasEditing ? 'Package updated' : 'Package created' }); load();
    } catch (error: any) { toast({ variant: 'destructive', title: 'Package failed', description: error.message }); }
    finally { setSaving(false); }
  };

  const calculatedPrice = Math.round(Number(form.bv || 0) * settings.bvRate * 100) / 100;
  if (loading) return <Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-primary" />;

  return <div className="space-y-8 py-8">
    <div><h1 className="text-4xl font-headline font-bold">Packages & Rates</h1><p className="mt-2 text-muted-foreground">Set package BV; prices are calculated automatically from the platform rate.</p></div>
    <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />Platform policy</CardTitle><Button variant="outline" onClick={() => setPolicyOpen(true)}><Pencil className="mr-2 h-4 w-4" />Edit</Button></CardHeader><CardContent className="grid gap-5 md:grid-cols-2"><div><Label>Rupees per BV</Label><p className="mt-2 rounded-xl border bg-slate-50 px-3 py-2 font-semibold">₹{settings.bvRate.toFixed(2)}</p></div><div><Label>Maximum withdrawal in 12 hours (₹)</Label><p className="mt-2 rounded-xl border bg-slate-50 px-3 py-2 font-semibold">₹{settings.withdrawalLimit12h.toLocaleString('en-IN')}</p></div></CardContent></Card>
    <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Registration packages</CardTitle><p className="mt-1 text-sm text-muted-foreground">Packages available to new registrations.</p></div><Button onClick={() => { setEditingId(''); setForm(empty); setPackageOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add New Package</Button></CardHeader><CardContent className="space-y-3">{packages.map(pkg => <div key={pkg.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div><p className="font-bold">{pkg.name} <span className="font-mono text-xs text-muted-foreground">({pkg.id})</span></p><p className="text-sm text-muted-foreground">₹{Number(pkg.price).toLocaleString('en-IN')} · {pkg.bv} BV · {pkg.description}</p></div><div className="flex items-center gap-3"><Badge>{pkg.active ? 'Active' : 'Inactive'}</Badge><Button variant="outline" size="sm" onClick={() => { setEditingId(pkg.id); setForm({ id: pkg.id, name: pkg.name, bv: String(pkg.bv), description: pkg.description || '' }); setPackageOpen(true); }}>Edit</Button><Button variant="outline" size="sm" onClick={() => apiRequest('/api/admin/packages', 'PATCH', { id: pkg.id, active: !pkg.active }).then(load).catch((error: any) => toast({ variant: 'destructive', title: 'Update failed', description: error.message }))}>{pkg.active ? 'Deactivate' : 'Activate'}</Button></div></div>)}</CardContent></Card>
    <Dialog open={policyOpen} onOpenChange={open => { if (!saving) { if (!open) setSettings(savedSettings); setPolicyOpen(open); } }}><DialogContent className="max-w-lg rounded-2xl"><DialogHeader><DialogTitle>Edit platform policy</DialogTitle><DialogDescription>Changing the BV rate recalculates active package prices for new registrations.</DialogDescription></DialogHeader><div className="grid gap-5 py-4"><div><Label>Rupees per BV</Label><Input type="number" step="0.01" min="0.01" value={settings.bvRate} onChange={e => setSettings({ ...settings, bvRate: Number(e.target.value) })} /></div><div><Label>Maximum withdrawal in 12 hours (₹)</Label><Input type="number" min="0" value={settings.withdrawalLimit12h} onChange={e => setSettings({ ...settings, withdrawalLimit12h: Number(e.target.value) })} /></div></div><DialogFooter><Button variant="outline" disabled={saving} onClick={() => { setSettings(savedSettings); setPolicyOpen(false); }}><X className="mr-2 h-4 w-4" />Cancel</Button><Button disabled={saving} onClick={saveSettings}><Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save policy'}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={packageOpen} onOpenChange={open => { if (!saving) setPackageOpen(open); }}><DialogContent className="max-w-xl rounded-2xl"><DialogHeader><DialogTitle>{editingId ? 'Edit registration package' : 'Create registration package'}</DialogTitle><DialogDescription>Enter the package BV. The purchase price is calculated automatically.</DialogDescription></DialogHeader><div className="grid gap-5 py-4"><div><Label>Package ID</Label><Input value={form.id} disabled={!!editingId} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="e.g. starter" /></div><div><Label>Package name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Growth DS" /></div><div><Label>Business Volume (BV)</Label><Input type="number" min="0" value={form.bv} onChange={e => setForm({ ...form, bv: e.target.value })} placeholder="e.g. 8000" /></div><div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs text-muted-foreground">Calculated price</p><p className="text-2xl font-bold">₹{calculatedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground">{form.bv || 0} BV × ₹{settings.bvRate.toFixed(2)} per BV</p></div><div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Package description" /></div></div><DialogFooter><Button variant="outline" disabled={saving} onClick={() => setPackageOpen(false)}>Cancel</Button><Button disabled={saving || !form.id || !form.name || Number(form.bv) <= 0} onClick={savePackage}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{editingId ? 'Update package' : 'Create package'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
