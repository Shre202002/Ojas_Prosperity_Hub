'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Mail, Lock, Loader2, ArrowLeft, Crown, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

const SUPER_ADMIN_EMAIL = 'sriyanshgupta24@gmail.com';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      toast({
        variant: 'destructive',
        title: 'Unauthorized Email',
        description: 'Only the designated Super Admin email can access this gateway.',
      });
      return;
    }

    setLoading(true);
    try {
      let user;
      if (isSetupMode) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        
        toast({
          title: 'Admin Created',
          description: 'Your Super Admin account has been initialized.',
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      }

      const distRef = doc(db, 'distributors', user.uid);
      const distSnap = await getDoc(distRef);

      if (!distSnap.exists()) {
        const newRefCode = "ADMIN-" + Math.random().toString(36).substring(2, 7).toUpperCase();
        
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: 'Super Admin',
          email: user.email,
          role: 'admin',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });

        await setDoc(distRef, {
          uid: user.uid,
          name: 'Super Admin',
          email: user.email,
          referralCode: newRefCode,
          sponsorId: null,
          rank: 'Admin',
          kycStatus: 'verified',
          status: 'active',
          incentiveBalance: 0,
          shoppingBalance: 0,
          leftCount: 0,
          rightCount: 0,
          leftBV: 0,
          rightBV: 0,
          createdAt: new Date().toISOString(),
        });

        await setDoc(doc(db, 'referralCodes', newRefCode), { ownerId: user.uid });
      } else {
        await setDoc(doc(db, 'users', user.uid), { 
          lastLogin: serverTimestamp(),
          role: 'admin'
        }, { merge: true });
      }

      toast({
        title: 'Welcome, Super Admin',
        description: 'Platform management mode activated.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      let message = 'Invalid credentials for admin portal.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Account already exists. Please login instead.';
        setIsSetupMode(false);
      }
      if (error.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
      if (error.code === 'auth/user-not-found') message = 'Admin account not found. Please use Setup mode first.';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password for admin portal.';
      
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth || !email) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your admin email above first.' });
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Recovery Link Sent',
        description: `Admin recovery instructions sent to ${email}`,
      });
      setIsResetOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset Failed', description: e.message });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary/20 rotate-3">
            <Crown className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-white">
              {isSetupMode ? 'Admin Setup' : 'Super Admin'}
            </h1>
            <p className="text-slate-400 font-medium">Ayurvedic Kendra Management Portal</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-headline font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> {isSetupMode ? 'Initialize Master Account' : 'Secure Gateway'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isSetupMode 
                ? 'Configure your master password to begin.' 
                : 'Enter your credentials to access the management tools.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input 
                    id="email" 
                    type="email" 
                    className="pl-10 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-12" 
                    placeholder="sriyanshgupta24@gmail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" title="Password" className="text-slate-300">
                    {isSetupMode ? 'Create Password' : 'Secret Key'}
                  </Label>
                  {!isSetupMode && (
                    <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-[10px] uppercase font-bold text-primary hover:text-white transition-colors">Reset Key</button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-white/10 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">Admin Access Recovery</DialogTitle>
                          <DialogDescription className="text-slate-400">This will send a secure reset link to the master admin email.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 py-4">
                           <Label className="text-slate-300">Confirm Admin Email</Label>
                           <Input 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-white/5 border-white/10 text-white"
                            placeholder="sriyanshgupta24@gmail.com"
                           />
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleResetPassword} 
                            disabled={resetLoading || !email}
                            className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-bold"
                          >
                            {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Recovery Link'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10 rounded-xl bg-white/5 border-white/10 text-white h-12" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 mt-4" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    {isSetupMode ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    {isSetupMode ? 'Initialize Admin' : 'Enter Management Portal'}
                  </span>
                )}
              </Button>
            </form>

            <button 
              onClick={() => setIsSetupMode(!isSetupMode)}
              className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors mt-2"
            >
              {isSetupMode ? 'Already have an account? Login here' : 'First time? Setup master account'}
            </button>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white hover:bg-white/5 gap-2">
                <ArrowLeft className="w-4 h-4" /> Standard Member Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <p className="text-center text-slate-500 text-xs font-medium">
          Authorized Personnel Only • IP Logging Active
        </p>
      </div>
    </div>
  );
}
