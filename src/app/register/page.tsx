
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
import { CheckCircle2, AlertCircle, ArrowRight, Loader2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PACKAGES = [
  { id: 'starter', name: 'Starter DS', price: 5000, bv: 2500, description: 'Entry tier for new sellers' },
  { id: 'growth', name: 'Growth DS', price: 15000, bv: 8000, description: 'Balanced mid-tier for growth' },
  { id: 'platinum', name: 'Platinum DS', price: 40000, bv: 22000, description: 'Highest rank track unlocked' },
];

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
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    if (refCode.length >= 6) {
      validateReferral(refCode);
    }
  }, [refCode]);

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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!auth || !db || !selectedPackage || !sponsorData) return;

    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });

      // 2. Mock Payment Success (In production, use Razorpay)
      const pkg = PACKAGES.find(p => p.id === selectedPackage);
      
      // 3. Create Distributor Doc
      const newRefCode = Math.random().toString(36).substring(2, 9).toUpperCase();
      const distributorData = {
        uid: user.uid,
        name,
        email,
        phone,
        referralCode: newRefCode,
        sponsorId: sponsorData.uid,
        packageId: selectedPackage,
        rank: 'Distributor',
        kycStatus: 'none',
        leftCount: 0,
        rightCount: 0,
        leftBV: 0,
        rightBV: 0,
        incentiveBalance: 0,
        shoppingBalance: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'distributors', user.uid), distributorData);
      await setDoc(doc(db, 'referralCodes', newRefCode), { ownerId: user.uid });

      toast({
        title: 'Welcome aboard!',
        description: 'Your distributor account has been activated.',
      });

      router.push('/dashboard');
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: e.message,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!db) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-none shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-headline font-bold">Join the Network</CardTitle>
            <CardDescription>Step into your future in direct selling.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <Label htmlFor="refCode">Referral Code</Label>
                <div className="relative">
                  <Input 
                    id="refCode"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    placeholder="Enter Sponsor Code"
                    className="h-12 uppercase font-mono-data"
                  />
                  {validatingRef && <Loader2 className="absolute right-3 top-3 w-6 h-6 animate-spin text-muted-foreground" />}
                </div>
              </div>

              {sponsorData ? (
                <Alert className="bg-emerald-50 border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800">Valid Sponsor</AlertTitle>
                  <AlertDescription className="text-emerald-700">
                    You are being referred by <strong>{sponsorData.name}</strong>.
                  </AlertDescription>
                </Alert>
              ) : refCode.length >= 6 && !validatingRef ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid Code</AlertTitle>
                  <AlertDescription>
                    This referral code doesn't exist. You must have a valid sponsor to join.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91..." className="h-12" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="h-12" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12" />
              </div>

              <Button 
                onClick={() => setStep(2)} 
                disabled={!sponsorData || !email || !password || !name} 
                className="w-full h-14 text-lg font-bold gap-2"
              >
                Choose Package <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PACKAGES.map((pkg) => (
                  <div 
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedPackage === pkg.id 
                        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {selectedPackage === pkg.id && (
                      <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-primary" />
                    )}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-headline font-bold text-xl">{pkg.name}</h4>
                        <p className="text-xs text-muted-foreground">{pkg.description}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-3xl font-mono-data font-bold">₹{pkg.price.toLocaleString()}</div>
                        <Badge variant="secondary" className="font-mono-data">{pkg.bv} BV</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="h-14 px-8 font-bold">Back</Button>
                <Button 
                  onClick={handleRegister} 
                  disabled={loading || !selectedPackage} 
                  className="flex-1 h-14 text-lg font-bold gap-2"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Activate Account & Dashboard</>}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
