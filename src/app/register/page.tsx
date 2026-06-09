
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Leaf, User, Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    if (password !== confirmPassword) {
      return toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Passwords do not match.',
      });
    }

    if (password.length < 8) {
      return toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Password must be at least 8 characters long.',
      });
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        name: name,
        email: email,
        photoURL: '',
        provider: 'password',
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

      toast({
        title: 'Registration Successful',
        description: 'Welcome to Ojas Care!',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Firebase Registration Error:", error);
      console.error("Firebase Error Code:", error.code);
      
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: `Error: ${error.code || 'unknown'}. ${error.message || 'Could not create account.'}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
      <Link href="/" className="inline-flex items-center gap-2 mb-8">
        <div className="bg-primary text-white p-2 rounded-full">
          <Leaf className="w-6 h-6" />
        </div>
        <span className="font-headline font-bold text-2xl text-primary tracking-tight">OJAS CARE</span>
      </Link>

      <Card className="w-full max-md shadow-2xl border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline font-bold">Join Ojas Care</CardTitle>
          <CardDescription>Start your journey to health and prosperity.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  className="pl-10" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  className="pl-10" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-10" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  className="pl-10" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Login here</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
