'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from '@/lib/app-auth';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/app-auth';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage } from '@/lib/password-reset';
import { AuthShell } from '@/components/layout/AuthShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordForm() {
  const auth = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const oobCode = params.get('oobCode');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth || !oobCode) {
      if (!oobCode) setError('This reset link is missing or incomplete.');
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(setEmail)
      .then(() => setVerified(true))
      .catch((verificationError) => setError(getAuthErrorMessage(verificationError, 'This reset link is no longer valid.')))
      .finally(() => setChecking(false));
  }, [auth, oobCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !oobCode || !verified) return;
    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast({ title: 'Password Updated', description: 'You can now sign in with your new password.' });
      router.push('/login');
    } catch (resetError) {
      setError(getAuthErrorMessage(resetError, 'Could not update your password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell>
      <Card className="shadow-xl border-border/60">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>{email ? `Create a new password for ${email}.` : 'Create a new password for your account.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {checking ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : error && !verified ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild className="w-full"><Link href="/login">Return to Login</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative"><Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input id="new-password" type="password" minLength={6} required className="pl-10" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" minLength={6} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
