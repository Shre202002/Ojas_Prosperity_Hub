'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { confirmOtp, otpErrorMessage, sendOtp } from '@/lib/phone-otp-client';

type Props = { open: boolean; phone: string; onClose: () => void; onVerified: () => void };
const RESEND_SECONDS = 30;

export function PhoneOtpDialog({ open, phone, onClose, onVerified }: Props) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [wait, setWait] = useState(0);

  const send = async () => {
    setSending(true); setError(''); setCode('');
    try { await sendOtp(phone, 'phone-otp-recaptcha'); setSent(true); setWait(RESEND_SECONDS); }
    catch (e: any) { setError(otpErrorMessage(e)); }
    finally { setSending(false); }
  };

  useEffect(() => { if (open) { setSent(false); void send(); } /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(t); }, [wait]);

  const verify = async () => {
    setChecking(true); setError('');
    try {
      const idToken = await confirmOtp(code);
      const res = await fetch('/api/auth/verify-phone', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, idToken }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Could not verify the phone number.');
      onVerified();
    } catch (e: any) { setError(otpErrorMessage(e)); }
    finally { setChecking(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !checking) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify your phone</DialogTitle>
          <DialogDescription>{sent ? <>Enter the 6-digit code sent to <span className="notranslate font-medium">{phone}</span>.</> : 'Sending a code to your phone…'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" maxLength={6} disabled={!sent} className="h-12 text-center text-xl tracking-[0.5em]" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={code.length !== 6 || checking || !sent} onClick={verify}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & continue'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={sending || wait > 0} onClick={send}>
            {sending ? 'Sending…' : wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
          </Button>
        </div>
        <div id="phone-otp-recaptcha" />
      </DialogContent>
    </Dialog>
  );
}
