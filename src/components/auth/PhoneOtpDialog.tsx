'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { confirmOtp, isOtpConfigured, otpErrorMessage, sendOtp } from '@/lib/phone-otp-client';

type Props = { open: boolean; phone: string; email: string; onClose: () => void; onVerified: () => void };
const RESEND_SECONDS = 30;
const MAX_WRONG_SMS_CODES = 3;

async function emailOtp(method: 'POST' | 'PUT', body: object) {
  const res = await fetch('/api/auth/verify-phone-email', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || 'Could not verify. Please try again.');
}

/** OTP popup: tries SMS first and automatically falls back to an email OTP if the SMS cannot be sent. */
export function PhoneOtpDialog({ open, phone, email, onClose, onVerified }: Props) {
  const [mode, setMode] = useState<'sms' | 'email'>('sms');
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);
  const [wrong, setWrong] = useState(0);

  const sendByEmail = async (auto = false) => {
    setMode('email'); setSending(true); setError(''); setCode(''); setSent(false);
    if (auto) setAutoSwitched(true);
    try { await emailOtp('POST', { phone, email }); setSent(true); setWait(RESEND_SECONDS); }
    catch (e: any) { setError(e.message); }
    finally { setSending(false); }
  };

  const sendBySms = async () => {
    setMode('sms'); setSending(true); setError(''); setCode(''); setSent(false);
    if (!isOtpConfigured()) { setSending(false); return sendByEmail(true); }
    try { await sendOtp(phone, 'phone-otp-recaptcha'); setSent(true); setWait(RESEND_SECONDS); setSending(false); }
    catch { setSending(false); return sendByEmail(true); } // SMS could not be sent: email the OTP automatically
  };

  useEffect(() => {
    if (!open) return;
    setAutoSwitched(false); setWrong(0); setError(''); setWait(0);
    void sendBySms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const verify = async () => {
    setChecking(true); setError('');
    try {
      if (mode === 'email') {
        await emailOtp('PUT', { phone, email, code });
      } else {
        const idToken = await confirmOtp(code);
        const res = await fetch('/api/auth/verify-phone', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, idToken }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || 'Could not verify the phone number.');
      }
      onVerified();
    } catch (e: any) {
      setError(mode === 'email' ? e.message : otpErrorMessage(e));
      if (mode === 'sms') setWrong((n) => n + 1);
    } finally { setChecking(false); }
  };

  const target = mode === 'email' ? email : phone;
  const offerEmail = mode === 'sms' && sent && (wait === 0 || wrong >= MAX_WRONG_SMS_CODES);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !checking) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Enter OTP</DialogTitle>
          <DialogDescription>
            {sent ? <>Enter the 6-digit OTP sent to your {mode === 'email' ? 'email' : 'phone'} <span className="notranslate font-medium">{target}</span>.</> : `Sending an OTP to your ${mode === 'email' ? 'email' : 'phone'}…`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {autoSwitched && mode === 'email' && <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">SMS is unavailable right now, so we emailed your OTP instead.</p>}
          <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" maxLength={6} disabled={!sent} className="h-12 text-center text-xl tracking-[0.5em]" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={code.length !== 6 || checking || !sent} onClick={verify}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & continue'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={sending || wait > 0} onClick={() => (mode === 'email' ? sendByEmail() : sendBySms())}>
            {sending ? 'Sending…' : wait > 0 ? `Resend OTP in ${wait}s` : 'Resend OTP'}
          </Button>
          {offerEmail && <Button type="button" variant="link" className="w-full" disabled={sending || checking} onClick={() => sendByEmail()}>Didn’t get the SMS? Email me the OTP</Button>}
        </div>
        <div id="phone-otp-recaptcha" />
      </DialogContent>
    </Dialog>
  );
}
