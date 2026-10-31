'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, useAuth } from '@/lib/app-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Mail, Lock, Loader2, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage, getPasswordResetActionSettings } from '@/lib/password-reset';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { BRAND } from '@/lib/brand';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = isSetupMode
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password);

      // The server decides who is an admin (SUPER_ADMIN_EMAIL); anyone else is turned away.
      if (user.role !== 'admin') {
        await signOut(auth);
        throw new Error('This account does not have administrator access.');
      }

      const token = await user.getIdToken(true);
      const response = await fetch('/api/network/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'Super Admin', email: user.email, registrationType: 'admin' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not provision the admin profile.');

      toast({ title: 'Welcome, Super Admin', description: 'Platform management mode activated.' });
      router.push('/dashboard');
    } catch (error: any) {
      if (isSetupMode && /already registered/i.test(error.message)) setIsSetupMode(false);
      toast({
        variant: 'destructive',
        title: 'Authentication error',
        description: getAuthErrorMessage(error, error.message || 'Invalid credentials for the admin portal.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email required', description: 'Please enter your admin email first.' });
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), getPasswordResetActionSettings());
      toast({ title: 'Request received', description: 'If this email is registered, recovery instructions will be sent to it.' });
      setIsResetOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Reset failed', description: getAuthErrorMessage(e, 'Could not start the password reset.') });
    } finally {
      setResetLoading(false);
    }
  };

  const field = 'pl-10 h-12 bg-white/5 border-white/15 text-white placeholder:text-white/40';

  return (
    <div className="min-h-screen bg-brand-gradient flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size={72} showName={false} />
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">{isSetupMode ? 'Admin setup' : 'Super Admin'}</h1>
            <p className="text-white/60">{BRAND.name} management portal</p>
          </div>
        </div>

        <Card className="bg-white/[0.06] backdrop-blur-xl border-white/15 text-white shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" /> {isSetupMode ? 'Initialize master account' : 'Secure gateway'}
            </CardTitle>
            <CardDescription className="text-white/60">
              {isSetupMode ? 'Choose a master password to begin.' : 'Enter your credentials to open the management tools.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Admin email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 w-4 h-4 text-white/40" />
                  <Input id="email" type="email" autoComplete="email" className={field} placeholder="admin@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/80">{isSetupMode ? 'Create password' : 'Password'}</Label>
                  {!isSetupMode && (
                    <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-xs font-semibold text-accent hover:text-white transition-colors">Forgot password?</button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Admin access recovery</DialogTitle>
                          <DialogDescription>We will start a secure reset for the admin email below.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 py-2">
                          <Label htmlFor="admin-reset-email">Admin email</Label>
                          <Input id="admin-reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleResetPassword} disabled={resetLoading || !email} className="w-full h-11 font-semibold">
                            {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send recovery link'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 w-4 h-4 text-white/40" />
                  <Input id="password" type="password" autoComplete={isSetupMode ? 'new-password' : 'current-password'} className={field} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-semibold bg-accent text-accent-foreground hover:bg-accent/90 mt-2" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    {isSetupMode ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    {isSetupMode ? 'Initialize admin' : 'Enter management portal'}
                  </span>
                )}
              </Button>
            </form>
            <button type="button" onClick={() => setIsSetupMode(!isSetupMode)} className="w-full text-center text-sm text-white/60 hover:text-white transition-colors">
              {isSetupMode ? 'Already set up? Sign in' : 'First time? Set up master account'}
            </button>
          </CardContent>
          <CardFooter>
            <Button asChild variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10 gap-2">
              <Link href="/login"><ArrowLeft className="w-4 h-4" /> Member login</Link>
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-white/40 text-xs">Authorized personnel only</p>
      </div>
    </div>
  );
}
