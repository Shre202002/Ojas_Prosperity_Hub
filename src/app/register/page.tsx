
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlanPickerDialog } from '@/components/store/PlanPickerDialog';
import { useCart } from '@/lib/cart';
import { isPlanFilled } from '@/lib/bv-plan';
import { useAuth, useFirestore, doc, getDoc, createUserWithEmailAndPassword, updateProfile } from '@/lib/app-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Package, CreditCard, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder } from '@/lib/razorpay-actions';
import { AuthShell } from '@/components/layout/AuthShell';
import { BRAND } from '@/lib/brand';

function normalizeReferralCode(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    // Accept a shared referral URL, e.g. /register?ref=ADMIN-1CIUN.
    const parsed = new URL(trimmed, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const referralEntry = Array.from(parsed.searchParams.entries())
      .find(([key]) => key.toLowerCase() === 'ref');
    const referralFromUrl = referralEntry?.[1];
    if (referralFromUrl) return referralFromUrl.trim().toUpperCase();
  } catch {
    // Treat non-URL input as a referral code below.
  }

  return trimmed.toUpperCase();
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const { items, totalBv, plan: cartPlan, clear: clearCart } = useCart();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState('');

  const placementUnder = searchParams.get('under') || '';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [refCode, setRefCode] = useState(normalizeReferralCode(searchParams.get('ref') || ''));
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [sponsorPosition, setSponsorPosition] = useState<'left' | 'right' | null>(null);
  const [kycError, setKycError] = useState<string | null>(null);
  const [validatingRef, setValidatingRef] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState('');
  const referralValidationId = useRef(0);

  useEffect(() => { let active = true; setPackagesLoading(true); fetch('/api/packages').then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not load packages.'); return result; }).then(result => { if (active) { setPackages(result.data || []); const pre = (result.data || []).find((p: any) => p.id === cartPlan?.id) ?? (result.data || []).find((p: any) => isPlanFilled(p, totalBv)); if (pre) setSelectedPackage(pre); setPackagesError(''); } }).catch(error => { if (active) setPackagesError(error.message || 'Could not load packages.'); }).finally(() => { if (active) setPackagesLoading(false); }); return () => { active = false; }; }, []);

  useEffect(() => {
    const storedRef = localStorage.getItem('sponsorId');
    if (!searchParams.get('ref') && storedRef) {
      setRefCode(normalizeReferralCode(storedRef));
    }
  }, []);

  useEffect(() => {
    if (!db) return;

    if (refCode.length >= 5) {
      setSponsorData(null);
      setSponsorPosition(null);
      validateReferral(refCode);
    } else {
      referralValidationId.current += 1;
      setSponsorData(null);
      setSponsorPosition(null);
      setKycError(null);
    }
  }, [refCode]);

  async function validateReferral(code: string) {
    if (!db) return;
    const normalizedCode = normalizeReferralCode(code);
    if (!normalizedCode) return;
    const validationId = ++referralValidationId.current;
    setValidatingRef(true);
    setKycError(null);
    try {
      const refRef = doc(db, 'referralCodes', normalizedCode);
      const refSnap = await getDoc(refRef);
      if (validationId !== referralValidationId.current) return;
      if (refSnap.exists()) {
        const referral = refSnap.data();
        const owner = {
          uid: referral.ownerId,
          name: referral.ownerName || 'SJAPL Member',
          kycStatus: referral.ownerKycStatus,
          rank: referral.ownerRank,
          treeRootId: referral.treeRootId,
        };
        if (owner.uid) {
          // Universal Rule: Must be verified or Admin to refer
          if (owner.kycStatus === 'verified' || owner.rank === 'Admin') {
            setSponsorData(owner);
            setSponsorPosition(referral.position || null);
          } else {
            setSponsorData(null);
            setSponsorPosition(null);
            setKycError("This referral code is not active yet. The sponsor must complete KYC verification first.");
          }
        } else {
          setSponsorData(null);
          setSponsorPosition(null);
          setKycError("Invalid referral: Sponsor profile not found.");
        }
      } else {
        setSponsorData(null);
        setSponsorPosition(null);
        setKycError("Referral code not found. Please double check the code.");
      }
    } catch (e: any) {
      if (validationId !== referralValidationId.current) return;
      console.error("Referral validation error:", e);
      setSponsorData(null);
      setSponsorPosition(null);
      if (e.code === 'permission-denied') {
        setKycError("Unable to verify sponsor due to security restrictions. Please contact admin.");
      } else {
        setKycError("An error occurred while validating the referral code.");
      }
    } finally {
      setValidatingRef(false);
    }
  }

  const emailCall = async (method: 'POST' | 'PUT') => {
    setEmailBusy(true); setEmailError('');
    try {
      const res = await fetch('/api/auth/verify-email', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: emailCode }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not verify email.');
      if (method === 'POST') setEmailSent(true); else setEmailVerified(true);
    } catch (e: any) { setEmailError(e.message); } finally { setEmailBusy(false); }
  };

  const startPayment = async () => {
    if (!selectedPackage || !email || !name || password.length < 6 || !isPlanFilled(selectedPackage, totalBv)) return;
    setPickerOpen(false);
    setLoading(true);

    try {
      const orderRes = await createRazorpayOrder({
        packageId: selectedPackage.id,
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
      });

      if (!orderRes.success) throw new Error(orderRes.error);
      if (!orderRes.orderId) throw new Error('Payment order was not created.');
      setVerifying(true);

      await new Promise<void>((resolve, reject) => {
        const checkout = () => {
          const RazorpayCheckout = (window as any).Razorpay;
          if (!RazorpayCheckout) return reject(new Error('Payment checkout could not be loaded. Please try again.'));
          const razorpay = new RazorpayCheckout({
            key: orderRes.keyId,
            amount: orderRes.amount,
            currency: orderRes.currency,
            name: 'Shri Jaya Ayur Neuro',
            description: `${selectedPackage.name} registration`,
            order_id: orderRes.orderId,
            prefill: { name, email, contact: phone },
            theme: { color: '#21c45d' },
            handler: async (response: any) => {
              try {
                const verification = await fetch('/api/razorpay/verify', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(response),
                });
                const result = await verification.json();
                if (!verification.ok) throw new Error(result.error || 'Payment verification failed.');
                resolve();
              } catch (error) { reject(error); }
            },
            modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
          });
          razorpay.open();
        };
        if ((window as any).Razorpay) checkout();
        else {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = checkout;
          script.onerror = () => reject(new Error('Could not load Razorpay checkout.'));
          document.body.appendChild(script);
        }
      });
      await finalizeRegistration(orderRes.orderId);

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Payment unsuccessful', description: e.message });
      setVerifying(false);
      setLoading(false);
    }
  };

  async function finalizeRegistration(orderId: string) {
    if (!auth || !db || !selectedPackage) return;

    try {
      if (!sponsorData?.uid) {
        throw new Error('A valid referral code is required before registration.');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      const token = await user.getIdToken(true);
      const response = await fetch('/api/network/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          packageId: selectedPackage.id,
          bv: selectedPackage.bv,
          sponsorCode: refCode,
          registrationType: 'referral',
          placementUnder,
          sponsorPosition,
          paymentOrderId: orderId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create your network profile.');

      toast({ title: 'Welcome aboard!', description: 'Payment confirmed and your account is ready.' });
      clearCart();
      router.push('/dashboard/kyc');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Activation failed', description: e.message });
      setVerifying(false);
      setLoading(false);
    }
  }

  return (
    <AuthShell wide>
      <Card className="border-border/60 shadow-xl overflow-hidden">
        <CardHeader className="space-y-2 p-6 sm:p-8 bg-secondary/50 border-b">
          <CardTitle className="text-3xl text-primary">Join {BRAND.short}</CardTitle>
          <CardDescription>
            Step {step} of 2: {step === 1 ? 'your details and sponsor' : 'choose a package and pay'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {verifying ? (
            <div className="text-center py-20 space-y-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <h2 className="text-2xl font-headline font-bold">Confirming your payment...</h2>
              <p className="text-muted-foreground">Please keep this window open while we activate your account.</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91..." className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="h-11" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refCode" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Referral Code</Label>
                <div className="relative">
                  <Input 
                    id="refCode"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    onBlur={() => setRefCode(normalizeReferralCode(refCode))}
                    placeholder="Enter code or referral link"
                    className="h-11 uppercase font-mono-data"
                  />
                  {validatingRef && <Loader2 className="absolute right-4 top-4 w-6 h-6 animate-spin text-muted-foreground" />}
                </div>
              </div>

              {sponsorData ? (
                <Alert className="bg-primary/5 border-primary/20 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary font-bold">Valid Sponsor</AlertTitle>
                  <AlertDescription className="text-primary/80">
                    You are being referred by <strong>{sponsorData.name}</strong> on the <strong>{sponsorPosition}</strong> branch.
                  </AlertDescription>
                </Alert>
              ) : (refCode.length >= 5 || kycError) && !validatingRef ? (
                <Alert variant="destructive" className="rounded-lg shadow-lg shadow-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-bold">
                    {kycError?.includes('KYC') ? 'Sponsor unavailable' : 'Invalid Referral'}
                  </AlertTitle>
                  <AlertDescription>
                    {kycError || "A valid referral code is mandatory to join via this path."}
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                {emailVerified ? <p className="text-sm font-medium text-primary">Email verified ✓</p> : (
                  <>
                    <Button type="button" variant="outline" disabled={emailBusy || !/^\S+@\S+\.\S+$/.test(email)} onClick={() => emailCall('POST')}>{emailSent ? 'Resend code' : 'Send verification code'}</Button>
                    {emailSent && (
                      <div className="flex gap-2">
                        <Input inputMode="numeric" maxLength={6} placeholder="6-digit code" value={emailCode} onChange={e => setEmailCode(e.target.value)} className="h-11" />
                        <Button type="button" disabled={emailBusy || emailCode.length !== 6} onClick={() => emailCall('PUT')}>Verify</Button>
                      </div>
                    )}
                    {emailError && <p role="alert" className="text-sm text-destructive">{emailError}</p>}
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="Password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="h-11 pr-12" />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => router.push('/join')} className="h-12 px-6">Back</Button>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!sponsorData || !email || !password || !name || validatingRef || !emailVerified} 
                  className="flex-1 h-12 font-semibold gap-2"
                >
                  Choose Package <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {packagesLoading ? <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground"><Loader2 className="mr-3 h-5 w-5 animate-spin" />Loading current packages...</div> : packagesError ? <Alert variant="destructive" className="rounded-lg"><AlertCircle className="h-4 w-4" /><AlertTitle>Packages unavailable</AlertTitle><AlertDescription>{packagesError}</AlertDescription></Alert> : packages.length === 0 ? <Alert className="rounded-lg"><AlertCircle className="h-4 w-4" /><AlertTitle>No active packages</AlertTitle><AlertDescription>Please contact Admin before continuing registration.</AlertDescription></Alert> : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => { if (selectedPackage?.id !== pkg.id) clearCart(); setSelectedPackage(pkg); setPickerOpen(true); }}
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPackage?.id === pkg.id 
                        ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' 
                        : 'border-muted hover:border-primary/20 bg-background'
                    }`}
                  >
                    {selectedPackage?.id === pkg.id && (
                      <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-primary" />
                    )}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-headline font-bold text-xl text-primary">{pkg.name}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{pkg.description}</p>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-dashed border-muted">
                        <div className="text-3xl font-mono-data font-bold text-accent">₹{pkg.price.toLocaleString()}</div>
                        <Badge variant="secondary" className="font-mono-data text-[10px] rounded-full px-3 bg-secondary text-secondary-foreground">
                          {pkg.bv} BV
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}

              {selectedPackage && <Button type="button" variant="outline" onClick={() => setPickerOpen(true)} className="w-full">{isPlanFilled(selectedPackage, totalBv) ? `Products selected (${totalBv} BV), edit` : `Choose products for ${selectedPackage.name}`}</Button>}
              <PlanPickerDialog plan={selectedPackage} open={pickerOpen} onOpenChange={setPickerOpen} onConfirm={startPayment} busy={loading} />

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-12 px-6">Back</Button>
                <Button 
                  onClick={startPayment}
                  disabled={loading || packagesLoading || Boolean(packagesError) || !selectedPackage || password.length < 6 || !isPlanFilled(selectedPackage, totalBv)}
                  className="flex-1 h-12 font-semibold gap-2"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <CreditCard className="w-6 h-6" /> 
                      Pay Securely & Join
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground font-medium italic">
                Secure checkout powered by Razorpay. Your account is activated after payment verification.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" /></div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
