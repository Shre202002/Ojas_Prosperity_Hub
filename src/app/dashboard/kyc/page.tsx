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
    idNumber: '',
    address: '',
  });
  const [files, setFiles] = useState<{ idProof: File | null; addressProof: File | null; selfie: File | null }>({ idProof: null, addressProof: null, selfie: null });

  async function handleSubmitKYC() {
    if (!user || !db || !distributor) return;
    setUploading(true);
    try {
      const body = new FormData(); body.append('idNumber', formData.idNumber); body.append('address', formData.address);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border border-muted shadow-xl rounded-xl bg-card overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
                <CardTitle className="font-headline text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-card rounded-xl shadow-sm">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  Required Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { icon: Camera, label: 'ID Proof', sub: 'Aadhaar / PAN / Passport', type: 'idProof' as const },
                  { icon: MapPin, label: 'Address Proof', sub: 'Utility Bill / Statement', type: 'addressProof' as const },
                  { icon: UserPlus, label: 'Live Selfie', sub: 'Face must be clearly visible', type: 'selfie' as const }
                ].map((doc, i) => (
                  <div key={i} className="p-5 border-2 border-dashed border-muted rounded-[1.5rem] hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center group-hover:bg-card transition-colors">
                        <doc.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{doc.label}</p>
                        <p className="text-xs text-muted-foreground font-medium">{doc.sub}</p>
                      </div>
                      <label className="text-xs font-bold text-primary cursor-pointer">{files[doc.type]?.name || 'Choose'}<input type="file" accept="image/*,application/pdf" className="hidden" onChange={event => setFiles(current => ({ ...current, [doc.type]: event.target.files?.[0] || null }))} /></label>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-muted shadow-xl rounded-xl bg-card">
              <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
                <CardTitle className="font-headline text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-card rounded-xl shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                  </div>
                  Details & Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Document ID Number</Label>
                  <Input 
                    id="idNumber" 
                    value={formData.idNumber} 
                    onChange={e => setFormData({...formData, idNumber: e.target.value})}
                    placeholder="Enter PAN or Aadhaar Number"
                    className="h-14 rounded-xl font-mono-data border-muted bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Residential Address</Label>
                  <textarea 
                    id="address" 
                    className="w-full min-h-[120px] rounded-xl border border-muted bg-background px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Provide your complete permanent address"
                  />
                </div>
                {latestSubmission?.status === 'rejected' && (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-bold">Rejection Reason:</span>
                    </div>
                    {latestSubmission.rejectionReason || 'Documents were unclear or invalid.'}
                  </div>
                )}
                <Button 
                  onClick={handleSubmitKYC} 
                  disabled={uploading || !formData.idNumber || !formData.address || !files.idProof || !files.addressProof || !files.selfie}
                  className="w-full h-16 font-bold text-lg gap-3 rounded-[1.5rem] shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit for Verification'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
