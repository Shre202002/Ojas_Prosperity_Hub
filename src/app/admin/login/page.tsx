'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Mail, Lock, Loader2, ArrowLeft, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const SUPER_ADMIN_EMAIL = 'sriyanshgupta24@gmail.com';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const logoImage = PlaceHolderImages.find(img => img.id === 'site-logo');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (email.toLowerCase() !== SUPER_ADMIN_EMAIL) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'This portal is restricted to the Super Administrator.',
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        lastLogin: serverTimestamp(),
        role: 'admin'
      }, { merge: true });
      
      toast({
        title: 'Welcome, Super Admin',
        description: 'Platform management mode activated.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Invalid credentials for admin portal.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background */}
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
            <h1 className="text-3xl font-headline font-bold text-white">Super Admin</h1>
            <p className="text-slate-400 font-medium">Ayurvedic Kendra Management Portal</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-headline font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Secure Gateway
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={handleAdminLogin} className="space-y-4">
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
                <Label htmlFor="password" title="Password" className="text-slate-300">Secret Key</Label>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Management Portal'}
              </Button>
            </form>
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
