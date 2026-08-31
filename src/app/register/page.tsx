
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirestore, doc, getDoc, createUserWithEmailAndPassword, updateProfile } from '@/lib/app-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Package, ShieldCheck, CreditCard, User, Users, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder } from '@/lib/razorpay-actions';

const ADMIN_EMAIL = 'sriyanshgupta24@gmail.com';

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

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const registrationType = searchParams.get('type') || 'referral';
  const isIndividual = registrationType === 'individual';

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

  const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => { let active = true; setPackagesLoading(true); fetch('/api/packages').then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Could not load packages.'); return result; }).then(result => { if (active) { setPackages(result.data || []); setPackagesError(''); } }).catch(error => { if (active) setPackagesError(error.message || 'Could not load packages.'); }).finally(() => { if (active) setPackagesLoading(false); }); return () => { active = false; }; }, []);

  useEffect(() => {
    if (!isIndividual) {
      const storedRef = localStorage.getItem('sponsorId');
      if (!searchParams.get('ref') && storedRef) {
        setRefCode(normalizeReferralCode(storedRef));
      }
    }
  }, [isIndividual]);

  useEffect(() => {
    if (!db || isIndividual) return;

    if (isAdminEmail) {
      setSponsorData({ name: 'System (Admin Mode)', uid: 'system', kycStatus: 'verified' });
      setSponsorPosition(null);
      return;
    }

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
  }, [refCode, isAdminEmail, isIndividual]);

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
          name: referral.ownerName || 'Ojas Member',
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

  const startPayment = async () => {
    if (!selectedPackage || !email || !name || password.length < 6) return;
    setLoading(true);

    try {
      const orderRes = await createRazorpayOrder({
        packageId: selectedPackage.id,
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
            name: 'Ojas Prosperity Hub',
            description: `${selectedPackage.name} registration`,
            order_id: orderRes.orderId,
            prefill: { name, email, contact: phone },
            theme: { color: '#1d6b52' },
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
      if (!isIndividual && !isAdminEmail && !sponsorData?.uid) {
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
          sponsorCode: isIndividual || isAdminEmail ? null : refCode,
          registrationType: isIndividual ? 'individual' : 'referral',
          sponsorPosition,
          paymentOrderId: orderId,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create your network profile.');

      toast({ title: 'Welcome aboard!', description: 'Payment confirmed and your account is ready.' });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Activation failed', description: e.message });
      setVerifying(false);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 selection:bg-primary/20">
      <Card className="w-full max-w-2xl border-muted shadow-2xl overflow-hidden rounded-[2.5rem] bg-white">
        <CardHeader className="text-center space-y-4 p-10 bg-background border-b border-muted">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3">
             {isIndividual ? <User className="w-8 h-8" /> : <Users className="w-8 h-8" />}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-headline font-bold text-primary">
              {isIndividual ? 'Individual Partner' : 'Join the Network'}
            </CardTitle>
            <CardDescription className="text-lg font-medium text-muted-foreground">
              {isIndividual ? 'Start your own independent wellness legacy.' : 'Step into your future in natural healthcare.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          {verifying ? (
            <div className="text-center py-20 space-y-6">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <h2 className="text-2xl font-headline font-bold">Confirming your payment...</h2>
              <p className="text-muted-foreground">Please keep this window open while we activate your account.</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="h-14 rounded-xl border-muted bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91..." className="h-14 rounded-xl border-muted bg-background" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="h-14 rounded-xl border-muted bg-background" />
                {isAdminEmail && (
                  <p className="text-xs font-bold text-accent flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3 h-3" /> Admin Registration Mode Detected
                  </p>
                )}
              </div>

              {!isIndividual && (
                <div className="space-y-2">
                  <Label htmlFor="refCode" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Referral Code</Label>
                  <div className="relative">
                    <Input 
                      id="refCode"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                      onBlur={() => setRefCode(normalizeReferralCode(refCode))}
                      placeholder={isAdminEmail ? "Bypassed for Admin" : "Enter code or referral link"}
                      className="h-14 uppercase font-mono-data rounded-xl border-muted bg-background"
                      disabled={isAdminEmail}
                    />
                    {validatingRef && <Loader2 className="absolute right-4 top-4 w-6 h-6 animate-spin text-muted-foreground" />}
                  </div>
                </div>
              )}

              {isIndividual ? (
                <Alert className="bg-secondary/5 border-secondary/20 rounded-2xl">
                  <ShieldCheck className="h-4 w-4 text-secondary" />
                  <AlertTitle className="text-secondary font-bold">Independent Registration</AlertTitle>
                  <AlertDescription className="text-secondary/80">
                    You are registering without a sponsor. You will build your own root team.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {!isAdminEmail && sponsorData ? (
                    <Alert className="bg-primary/5 border-primary/20 rounded-2xl">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertTitle className="text-primary font-bold">Valid Sponsor</AlertTitle>
                      <AlertDescription className="text-primary/80">
                        You are being referred by <strong>{sponsorData.name}</strong> on the <strong>{sponsorPosition}</strong> branch.
                      </AlertDescription>
                    </Alert>
                  ) : !isAdminEmail && (refCode.length >= 5 || kycError) && !validatingRef ? (
                    <Alert variant="destructive" className="rounded-2xl shadow-lg shadow-destructive/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="font-bold">
                        {kycError?.includes('KYC') ? 'Sponsor unavailable' : 'Invalid Referral'}
                      </AlertTitle>
                      <AlertDescription>
                        {kycError || "A valid referral code is mandatory to join via this path."}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" title="Password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-xl border-muted bg-background pr-12" />
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
                <Button variant="ghost" onClick={() => router.push('/join')} className="h-16 px-8 rounded-2xl">Back</Button>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={(!isIndividual && !isAdminEmail && !sponsorData) || !email || !password || !name || validatingRef} 
                  className="flex-1 h-16 text-lg font-bold gap-2 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
                >
                  Choose Package <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {packagesLoading ? <div className="flex items-center justify-center rounded-2xl border border-dashed p-12 text-muted-foreground"><Loader2 className="mr-3 h-5 w-5 animate-spin" />Loading current packages...</div> : packagesError ? <Alert variant="destructive" className="rounded-2xl"><AlertCircle className="h-4 w-4" /><AlertTitle>Packages unavailable</AlertTitle><AlertDescription>{packagesError}</AlertDescription></Alert> : packages.length === 0 ? <Alert className="rounded-2xl"><AlertCircle className="h-4 w-4" /><AlertTitle>No active packages</AlertTitle><AlertDescription>Please contact Admin before continuing registration.</AlertDescription></Alert> : <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${
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
                        <Badge variant="secondary" className="font-mono-data text-[10px] rounded-full px-3 bg-secondary/20 text-foreground">
                          {pkg.bv} BV
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-16 px-8 font-bold rounded-2xl hover:bg-background">Back</Button>
                <Button 
                  onClick={startPayment}
                  disabled={loading || packagesLoading || Boolean(packagesError) || !selectedPackage || password.length < 6}
                  className="flex-1 h-16 text-lg font-bold gap-3 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-2xl"
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
    </div>
  );
}
