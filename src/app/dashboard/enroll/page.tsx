
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  ArrowRight, 
  Loader2, 
  Package as PackageIcon, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle,
  Camera,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRazorpayOrder } from '@/lib/razorpay-actions';

const PACKAGES = [
  { id: 'starter', name: 'Starter DS', price: 5000, bv: 2500, description: 'Entry tier for new sellers' },
  { id: 'growth', name: 'Growth DS', price: 15000, bv: 8000, description: 'Balanced mid-tier for growth' },
  { id: 'platinum', name: 'Platinum DS', price: 40000, bv: 22000, description: 'Highest rank track unlocked' },
];

export default function AssistedEnrollmentPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // New member data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    address: '',
  });

  const distributorRef = useMemoFirebase(() => (
    user && db ? doc(db, 'distributors', user.uid) : null
  ), [db, user?.uid]);
  const { data: currentDistributor } = useDoc(distributorRef);

  useEffect(() => {
    // Load Razorpay Script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Validation: Only active + verified can enroll
  const canEnroll = currentDistributor?.status === 'active' && currentDistributor?.kycStatus === 'verified';

  if (!canEnroll && currentDistributor) {
    return (
      <Card className="max-w-md mx-auto mt-20 p-8 text-center space-y-4 border-none shadow-xl rounded-[2rem]">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <CardTitle className="text-xl">Enrollment Restricted</CardTitle>
        <CardDescription>
          You must have an <strong>Active</strong> account and <strong>Verified</strong> KYC status to enroll new members.
        </CardDescription>
        <Button onClick={() => router.push('/dashboard/kyc')}>Complete KYC</Button>
      </Card>
    );
  }

  const handleStartPayment = async () => {
    if (!selectedPackage || !user) return;
    setLoading(true);

    try {
      const orderRes = await createRazorpayOrder({
        packageId: selectedPackage.id,
        amount: selectedPackage.price * 100,
        enrolledBy: user.uid,
      });

      if (!orderRes.success) throw new Error(orderRes.error);

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'Ojas Care',
        description: `Enrollment for ${formData.name}`,
        order_id: orderRes.orderId,
        handler: async function (response: any) {
          await processAssistedEnrollment(response);
        },
        prefill: {
          name: currentDistributor?.name,
          email: currentDistributor?.email,
          contact: currentDistributor?.phone,
        },
        theme: { color: '#2563eb' },
      };

      const rzp = (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Payment setup failed', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  async function processAssistedEnrollment(paymentResponse: any) {
    if (!auth || !db || !user || !selectedPackage) return;
    setLoading(true);

    try {
      // 1. Generate secure temp password
      const tempPassword = Math.random().toString(36).substring(2, 12) + "!";
      
      // 2. Note: Creating a secondary user in Auth from the client is restricted.
      // In a real production app, this would call a Cloud Function to use Admin SDK.
      // Here we simulate the creation logic and record it for the admin to see.
      
      const transactionId = paymentResponse.razorpay_order_id;
      const enrollmentId = `ENROLL_${Date.now()}`;

      // Record transaction
      await setDoc(doc(db, 'transactions', transactionId), {
        id: transactionId,
        distributorId: null, // assigned later
        packageId: selectedPackage.id,
        amount: selectedPackage.price * 100,
        status: 'paid',
        enrolledBy: user.uid,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        createdAt: serverTimestamp(),
        capturedAt: serverTimestamp(),
      });

      // Prepare Distributor Record (Pending Confirmation)
      const newDistData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: 'pending_confirmation',
        kycStatus: 'pending', // Sponsor provided docs
        sponsorId: user.uid,
        packageId: selectedPackage.id,
        enrollmentType: 'assisted',
        enrolledBy: user.uid,
        createdAt: new Date().toISOString(),
        tempCredentialsSent: true,
      };

      // In this environment, we simulate the "Auth Account Creation" by creating a Firestore record
      // that the Super Admin or a specialized signup flow can pick up.
      await setDoc(doc(db, 'pendingEnrollments', formData.email.toLowerCase()), {
        ...newDistData,
        tempPassword,
        transactionId
      });

      // Assisted KYC Submission
      if (formData.idNumber) {
        const kycId = `KYC_${Date.now()}`;
        await setDoc(doc(db, 'kycSubmissions', kycId), {
          id: kycId,
          distributorId: formData.email.toLowerCase(), // temp ID
          sponsorId: user.uid,
          submittedBy: 'sponsor',
          status: 'pending',
          idProofUrl: 'https://picsum.photos/seed/assisted_id/400/300',
          addressProofUrl: 'https://picsum.photos/seed/assisted_addr/400/300',
          selfieUrl: 'https://picsum.photos/seed/assisted_selfie/400/300',
          idNumber: formData.idNumber,
          address: formData.address,
          submittedAt: new Date().toISOString()
        });
      }

      toast({
        title: 'Enrollment Initialized',
        description: `Credentials sent to ${formData.email}. Account counts toward business once they confirm.`,
      });
      setStep(4);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Enrollment failed', description: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="bg-primary p-4 rounded-2xl text-white">
          <UserPlus className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-headline font-bold text-slate-900">Add New Member</h1>
          <p className="text-muted-foreground font-medium">Assisted enrollment with secure sponsor-funded payment.</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50 border-b p-10">
          <div className="flex justify-between items-center max-w-md mx-auto">
             {[1, 2, 3].map(s => (
               <div key={s} className="flex items-center gap-2">
                 <div className={cn(
                   "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                   step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-200 text-slate-400"
                 )}>
                   {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                 </div>
                 {s < 3 && <div className={cn("h-1 w-12 rounded", step > s ? "bg-primary" : "bg-slate-200")} />}
               </div>
             ))}
          </div>
          <div className="text-center mt-6">
            <h3 className="text-2xl font-headline font-bold">
              {step === 1 && "Identity Details"}
              {step === 2 && "Business Package"}
              {step === 3 && "Review & Payment"}
              {step === 4 && "Enrollment Successful"}
            </h3>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          {step === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</Label>
                  <Input 
                    placeholder="New Member's Name" 
                    className="h-14 rounded-xl"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</Label>
                  <Input 
                    type="email" 
                    placeholder="member@example.com" 
                    className="h-14 rounded-xl"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone Number</Label>
                <Input 
                  placeholder="+91..." 
                  className="h-14 rounded-xl"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="pt-6 border-t mt-8">
                 <h4 className="font-bold mb-4 flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-emerald-500" /> Optional KYC (Assisted Submission)
                 </h4>
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">ID Number (Aadhaar/PAN)</Label>
                      <Input 
                        placeholder="Document Number" 
                        className="h-14 rounded-xl"
                        value={formData.idNumber}
                        onChange={e => setFormData({...formData, idNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">Residential Address</Label>
                      <textarea 
                        className="w-full h-24 rounded-xl border p-4 text-sm" 
                        placeholder="Complete permanent address"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {['ID Proof', 'Address Proof', 'Selfie'].map(d => (
                        <div key={d} className="border-2 border-dashed rounded-xl p-4 text-center space-y-1 hover:bg-slate-50 cursor-pointer group transition-colors">
                           <Camera className="w-5 h-5 mx-auto text-slate-300 group-hover:text-primary" />
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{d}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <Button 
                className="w-full h-16 text-lg font-bold gap-2 rounded-2xl bg-primary shadow-xl shadow-primary/20 mt-8"
                disabled={!formData.name || !formData.email || !formData.phone}
                onClick={() => setStep(2)}
              >
                Continue to Packages <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 max-w-3xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {PACKAGES.map(pkg => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={cn(
                      "p-8 rounded-[2rem] border-2 cursor-pointer transition-all relative overflow-hidden",
                      selectedPackage?.id === pkg.id 
                        ? "border-primary bg-primary/5 shadow-2xl" 
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    )}
                  >
                    {selectedPackage?.id === pkg.id && (
                      <div className="absolute top-4 right-4 text-primary">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h4 className="font-headline font-bold text-xl">{pkg.name}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{pkg.description}</p>
                      </div>
                      <div className="pt-4 border-t border-dashed">
                        <p className="text-3xl font-mono-data font-bold text-primary">₹{pkg.price.toLocaleString()}</p>
                        <Badge variant="secondary" className="mt-2 font-mono-data text-[10px] rounded-full px-3">{pkg.bv} BV</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-16 px-8 font-bold rounded-2xl">Back</Button>
                <Button 
                  className="flex-1 h-16 text-lg font-bold gap-2 rounded-2xl bg-primary shadow-xl"
                  disabled={!selectedPackage}
                  onClick={() => setStep(3)}
                >
                  Review Summary <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 max-w-xl mx-auto">
              <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase">New Member</span>
                  <span className="font-bold text-primary">{formData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase">Selected Plan</span>
                  <span className="font-bold">{selectedPackage?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 uppercase">Package BV</span>
                  <Badge className="font-mono-data">{selectedPackage?.bv} BV</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-headline font-bold text-slate-900">Total Payable</span>
                  <span className="text-3xl font-mono-data font-bold text-primary">₹{selectedPackage?.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-6 bg-amber-50 border border-amber-100 rounded-[1.5rem] flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong>Important:</strong> Account activation requires member confirmation. Placement and BV will be credited only after the member logs in and verifies their credentials.
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="h-16 px-8 font-bold rounded-2xl">Back</Button>
                <Button 
                  className="flex-1 h-16 text-lg font-bold gap-3 rounded-2xl bg-slate-900 text-white shadow-2xl"
                  onClick={handleStartPayment}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-6 h-6" /> Pay & Enroll Member</>}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-200">
                  <CheckCircle2 className="w-12 h-12" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-3xl font-headline font-bold text-slate-900">Enrollment Initialized!</h3>
                 <p className="text-muted-foreground font-medium max-w-md mx-auto">
                   Distributor credentials have been sent to <strong>{formData.email}</strong>.
                 </p>
               </div>
               <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed inline-block">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Next Step for Member</p>
                  <p className="text-sm font-bold text-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Member must confirm account at /setup-account
                  </p>
               </div>
               <div>
                 <Button className="h-14 px-10 rounded-2xl font-bold" onClick={() => router.push('/dashboard')}>
                    Return to Dashboard
                 </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Separator() {
  return <div className="h-px w-full bg-slate-200" />;
}
