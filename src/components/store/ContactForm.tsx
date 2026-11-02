'use client';

import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ContactForm() {
  const [fields, setFields] = useState({ name: '', email: '', phone: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ref, setRef] = useState('');

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSending(true);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, website: honeypot }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'We could not send your message. Please try again.');
      setRef(result.ref || 'sent');
    } catch (e: any) {
      setError(e.message || 'We could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (ref) {
    return (
      <div role="status" className="rounded-xl border border-accent/50 bg-secondary p-8">
        <p className="font-headline text-3xl font-semibold text-primary">Message sent.</p>
        <p className="mt-2 text-muted-foreground">Thank you, {fields.name.split(' ')[0]}. We will reply to {fields.email}.{ref !== 'sent' && ref !== 'MSG-RECEIVED' ? ` Your reference is ${ref}.` : ''}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="m-name">Your name</Label><Input id="m-name" required minLength={2} maxLength={80} autoComplete="name" value={fields.name} onChange={set('name')} className="h-11" /></div>
        <div className="space-y-2"><Label htmlFor="m-email">Email</Label><Input id="m-email" type="email" required maxLength={120} autoComplete="email" value={fields.email} onChange={set('email')} className="h-11" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="m-phone">Phone (optional)</Label><Input id="m-phone" type="tel" inputMode="tel" autoComplete="tel" pattern="\+?[\d\s\-]{8,16}" title="Enter a valid phone number" value={fields.phone} onChange={set('phone')} className="h-11" /></div>
      <div className="space-y-2"><Label htmlFor="m-message">How can we help?</Label><Textarea id="m-message" required minLength={10} maxLength={2000} rows={6} value={fields.message} onChange={set('message')} /></div>

      <div className="absolute -left-[9999px]" aria-hidden>
        <label htmlFor="m-website">Website</label>
        <input id="m-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={sending} className="h-12 px-8 text-base font-semibold">
        {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : 'Send message'}
      </Button>
    </form>
  );
}
