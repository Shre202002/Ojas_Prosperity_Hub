'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword, sendPasswordResetEmail, useAuth, useUser } from '@/lib/app-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Mail, Lock, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage, getPasswordResetActionSettings } from '@/lib/password-reset';
import { AuthShell } from '@/components/layout/AuthShell';
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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const auth = useAuth();
  const { user } = useUser(auth);
  const router = useRouter();
  const { toast } = useToast();

  // Already signed in: skip the form.
  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast({ title: 'Login successful', description: `Welcome back to ${BRAND.name}.` });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: getAuthErrorMessage(error, 'Invalid email or password.'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase();
    if (!normalizedEmail) return;
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail, getPasswordResetActionSettings());
      toast({
        title: 'Request received',
        description: 'If this email is registered, reset instructions will be sent to it.',
      });
      setIsResetOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset failed',
        description: getAuthErrorMessage(error, 'Could not start the password reset.'),
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthShell>
      <Card className="shadow-xl border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl">Member login</CardTitle>
          <CardDescription>Sign in to manage your network, wallet and KYC.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="pl-10 h-11"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-xs font-semibold text-primary hover:underline">Forgot password?</button>
                  </DialogTrigger>
                  <DialogContent onOpenAutoFocus={() => { if (!resetEmail) setResetEmail(email); }}>
                    <DialogHeader>
                      <DialogTitle>Reset password</DialogTitle>
                      <DialogDescription>Enter your registered email to receive reset instructions.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                      <Label htmlFor="reset-email">Registered email</Label>
                      <Input
                        id="reset-email"
                        placeholder="name@example.com"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleResetPassword} disabled={resetLoading || !resetEmail} className="w-full h-11 font-semibold">
                        {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset link'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-center text-muted-foreground">
            New to {BRAND.short}? <Link href="/join" className="text-primary font-semibold hover:underline">Join with a referral code</Link>
          </p>
          <div className="gold-rule w-full" />
          <Link href="/admin/login" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
            <ShieldCheck className="w-3.5 h-3.5" /> Staff &amp; administrator portal
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
