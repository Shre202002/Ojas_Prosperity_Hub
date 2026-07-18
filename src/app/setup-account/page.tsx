'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SetupAccountPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [credentials, setCredentials] = useState({
    email: '',
    tempPassword: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleFirstLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);

    try {
      // 1. Authenticate with temp password
      const userCred = await signInWithEmailAndPassword(auth, credentials.email, credentials.tempPassword);
      const user = userCred.user;

      // 2. Check if this account is actually pending_confirmation
      const pendingRef = doc(db, 'pendingEnrollments', credentials.email.toLowerCase());
      const pendingSnap = await getDoc(pendingRef);

      if (!pendingSnap.exists()) {
        toast({ variant: 'destructive', title: 'Invalid Account', description: 'This enrollment record could not be found.' });
        setLoading(false);
        return;
      }

      setStep(2);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid email or temporary password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth?.currentUser || !db || newPassword !== confirmPassword) return;
    setLoading(true);

    try {
      const user = auth.currentUser;
      const email = user.email!.toLowerCase();

      // 1. Force password change
      await updatePassword(user, newPassword);

      // 2. Get pending data
      const pendingRef = doc(db, 'pendingEnrollments', email);
      const pendingSnap = await getDoc(pendingRef);
      const pendingData = pendingSnap.data()!;

      // 3. Activate Distributor (Simulated Binary Placement)
      const newRefCode = Math.random().toString(36).substring(2, 9).toUpperCase();
      
      const distributorData = {
        uid: user.uid,
        name: pendingData.name,
        email: pendingData.email,
        phone: pendingData.phone,
        referralCode: newRefCode,
        sponsorId: pendingData.sponsorId,
        packageId: pendingData.packageId,
        rank: 'Distributor',
        kycStatus: pendingData.kycStatus || 'none',
        leftCount: 0,
        rightCount: 0,
        leftBV: 0, // In reality, placement engine would handle this
        rightBV: 0,
        incentiveBalance: 0,
        shoppingBalance: 0,
        status: 'active',
        enrollmentType: 'assisted',
        enrolledBy: pendingData.enrolledBy,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'distributors', user.uid), distributorData);
      await setDoc(doc(db, 'referralCodes', newRefCode), { ownerId: user.uid });
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: pendingData.name,
        email: pendingData.email,
        role: 'user',
        createdAt: serverTimestamp(),
      });

      // Cleanup pending record
      await updateDoc(doc(db, 'pendingEnrollments', email), { confirmedAt: serverTimestamp() });

      setStep(3);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Confirmation failed', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
      <div className="mb-12 text-center space-y-3">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary/20 mx-auto rotate-3">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-headline font-bold text-foreground">Account Setup</h1>
        <p className="text-muted-foreground font-medium">Complete your enrollment to join the network.</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-background border-b p-8 text-center">
           <CardTitle className="text-xl font-headline font-bold">
             {step === 1 && "Temporary Access"}
             {step === 2 && "Secure Your Account"}
             {step === 3 && "Welcome Aboard!"}
           </CardTitle>
           <CardDescription>
             {step === 1 && "Enter the temporary credentials sent to your email."}
             {step === 2 && "Choose a permanent password for your business portal."}
             {step === 3 && "Your account is now fully active."}
           </CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          {step === 1 && (
            <form onSubmit={handleFirstLogin} className="space-y-6">
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                 <div className="relative">
                    <Mail className="absolute left-3 top-4 w-5 h-5 text-muted-foreground" />
                    <Input 
                      className="h-14 pl-12 rounded-xl"
                      value={credentials.email}
                      onChange={e => setCredentials({...credentials, email: e.target.value})}
                      required
                    />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Temporary Password</Label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-4 w-5 h-5 text-muted-foreground" />
                    <Input 
                      type="password"
                      className="h-14 pl-12 rounded-xl"
                      value={credentials.tempPassword}
                      onChange={e => setCredentials({...credentials, tempPassword: e.target.value})}
                      required
                    />
                 </div>
               </div>
               <Button className="w-full h-14 font-bold rounded-xl" disabled={loading}>
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Credentials"}
               </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleConfirmAccount} className="space-y-6">
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Create New Password</Label>
                 <Input 
                   type="password"
                   className="h-14 rounded-xl"
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
                 <Input 
                   type="password"
                   className="h-14 rounded-xl"
                   value={confirmPassword}
                   onChange={e => setConfirmPassword(e.target.value)}
                   required
                 />
               </div>
               <Button className="w-full h-14 font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={loading || newPassword !== confirmPassword}>
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Activate Account"}
               </Button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center space-y-8 py-6">
               <div className="w-20 h-20 bg-primary/5 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
               </div>
               <div className="space-y-2">
                 <h4 className="text-2xl font-headline font-bold">Success!</h4>
                 <p className="text-muted-foreground font-medium">Your account is active. You can now access your dashboard and binary tree.</p>
               </div>
               <Button className="w-full h-14 font-bold rounded-xl gap-2" onClick={() => router.push('/dashboard')}>
                 Go to Dashboard <ArrowRight className="w-5 h-5" />
               </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
