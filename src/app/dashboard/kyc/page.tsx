'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useCollection, useMemoFirebase, doc, query, collection, where } from '@/lib/app-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DocumentUpload } from '@/components/kyc/DocumentUpload';
import { KycStepper, KYC_STEPS } from '@/components/kyc/KycStepper';
import { KycTips } from '@/components/kyc/KycTips';
import { KycReview } from '@/components/kyc/KycReview';
import { KycRejectedNotice, KycStatusCard } from '@/components/kyc/KycStatusCard';
import { ADDRESS_TYPES, ID_ALSO_ADDRESS, ID_TYPES, checkAddress, checkAddressProofNumber, checkIdNumber, formatIdNumber, maskNumber } from '@/lib/kyc-rules';

const DRAFT_KEY = 'sjapl_kyc_draft_v1';
const EMPTY = { idType: '', idNumber: '', addressProofType: '', addressProofNumber: '', address: '' };
const STEP_TITLES = ['Upload your ID proof', 'Upload your address proof', 'Take a live selfie', 'Review and submit'];

function FieldError({ show, message }: { show: boolean; message?: string }) {
  return show && message ? <p role="alert" className="text-xs font-medium text-destructive">{message}</p> : null;
}

export default function KYCPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = useMemoFirebase(() => (user && db ? doc(db, 'distributors', user.uid) : null), [db, user?.uid]);
  const { data: distributor } = useDoc(distributorRef);
  const kycQuery = useMemoFirebase(() => (db && user ? query(collection(db, 'kycSubmissions'), where('distributorId', '==', user.uid)) : null), [db, user?.uid]);
  const { data: submissions, loading: loadingSubmissions } = useCollection(kycQuery, 'kyc');
  const latestSubmission = submissions?.[0];

  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [sameAsId, setSameAsId] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<{ idProof: File | null; addressProof: File | null; selfie: File | null }>({ idProof: null, addressProof: null, selfie: null });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }));

  // Keep typed details (never files) across a refresh.
  useEffect(() => {
    try { const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); if (saved?.formData) { setFormData({ ...EMPTY, ...saved.formData }); setSameAsId(!!saved.sameAsId); } } catch { /* storage blocked */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, sameAsId })); } catch { /* storage blocked */ }
  }, [formData, sameAsId]);

  // Warn before leaving with chosen files that have not been sent.
  const hasFiles = !!(files.idProof || files.addressProof || files.selfie);
  useEffect(() => {
    if (!hasFiles || justSubmitted) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasFiles, justSubmitted]);

  // Move focus to the new step heading so keyboard and screen-reader users land in the right place.
  const firstRender = useRef(true);
  useEffect(() => { if (firstRender.current) { firstRender.current = false; return; } headingRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const canReuseId = ID_ALSO_ADDRESS.includes(formData.idType);
  const useIdAsAddress = sameAsId && canReuseId;
  const addrType = useIdAsAddress ? formData.idType : formData.addressProofType;
  const addrNumber = useIdAsAddress ? formData.idNumber : formData.addressProofNumber;
  const addrFile = useIdAsAddress ? files.idProof : files.addressProof;

  const idCheck = checkIdNumber(formData.idType, formData.idNumber);
  const addrNoCheck = checkAddressProofNumber(addrType, addrNumber);
  const addrCheck = checkAddress(formData.address);
  const done = [!!files.idProof && idCheck.ok, !!addrFile && addrNoCheck.ok && addrCheck.ok, !!files.selfie, consent];
  const stepReady = step < 3 ? done[step] : done[0] && done[1] && done[2] && consent;

  async function handleSubmitKYC() {
    if (!user || !db || !distributor || !(done[0] && done[1] && done[2] && consent) || uploading) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('idType', formData.idType); body.append('idNumber', formData.idNumber);
      body.append('addressProofType', addrType); body.append('addressProofNumber', addrNumber); body.append('address', formData.address);
      if (files.idProof) body.append('idProof', files.idProof);
      if (addrFile) body.append('addressProof', addrFile);
      if (files.selfie) body.append('selfie', files.selfie);
      const response = await fetch('/api/kyc', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('sjapl_session_token') || ''}` }, body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'KYC submission failed.');
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setFiles({ idProof: null, addressProof: null, selfie: null });
      setJustSubmitted(true);
      toast({ title: 'KYC submitted', description: distributor.sponsorId ? 'Your sponsor and the Admin team can now review your documents.' : 'Your documents will be verified by the Admin team.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission failed', description: e.message });
    } finally {
      setUploading(false);
    }
  }

  if (!distributor || loadingSubmissions) return (
    <div className="mx-auto max-w-4xl space-y-6 py-8" aria-busy>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );

  if (distributor.rank === 'Admin') return (
    <Card className="mx-auto mt-20 max-w-xl space-y-4 p-10 text-center">
      <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
      <h1 className="font-headline text-2xl font-bold">Super Admin Verification Not Required</h1>
      <p className="text-muted-foreground">Use the Admin KYC Review Hub to manage member verification.</p>
    </Card>
  );

  const status = justSubmitted ? 'pending' : latestSubmission?.status;
  if (status === 'verified' || status === 'pending') {
    return <div className="mx-auto max-w-4xl py-8"><KycStatusCard status={justSubmitted ? 'submitted' : status} /></div>;
  }

  const idMeta = ID_TYPES.find((t) => t.value === formData.idType);
  const addrMeta = ADDRESS_TYPES.find((t) => t.value === addrType);
  const reviewRows = [
    { title: 'ID proof', file: files.idProof, step: 0, lines: [`${idMeta?.label ?? ''}`, maskNumber(formData.idNumber)] },
    { title: 'Address proof', file: addrFile, step: 1, lines: [`${addrMeta?.label ?? ''} · ${maskNumber(addrNumber)}`, formData.address.trim()] },
    { title: 'Live selfie', file: files.selfie, step: 2, lines: ['Photo of your face'], round: true },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-6 pb-28 md:py-8 md:pb-8">
      <header className="space-y-2">
        <h1 className="font-headline text-3xl font-bold text-primary md:text-4xl">Identity Verification</h1>
        <p className="text-muted-foreground">Verify once to unlock withdrawals and referrals.</p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" aria-hidden />Takes about 3 minutes</li>
          <li className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />Reviewed in 24 to 48 hours</li>
          <li className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-primary" aria-hidden />Private and encrypted</li>
        </ul>
      </header>

      {status === 'rejected' && <KycRejectedNotice reason={latestSubmission?.rejectionReason} />}

      <KycStepper step={step} done={done} onGo={setStep} />

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="kyc-step-title">
          <h2 id="kyc-step-title" ref={headingRef} tabIndex={-1} className="font-headline text-2xl font-bold outline-none">{STEP_TITLES[step]}</h2>

          {step === 0 && (
            <>
              <DocumentUpload title="ID proof" file={files.idProof} onFile={(f) => setFiles((c) => ({ ...c, idProof: f }))} />
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Which ID are you uploading?</Label>
                <Select value={formData.idType} onValueChange={(v) => setFormData((d) => ({ ...d, idType: v, idNumber: '' }))}>
                  <SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Choose ID type" /></SelectTrigger>
                  <SelectContent>{ID_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber" className="text-sm font-semibold">{idMeta?.label ?? 'ID'} number</Label>
                <div className="relative">
                  <Input
                    id="idNumber" value={formData.idNumber} disabled={!formData.idType} autoComplete="off" spellCheck={false}
                    type={showNumber ? 'text' : 'password'} inputMode={formData.idType === 'aadhaar' ? 'numeric' : 'text'}
                    onBlur={() => touch('idNumber')}
                    onChange={(e) => setFormData((d) => ({ ...d, idNumber: formatIdNumber(d.idType, e.target.value) }))}
                    placeholder={idMeta?.placeholder ?? 'Choose the ID type first'}
                    aria-invalid={!idCheck.ok && !!formData.idNumber}
                    className={cn('h-12 rounded-xl bg-background pr-24 font-mono-data tracking-wider', idCheck.ok && 'border-primary')}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    {idCheck.ok && <CheckCircle2 className="h-5 w-5 text-primary" aria-label="Looks good" />}
                    <button type="button" onClick={() => setShowNumber((s) => !s)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={showNumber ? 'Hide number' : 'Show number'}>
                      {showNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <FieldError show={!!formData.idType && !idCheck.ok && (!!touched.idNumber || !!formData.idNumber)} message={idCheck.ok ? '' : idCheck.message} />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {canReuseId && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-primary/5 p-4">
                  <input type="checkbox" checked={sameAsId} onChange={(e) => setSameAsId(e.target.checked)} className="mt-1 h-5 w-5 accent-[hsl(var(--primary))]" />
                  <span className="text-sm"><span className="block font-semibold">My {idMeta?.label} is also my address proof</span><span className="text-muted-foreground">We will reuse the same file and number, so you do not upload it twice.</span></span>
                </label>
              )}
              {!useIdAsAddress && (
                <>
                  <DocumentUpload title="address proof" file={files.addressProof} onFile={(f) => setFiles((c) => ({ ...c, addressProof: f }))} />
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Which document is it?</Label>
                    <Select value={formData.addressProofType} onValueChange={(v) => setFormData((d) => ({ ...d, addressProofType: v, addressProofNumber: '' }))}>
                      <SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Choose address proof type" /></SelectTrigger>
                      <SelectContent>{ADDRESS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressProofNumber" className="text-sm font-semibold">{addrMeta?.numberLabel ?? 'Document number'}</Label>
                    <Input id="addressProofNumber" value={formData.addressProofNumber} disabled={!formData.addressProofType} autoComplete="off" spellCheck={false} inputMode={formData.addressProofType === 'aadhaar' ? 'numeric' : 'text'}
                      onBlur={() => touch('addressProofNumber')} onChange={(e) => setFormData((d) => ({ ...d, addressProofNumber: formatIdNumber(d.addressProofType, e.target.value) }))}
                      placeholder={formData.addressProofType ? 'Number printed on the document' : 'Choose the document type first'} className={cn('h-12 rounded-xl bg-background font-mono-data tracking-wider', addrNoCheck.ok && 'border-primary')} />
                    <FieldError show={!!formData.addressProofType && !addrNoCheck.ok && (!!touched.addressProofNumber || !!formData.addressProofNumber)} message={addrNoCheck.ok ? '' : addrNoCheck.message} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold">Residential address</Label>
                <textarea id="address" value={formData.address} onBlur={() => touch('address')} onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
                  className="min-h-[110px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="House or street, area, city, state and PIN code, exactly as on the document" />
                <div className="flex justify-between gap-2"><FieldError show={!addrCheck.ok && (!!touched.address || !!formData.address)} message={addrCheck.ok ? '' : addrCheck.message} /><span className="ml-auto text-xs tabular-nums text-muted-foreground">{formData.address.trim().length} characters</span></div>
              </div>
            </>
          )}

          {step === 2 && <DocumentUpload title="selfie" variant="selfie" file={files.selfie} onFile={(f) => setFiles((c) => ({ ...c, selfie: f }))} />}

          {step === 3 && (
            <>
              <KycReview rows={reviewRows} onEdit={setStep} />
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-[hsl(var(--primary))]" />
                <span className="text-sm">I confirm these documents belong to me and the details above are correct.</span>
              </label>
            </>
          )}
        </section>

        <KycTips step={step} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl gap-3">
          {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={uploading} className="h-12 gap-2 rounded-xl px-5"><ArrowLeft className="h-4 w-4" aria-hidden />Back</Button>}
          {step < 3 ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!stepReady} className="h-12 flex-1 gap-2 rounded-xl font-semibold md:flex-none md:px-8">Continue<ArrowRight className="h-4 w-4" aria-hidden /></Button>
          ) : (
            <Button type="button" onClick={handleSubmitKYC} disabled={!stepReady || uploading} className="h-12 flex-1 gap-2 rounded-xl font-semibold md:flex-none md:px-8">
              {uploading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Uploading securely…</> : 'Submit for verification'}
            </Button>
          )}
        </div>
        {!stepReady && step < 3 && <p className="mx-auto mt-2 max-w-5xl text-xs text-muted-foreground" aria-live="polite">{KYC_STEPS[step]}: add the file and fill every field to continue.</p>}
      </div>
    </div>
  );
}
