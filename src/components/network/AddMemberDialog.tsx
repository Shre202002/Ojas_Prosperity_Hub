'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { isValidPhoneNumber, parsePhoneNumber } from 'react-phone-number-input';
import { CheckCircle2, CreditCard, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/lib/cart';
import { isPlanFilled } from '@/lib/bv-plan';
import { apiRequest } from '@/lib/app-auth';
import { createRazorpayOrder } from '@/lib/razorpay-actions';

const PlanPickerDialog = dynamic(() => import('@/components/store/PlanPickerDialog').then((m) => m.PlanPickerDialog), { ssr: false });

// Same contact format the public register page hands to Razorpay (plain 10 digits for India).
function razorpayContact(phone: string) {
  try { const p = parsePhoneNumber(phone); return !p ? phone : p.country === 'IN' ? p.nationalNumber : p.number; } catch { return phone; }
}

export type OpenSlot = { parentUid: string; parentName: string; side: 'left' | 'right'; adminUid: string };

/** Admin registers a member straight into an open slot: sponsor = this admin, no OTP, pays, then goes to KYC to upload documents. */
export function AddMemberDialog({ slot, onClose }: { slot: OpenSlot | null; onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const { items, totalBv, plan: cartPlan, clear: clearCart } = useCart();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(''), [phone, setPhone] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [packages, setPackages] = useState<any[]>([]), [selected, setSelected] = useState<any>(null), [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slot) return;
    setStep(1); setName(''); setPhone(''); setEmail(''); setPassword(''); setSelected(null); setBusy(false);
    fetch('/api/packages').then((r) => r.json()).then((r) => setPackages(r.data || [])).catch(() => toast({ variant: 'destructive', title: 'Could not load packages' }));
  }, [slot, toast]);

  if (!slot) return null;
  const detailsOk = name.trim().length > 1 && isValidPhoneNumber(phone || '') && /^\S+@\S+\.\S+$/.test(email) && password.length >= 6;
  const base = { parentId: slot.parentUid, side: slot.side, name: name.trim(), phone, email: email.trim().toLowerCase() };

  async function next() {
    setBusy(true);
    try { await apiRequest('/api/network/provision', 'POST', { ...base, registrationType: 'admin_added', precheck: true }); setStep(2); }
    catch (e: any) { toast({ variant: 'destructive', title: 'Cannot add member', description: e.message }); }
    finally { setBusy(false); }
  }

  async function payAndAdd() {
    if (!selected || !isPlanFilled(selected, totalBv)) return;
    setPickerOpen(false); setBusy(true);
    try {
      const order = await createRazorpayOrder({ packageId: selected.id, items: items.map((i) => ({ id: i.id, qty: i.qty })), enrolledBy: slot!.adminUid });
      if (!order.success || !order.orderId) throw new Error(order.error || 'Payment order was not created.');
      await new Promise<void>((resolve, reject) => {
        const open = () => {
          const Checkout = (window as any).Razorpay;
          if (!Checkout) return reject(new Error('Payment checkout could not be loaded. Please try again.'));
          new Checkout({
            key: order.keyId, amount: order.amount, currency: order.currency, name: 'Shri Jaya Ayur Neuro', description: `${selected.name} – new member`, order_id: order.orderId,
            prefill: { name: base.name, email: base.email, contact: razorpayContact(phone) }, theme: { color: '#21c45d' },
            handler: async (response: any) => {
              try {
                const v = await fetch('/api/razorpay/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(response) });
                const r = await v.json(); if (!v.ok) throw new Error(r.error || 'Payment verification failed.');
                resolve();
              } catch (e) { reject(e); }
            },
            modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
          }).open();
        };
        if ((window as any).Razorpay) open();
        else { const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = open; s.onerror = () => reject(new Error('Could not load Razorpay checkout.')); document.body.appendChild(s); }
      });
      const result = await apiRequest('/api/network/provision', 'POST', { ...base, password, packageId: selected.id, bv: selected.bv, registrationType: 'admin_added', paymentOrderId: order.orderId });
      clearCart();
      toast({ title: 'Member added', description: `${base.name} can now sign in with their email and password. Upload their KYC documents next.` });
      onClose();
      router.push(`/dashboard/admin/kyc?member=${result.uid}`);
    } catch (e: any) { toast({ variant: 'destructive', title: 'Could not add member', description: e.message }); setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add member – {slot.side} slot under {slot.parentName}</DialogTitle>
          <DialogDescription>Step {step} of 2: {step === 1 ? 'member details' : 'choose a package and pay'}. You are the sponsor and earn the direct bonus.</DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="am-name">Full name</Label><Input id="am-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><PhoneInput value={phone} onChange={setPhone} />{phone && !isValidPhoneNumber(phone) && <p className="text-xs text-destructive">Enter a valid phone number.</p>}</div>
            <div className="space-y-1.5"><Label htmlFor="am-email">Email</Label><Input id="am-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="am-pass">Password (min 6)</Label>
              <div className="relative"><Input id="am-pass" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-11" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <Button className="w-full" disabled={!detailsOk || busy} onClick={next}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Choose package'}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {packages.map((pkg) => (
                <button key={pkg.id} type="button" onClick={() => { if (cartPlan?.id !== pkg.id) clearCart(); setSelected(pkg); setPickerOpen(true); }} className={`relative rounded-xl border-2 p-4 text-left transition ${selected?.id === pkg.id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'}`}>
                  {selected?.id === pkg.id && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />}
                  <p className="font-bold text-primary">{pkg.name}</p>
                  <p className="font-mono-data text-xl font-bold">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                  <Badge variant="secondary">{pkg.bv} BV</Badge>
                </button>
              ))}
            </div>
            {selected && <Button type="button" variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>{isPlanFilled(selected, totalBv) ? `Products selected (${totalBv} BV), edit` : `Choose products for ${selected.name}`}</Button>}
            {selected && <PlanPickerDialog plan={selected} open={pickerOpen} onOpenChange={setPickerOpen} onConfirm={payAndAdd} busy={busy} />}
            <div className="flex gap-3">
              <Button variant="ghost" disabled={busy} onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1 gap-2" disabled={busy || !selected || !isPlanFilled(selected, totalBv)} onClick={payAndAdd}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4" />Pay & add member</>}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
