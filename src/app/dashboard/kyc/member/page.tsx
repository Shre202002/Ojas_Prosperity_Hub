'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const DOCS = [{ type: 'idProof', label: 'ID proof' }, { type: 'addressProof', label: 'Address proof' }, { type: 'selfie', label: 'Selfie photo' }] as const;

function MemberKyc() {
  const params = useSearchParams(), router = useRouter(), { toast } = useToast();
  const uid = params.get('uid') || '', name = params.get('name') || 'the new member';
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [busy, setBusy] = useState(false);
  const ready = uid && DOCS.every((d) => files[d.type]);

  async function submit() {
    setBusy(true);
    try {
      const form = new FormData(); form.append('distributorId', uid);
      DOCS.forEach((d) => form.append(d.type, files[d.type]!));
      const response = await fetch('/api/kyc/member', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('sjapl_session_token') || ''}` }, body: form });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Upload failed.');
      toast({ title: 'KYC verified', description: `${name} is verified and can sign in.` });
      router.push('/dashboard/network');
    } catch (e: any) { toast({ variant: 'destructive', title: 'Upload failed', description: e.message }); setBusy(false); }
  }

  return (
    <Card className="mx-auto mt-8 max-w-lg">
      <CardHeader><CardTitle>KYC documents for {name}</CardTitle><CardDescription>Upload all 3 documents (JPG, PNG, WEBP or PDF, up to 8 MB). Because you added this member, they are verified immediately; the Super Admin can still review them.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {DOCS.map((d) => (<div key={d.type} className="space-y-1.5"><Label>{d.label}</Label><Input type="file" accept="image/*,application/pdf" onChange={(e) => setFiles((f) => ({ ...f, [d.type]: e.target.files?.[0] }))} /></div>))}
        <div className="flex gap-3"><Button variant="ghost" onClick={() => router.push('/dashboard/network')} disabled={busy}>Later</Button><Button className="flex-1" disabled={!ready || busy} onClick={submit}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit & verify'}</Button></div>
      </CardContent>
    </Card>
  );
}

export default function MemberKycPage() { return <Suspense fallback={null}><MemberKyc /></Suspense>; }
