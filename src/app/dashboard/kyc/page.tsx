'use client';

import { useState } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useCollection, useMemoFirebase, doc, setDoc, query, collection, where } from '@/lib/app-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Camera,
  FileText,
  MapPin,
  Loader2,
  UserPlus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DocumentUpload } from '@/components/kyc/DocumentUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ADDRESS_TYPES, ID_TYPES, checkAddress, checkAddressProofNumber, checkIdNumber } from '@/lib/kyc-rules';

export default function KYCPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = useMemoFirebase(() => (
    user && db ? doc(db, 'distributors', user.uid) : null
  ), [db, user?.uid]);
  
  const { data: distributor } = useDoc(distributorRef);

  const kycQuery = useMemoFirebase(() => (
    db && user ? query(collection(db, 'kycSubmissions'), where('distributorId', '==', user.uid)) : null
  ), [db, user?.uid]);
  
  const { data: submissions, loading: loadingSubmissions } = useCollection(kycQuery, 'kyc');
  const latestSubmission = submissions?.[0];

  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    idType: '',
    idNumber: '',
    addressProofType: '',
    addressProofNumber: '',
    address: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (key: string) => setTouched((t) => ({ ...t, [key]: true }));
  const idCheck = checkIdNumber(formData.idType, formData.idNumber);
  const addrNoCheck = checkAddressProofNumber(formData.addressProofType, formData.addressProofNumber);
  const addrCheck = checkAddress(formData.address);
  const [files, setFiles] = useState<{ idProof: File | null; addressProof: File | null; selfie: File | null }>({ idProof: null, addressProof: null, selfie: null });

  const idComplete = !!files.idProof && idCheck.ok;
  const addressComplete = !!files.addressProof && addrNoCheck.ok && addrCheck.ok;
  const selfieComplete = !!files.selfie;
  const completeCount = [idComplete, addressComplete, selfieComplete].filter(Boolean).length;

  async function handleSubmitKYC() {
    if (!user || !db || !distributor || completeCount < 3) return;
    setUploading(true);
    try {
      const body = new FormData(); for (const [key, value] of Object.entries(formData)) body.append(key, value);
      Object.entries(files).forEach(([type, file]) => { if (file) body.append(type, file); });
      const response = await fetch('/api/kyc', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('sjapl_session_token') || ''}` }, body });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'KYC submission failed.');
      
      toast({
        title: 'KYC Submitted',
        description: distributor.sponsorId ? 'Your sponsor and Admin team can review your documents.' : 'Your documents will be verified by the Admin team.',
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission failed', description: e.message });
    } finally {
      setUploading(false);
    }
  }

  if (!distributor || loadingSubmissions) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (distributor.rank === 'Admin') return (
    <Card className="max-w-xl mx-auto mt-20 p-10 text-center space-y-4">
      <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
      <h1 className="text-2xl font-headline font-bold">Super Admin Verification Not Required</h1>
      <p className="text-muted-foreground">Use the Admin KYC Review Hub to manage member verification.</p>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-primary">Identity Verification</h1>
          <p className="text-muted-foreground font-medium">Verify your account to unlock full benefits and withdrawals.</p>
        </div>
        
        {latestSubmission?.status === 'verified' ? (
          <Badge className="bg-primary hover:bg-primary/90 h-10 px-6 font-bold text-sm gap-2 rounded-xl shadow-lg shadow-primary/20">
            <CheckCircle2 className="w-4 h-4" /> VERIFIED
          </Badge>
        ) : latestSubmission?.status === 'pending' ? (
          <Badge className="bg-[hsl(var(--status-pending))] text-white h-10 px-6 font-bold text-sm gap-2 rounded-xl shadow-lg shadow-amber-200">
            <Clock className="w-4 h-4" /> PENDING REVIEW
          </Badge>
        ) : latestSubmission?.status === 'rejected' ? (
          <Badge className="bg-destructive text-white h-10 px-6 font-bold text-sm gap-2 rounded-xl shadow-lg shadow-destructive/20">
            <AlertCircle className="w-4 h-4" /> REJECTED
          </Badge>
        ) : (
          <Badge variant="outline" className="border-muted h-10 px-6 font-bold text-sm gap-2 rounded-xl bg-card text-muted-foreground">
            <AlertCircle className="w-4 h-4" /> NOT SUBMITTED
          </Badge>
        )}
      </div>

      {latestSubmission?.status === 'verified' ? (
        <Card className="border-none shadow-2xl bg-primary/5 p-12 text-center space-y-6 rounded-2xl border border-primary/10">
          <div className="w-24 h-24 bg-card rounded-2xl flex items-center justify-center text-primary mx-auto shadow-xl">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold text-primary">Trust Verified</h2>
            <p className="max-w-md mx-auto text-muted-foreground font-medium">
              Your identity has been confirmed. You now have full access to all incentives, network features, and can now refer others.
            </p>
          </div>
        </Card>
      ) : latestSubmission?.status === 'pending' ? (
        <Card className="border-none shadow-2xl p-12 text-center space-y-6 rounded-2xl bg-card border border-muted">
          <div className="w-24 h-24 bg-primary/5 rounded-2xl flex items-center justify-center text-[hsl(var(--status-pending))] mx-auto shadow-sm">
            <Clock className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold text-primary">Awaiting Approval</h2>
            <p className="max-w-md mx-auto text-muted-foreground font-medium">
              Your documents are in the review queue. This process typically takes 24-48 business hours.
            </p>
          </div>
        </Card>
      ) : (
        <div className="mx-auto w-full max-w-2xl space-y-5">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />All 3 documents are required</span>
              <span className="tabular-nums text-primary">{completeCount} of 3 completed</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completeCount / 3) * 100}%` }} /></div>
          </div>

          <DocumentUpload icon={Camera} title="ID Proof" hint="PAN / Aadhaar / Passport / Voter ID / Driving Licence" accept="image/jpeg,image/png,image/webp,application/pdf" file={files.idProof} onFile={(f) => setFiles((c) => ({ ...c, idProof: f }))} complete={idComplete}>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Document type</Label>
              <Select value={formData.idType} onValueChange={(v) => setFormData((d) => ({ ...d, idType: v, idNumber: '' }))}>
                <SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Choose ID type" /></SelectTrigger>
                <SelectContent>{ID_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{ID_TYPES.find((t) => t.value === formData.idType)?.label ?? 'ID'} number</Label>
              <Input id="idNumber" value={formData.idNumber} disabled={!formData.idType} onBlur={() => touch('idNumber')} onChange={(e) => setFormData((d) => ({ ...d, idNumber: e.target.value.toUpperCase() }))} placeholder={ID_TYPES.find((t) => t.value === formData.idType)?.placeholder ?? 'Choose a document type first'} className="h-12 rounded-xl bg-background font-mono-data" autoComplete="off" />
              {!idCheck.ok && (touched.idNumber || formData.idNumber) && formData.idType && <p className="text-xs font-medium text-destructive">{idCheck.message}</p>}
            </div>
          </DocumentUpload>

          <DocumentUpload icon={MapPin} title="Address Proof" hint="Aadhaar / Utility bill / Bank statement / Rent agreement" accept="image/jpeg,image/png,image/webp,application/pdf" file={files.addressProof} onFile={(f) => setFiles((c) => ({ ...c, addressProof: f }))} complete={addressComplete}>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Document type</Label>
              <Select value={formData.addressProofType} onValueChange={(v) => setFormData((d) => ({ ...d, addressProofType: v, addressProofNumber: '' }))}>
                <SelectTrigger className="h-12 rounded-xl bg-background"><SelectValue placeholder="Choose address proof type" /></SelectTrigger>
                <SelectContent>{ADDRESS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressProofNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{ADDRESS_TYPES.find((t) => t.value === formData.addressProofType)?.numberLabel ?? 'Document number'}</Label>
              <Input id="addressProofNumber" value={formData.addressProofNumber} disabled={!formData.addressProofType} onBlur={() => touch('addressProofNumber')} onChange={(e) => setFormData((d) => ({ ...d, addressProofNumber: e.target.value.toUpperCase() }))} placeholder={formData.addressProofType ? 'Enter the number printed on the document' : 'Choose a document type first'} className="h-12 rounded-xl bg-background font-mono-data" autoComplete="off" />
              {!addrNoCheck.ok && (touched.addressProofNumber || formData.addressProofNumber) && formData.addressProofType && <p className="text-xs font-medium text-destructive">{addrNoCheck.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Residential address</Label>
              <textarea id="address" className="min-h-[110px] w-full rounded-xl border border-muted bg-background px-4 py-3 text-sm font-medium transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20" value={formData.address} onBlur={() => touch('address')} onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))} placeholder="House / street, area, city, state and PIN code, exactly as on the document" />
              {!addrCheck.ok && (touched.address || formData.address) && <p className="text-xs font-medium text-destructive">{addrCheck.message}</p>}
            </div>
          </DocumentUpload>

          <DocumentUpload icon={UserPlus} title="Live Selfie" hint="A clear photo of your face, no filters or sunglasses" accept="image/jpeg,image/png,image/webp" capture="user" file={files.selfie} onFile={(f) => setFiles((c) => ({ ...c, selfie: f }))} complete={selfieComplete} />

          {latestSubmission?.status === 'rejected' && (
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
              <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /><span className="font-bold">Rejection Reason:</span></div>
              {latestSubmission.rejectionReason || 'Documents were unclear or invalid.'}
            </div>
          )}

          <Button onClick={handleSubmitKYC} disabled={uploading || completeCount < 3} className="w-full h-14 font-bold text-lg gap-3 rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]">
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : completeCount < 3 ? `Complete all 3 documents (${completeCount}/3)` : 'Submit for Verification'}
          </Button>
        </div>
      )}
    </div>
  );
}
