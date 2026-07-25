'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
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
import { createRazorpayOrder, simulatePaymentCapture } from '@/lib/razorpay-actions';
import { cn } from '@/lib/utils';

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

  // Validation: Only active + verified can enroll
  const canEnroll = currentDistributor?.status === 'active' && currentDistributor?.kycStatus === 'verified';

  if (!canEnroll && currentDistributor) {
    return (
      <Card className="max-w-md mx-auto mt-20 p-8 text-center space-y-4 border-none shadow-xl rounded-[2rem]">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
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

  const handleStartSimulatedPayment = async () => {
    if (!selectedPackage || !user) return;
    setLoading(true);

    try {
      const orderRes = await createRazorpayOrder({
        packageId: selectedPackage.id,
        amount: selectedPackage.price * 100,
        enrolledBy: user.uid,
      });

      if (!orderRes.success) throw new Error(orderRes.error);

      // Simulate a small delay for "Payment Processing"
      setTimeout(async () => {
        const captureRes = await simulatePaymentCapture(orderRes.orderId);
        if (captureRes.success) {
           await processAssistedEnrollment(orderRes.orderId);
        } else {
           toast({ variant: 'destructive', title: 'Simulation failed', description: captureRes.error });
           setLoading(false);
        }
      }, 1500);

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Payment setup failed', description: e.message });
      setLoading(false);
    }
  };

  async function processAssistedEnrollment(orderId: string) {
    if (!auth || !db || !user || !selectedPackage) return;

    try {
      const tempPassword = Math.random().toString(36).substring(2, 12) + "!";
      
      // Prepare Distributor Record (Pending Confirmation)
      const newDistData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: 'pending_confirmation',
        kycStatus: 'pending', 
        sponsorId: user.uid,
        packageId: selectedPackage.id,
        enrollmentType: 'assisted',
        enrolledBy: user.uid,
        createdAt: new Date().toISOString(),
        tempCredentialsSent: true,
      };

      await setDoc(doc(db, 'pendingEnrollments', formData.email.toLowerCase()), {
        ...newDistData,
        tempPassword,
        transactionId: orderId
      });

      // Assisted KYC Submission
      if (formData.idNumber) {
        const kycId = `KYC_${Date.now()}`;
        await setDoc(doc(db, 'kycSubmissions', kycId), {
          id: kycId,
          distributorId: formData.email.toLowerCase(),
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
        description: `Credentials sent to ${formData.email}. (Simulation Complete)`,
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
          <h1 className="text-4xl font-headline font-bold text-foreground">Add New Member</h1>
          <p className="text-muted-foreground font-medium">Assisted enrollment with secure sponsor-funded payment.</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-background border-b p-10">
          <div className="flex justify-between items-center max-w-md mx-auto">
             {[1, 2, 3].map(s => (
               <div key={s} className="flex items-center gap-2">
                 <div className={cn(
                   "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                   step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                 )}>
                   {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                 </div>
                 {s < 3 && <div className={cn("h-1 w-12 rounded", step > s ? "bg-primary" : "bg-muted")} />}
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
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <Input 
                    placeholder="New Member's Name" 
                    className="h-14 rounded-xl"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
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
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                <Input 
                  placeholder="+91..." 
                  className="h-14 rounded-xl"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="pt-6 border-t mt-8">
                 <h4 className="font-bold mb-4 flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-secondary" /> Optional KYC (Assisted Submission)
                 </h4>
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">ID Number (Aadhaar/PAN)</Label>
                      <Input 
                        placeholder="Document Number" 
                        className="h-14 rounded-xl"
                        value={formData.idNumber}
                        onChange={e => setFormData({...formData, idNumber: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Residential Address</Label>
                      <textarea 
                        className="w-full h-24 rounded-xl border p-4 text-sm bg-background" 
                        placeholder="Complete permanent address"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
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
                        : "border-muted hover:border-muted-foreground/20 bg-white"
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
              <div className="bg-background p-8 rounded-[2rem] space-y-6 border">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground uppercase">New Member</span>
                  <span className="font-bold text-primary">{formData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground uppercase">Selected Plan</span>
                  <span className="font-bold">{selectedPackage?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground uppercase">Package BV</span>
                  <Badge className="font-mono-data">{selectedPackage?.bv} BV</Badge>
                </div>
                <div className="h-px w-full bg-border" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-headline font-bold text-foreground">Total Payable</span>
                  <span className="text-3xl font-mono-data font-bold text-primary">₹{selectedPackage?.price.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-6 bg-accent/10 border border-accent/20 rounded-[1.5rem] flex gap-4">
                <AlertCircle className="w-6 h-6 text-accent shrink-0" />
                <p className="text-xs text-accent-foreground font-medium leading-relaxed">
                  <strong>Simulation Mode:</strong> Account activation requires member confirmation. (Simulated Payment capture will be processed).
                </p>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="h-16 px-8 font-bold rounded-2xl">Back</Button>
                <Button 
                  className="flex-1 h-16 text-lg font-bold gap-3 rounded-2xl bg-foreground text-white shadow-2xl"
                  onClick={handleStartSimulatedPayment}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CreditCard className="w-6 h-6" /> Simulate Payment & Enroll</>}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/20">
                  <CheckCircle2 className="w-12 h-12" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-3xl font-headline font-bold text-foreground">Enrollment Initialized!</h3>
                 <p className="text-muted-foreground font-medium max-w-md mx-auto">
                   Simulated enrollment complete for <strong>{formData.email}</strong>.
                 </p>
               </div>
               <div className="bg-background p-6 rounded-2xl border-2 border-dashed inline-block">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Next Step for Member</p>
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
