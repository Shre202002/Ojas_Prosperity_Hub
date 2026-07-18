'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Package, ShieldCheck, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder } from '@/lib/razorpay-actions';

const PACKAGES = [
  { id: 'starter', name: 'Starter DS', price: 5000, bv: 2500, description: 'Entry tier for new sellers' },
  { id: 'growth', name: 'Growth DS', price: 15000, bv: 8000, description: 'Balanced mid-tier for growth' },
  { id: 'platinum', name: 'Platinum DS', price: 40000, bv: 22000, description: 'Highest rank track unlocked' },
];

const ADMIN_EMAIL = 'sriyanshgupta24@gmail.com';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState(searchParams.get('ref') || '');
  const [sponsorData, setSponsorData] = useState<any>(null);
  const [validatingRef, setValidatingRef] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const isAdminEmail = email.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (refCode.length >= 6 && !isAdminEmail) {
      validateReferral(refCode);
    } else if (isAdminEmail) {
      setSponsorData({ name: 'System (Admin Mode)', uid: 'system' });
    }
  }, [refCode, isAdminEmail]);

  async function validateReferral(code: string) {
    if (!db) return;
    setValidatingRef(true);
    try {
      const refRef = doc(db, 'referralCodes', code);
      const refSnap = await getDoc(refRef);
      if (refSnap.exists()) {
        const ownerId = refSnap.data().ownerId;
        const ownerSnap = await getDoc(doc(db, 'distributors', ownerId));
        if (ownerSnap.exists()) {
          setSponsorData(ownerSnap.data());
        } else {
          setSponsorData(null);
        }
      } else {
        setSponsorData(null);
      }
    } catch (e) {
      setSponsorData(null);
    } finally {
      setValidatingRef(false);
    }
  }

  const initializePayment = async () => {
    if (!selectedPackage || !email || !name) return;
    setLoading(true);

    try {
      // 1. Create order on server
      const orderRes = await createRazorpayOrder({
        packageId: selectedPackage.id,
        amount: selectedPackage.price * 100, // paise
      });

      if (!orderRes.success) throw new Error(orderRes.error);

      // 2. Open Razorpay Checkout
      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'Ojas Care',
        description: `Enrollment: ${selectedPackage.name}`,
        order_id: orderRes.orderId,
        handler: async function (response: any) {
          // Success Callback
          await handleRegistrationSuccess(response);
        },
        prefill: {
          name: name,
          email: email,
          contact: phone,
        },
        theme: {
          color: '#2563eb', // Medical Blue
        },
      };

      const rzp = (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Payment setup failed', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  async function handleRegistrationSuccess(paymentResponse: any) {
    if (!auth || !db || !selectedPackage) return;
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      // 2. Log Transaction
      const transactionId = paymentResponse.razorpay_order_id;
      await setDoc(doc(db, 'transactions', transactionId), {
        id: transactionId,
        distributorId: user.uid,
        packageId: selectedPackage.id,
        amount: selectedPackage.price * 100,
        status: 'paid',
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        createdAt: serverTimestamp(),
        capturedAt: serverTimestamp(),
      });

      // 3. Create Distributor Doc
      const newRefCode = Math.random().toString(36).substring(2, 9).toUpperCase();
      const distributorData = {
        uid: user.uid,
        name,
        email,
        phone,
        referralCode: newRefCode,
        sponsorId: isAdminEmail ? null : sponsorData.uid,
        packageId: selectedPackage.id,
        rank: isAdminEmail ? 'Admin' : 'Distributor',
        kycStatus: isAdminEmail ? 'verified' : 'none',
        leftCount: 0,
        rightCount: 0,
        leftBV: selectedPackage.bv,
        rightBV: 0,
        incentiveBalance: 0,
        shoppingBalance: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'distributors', user.uid), distributorData);
      await setDoc(doc(db, 'referralCodes', newRefCode), { ownerId: user.uid });
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role: isAdminEmail ? 'admin' : 'user',
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Welcome aboard!', description: 'Account activated and payment verified.' });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Activation failed', description: e.message });
    } finally {
      setLoading(false);
    }
  }

  if (!db) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl overflow-hidden rounded-[2.5rem]">
        <CardHeader className="text-center space-y-4 p-10 bg-white">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-headline font-bold text-slate-900">Join the Network</CardTitle>
            <CardDescription className="text-lg font-medium">Step into your future in health management.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="h-14 rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91..." className="h-14 rounded-xl border-slate-200" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="h-14 rounded-xl border-slate-200" />
                {isAdminEmail && (
                  <p className="text-xs font-bold text-primary flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3 h-3" /> Admin Registration Mode Detected
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="refCode" className="text-xs font-bold uppercase tracking-widest text-slate-400">Referral Code</Label>
                <div className="relative">
                  <Input 
                    id="refCode"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    placeholder={isAdminEmail ? "Bypassed for Admin" : "Enter Sponsor Code"}
                    className="h-14 uppercase font-mono-data rounded-xl border-slate-200"
                    disabled={isAdminEmail}
                  />
                  {validatingRef && <Loader2 className="absolute right-4 top-4 w-6 h-6 animate-spin text-muted-foreground" />}
                </div>
              </div>

              {!isAdminEmail && sponsorData ? (
                <Alert className="bg-emerald-50 border-emerald-100 rounded-2xl">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800 font-bold">Valid Sponsor</AlertTitle>
                  <AlertDescription className="text-emerald-700">
                    You are being referred by <strong>{sponsorData.name}</strong>.
                  </AlertDescription>
                </Alert>
              ) : !isAdminEmail && refCode.length >= 6 && !validatingRef ? (
                <Alert variant="destructive" className="rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-bold">Sponsor Required</AlertTitle>
                  <AlertDescription>
                    A valid referral code is mandatory to join the healthcare network.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="password" title="Password" className="text-xs font-bold uppercase tracking-widest text-slate-400">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-xl border-slate-200" />
              </div>

              <Button 
                onClick={() => setStep(2)} 
                disabled={(!isAdminEmail && !sponsorData) || !email || !password || !name} 
                className="w-full h-16 text-lg font-bold gap-2 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
              >
                Choose Package <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PACKAGES.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 ${
                      selectedPackage?.id === pkg.id 
                        ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    {selectedPackage?.id === pkg.id && (
                      <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-primary" />
                    )}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-headline font-bold text-xl">{pkg.name}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{pkg.description}</p>
                      </div>
                      <div className="space-y-2 pt-4 border-t border-dashed">
                        <div className="text-3xl font-mono-data font-bold text-primary">₹{pkg.price.toLocaleString()}</div>
                        <Badge variant="secondary" className="font-mono-data text-[10px] rounded-full px-3">
                          {pkg.bv} BV
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-16 px-8 font-bold rounded-2xl">Back</Button>
                <Button 
                  onClick={initializePayment} 
                  disabled={loading || !selectedPackage} 
                  className="flex-1 h-16 text-lg font-bold gap-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-2xl"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <CreditCard className="w-6 h-6" /> 
                      Secure Checkout
                    </>
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground font-medium">
                Payments secured by Razorpay • UPI, Cards, Netbanking accepted
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}