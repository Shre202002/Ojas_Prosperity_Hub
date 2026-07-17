'use client';

import { useState } from 'react';
import { useAuth, useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, query, collection, where } from 'firebase/firestore';
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

export default function KYCPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = useMemoFirebase(() => (
    user && db ? doc(db, 'distributors', user.uid) : null
  ), [db, user?.uid]);
  
  const { data: distributor } = useDoc(distributorRef);

  // Check for existing submission
  const kycQuery = useMemoFirebase(() => (
    db && user ? query(collection(db, 'kycSubmissions'), where('distributorId', '==', user.uid)) : null
  ), [db, user?.uid]);
  
  const { data: submissions, loading: loadingSubmissions } = useCollection(kycQuery);
  const latestSubmission = submissions?.[0];

  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    idNumber: '',
    address: '',
  });

  async function handleSubmitKYC() {
    if (!user || !db || !distributor) return;
    setUploading(true);
    try {
      const submissionId = `KYC_${user.uid}_${Date.now()}`;
      const submissionData = {
        id: submissionId,
        distributorId: user.uid,
        sponsorId: distributor.sponsorId,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        idProofUrl: 'https://picsum.photos/seed/id/400/300', // Mock upload
        addressProofUrl: 'https://picsum.photos/seed/addr/400/300', // Mock upload
        selfieUrl: 'https://picsum.photos/seed/selfie/400/300', // Mock upload
        idNumber: formData.idNumber,
        address: formData.address,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: null
      };

      await setDoc(doc(db, 'kycSubmissions', submissionId), submissionData);
      
      toast({
        title: 'KYC Submitted',
        description: 'Your sponsor will review your documents shortly.',
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

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-slate-900">Identity Verification</h1>
          <p className="text-muted-foreground font-medium">Verify your account to unlock full benefits and withdrawals.</p>
        </div>
        
        {latestSubmission?.status === 'verified' ? (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 h-10 px-6 font-bold text-sm gap-2 rounded-xl shadow-lg shadow-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> VERIFIED
          </Badge>
        ) : latestSubmission?.status === 'pending' ? (
          <Badge className="bg-amber-500 hover:bg-amber-600 h-10 px-6 font-bold text-sm gap-2 rounded-xl shadow-lg shadow-amber-200">
            <Clock className="w-4 h-4" /> PENDING REVIEW
          </Badge>
        ) : latestSubmission?.status === 'rejected' ? (
          <Badge variant="destructive" className="h-10 px-6 font-bold text-sm gap-2 rounded-xl shadow-lg shadow-red-200">
            <AlertCircle className="w-4 h-4" /> REJECTED
          </Badge>
        ) : (
          <Badge variant="outline" className="border-slate-300 h-10 px-6 font-bold text-sm gap-2 rounded-xl bg-white">
            <AlertCircle className="w-4 h-4 text-slate-400" /> NOT SUBMITTED
          </Badge>
        )}
      </div>

      {latestSubmission?.status === 'verified' ? (
        <Card className="border-none shadow-2xl bg-emerald-50/50 p-12 text-center space-y-6 rounded-[2.5rem] border border-emerald-100">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-emerald-500 mx-auto shadow-xl">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold text-emerald-900">Trust Verified</h2>
            <p className="max-w-md mx-auto text-emerald-700 font-medium">
              Your identity has been confirmed by your sponsor. You now have full access to all incentives and network features.
            </p>
          </div>
        </Card>
      ) : latestSubmission?.status === 'pending' ? (
        <Card className="border-none shadow-2xl p-12 text-center space-y-6 rounded-[2.5rem] bg-white">
          <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mx-auto shadow-sm">
            <Clock className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-headline font-bold text-slate-900">Awaiting Approval</h2>
            <p className="max-w-md mx-auto text-muted-foreground font-medium">
              Your documents are in the review queue of your sponsor. This process typically takes 24-48 business hours.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 border-b pb-6">
                <CardTitle className="font-headline text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  Required Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  { icon: Camera, label: 'ID Proof', sub: 'Aadhaar / PAN / Passport' },
                  { icon: MapPin, label: 'Address Proof', sub: 'Utility Bill / Statement' },
                  { icon: UserPlus, label: 'Live Selfie', sub: 'Face must be clearly visible' }
                ].map((doc, i) => (
                  <div key={i} className="p-5 border-2 border-dashed rounded-[1.5rem] hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <doc.icon className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{doc.label}</p>
                        <p className="text-xs text-muted-foreground font-medium">{doc.sub}</p>
                      </div>
                      <Upload className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-white">
              <CardHeader className="bg-slate-50 border-b pb-6">
                <CardTitle className="font-headline text-xl font-bold flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-secondary" />
                  </div>
                  Details & Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-xs font-bold uppercase tracking-widest text-slate-500">Document ID Number</Label>
                  <Input 
                    id="idNumber" 
                    value={formData.idNumber} 
                    onChange={e => setFormData({...formData, idNumber: e.target.value})}
                    placeholder="Enter PAN or Aadhaar Number"
                    className="h-14 rounded-xl font-mono-data border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-slate-500">Residential Address</Label>
                  <textarea 
                    id="address" 
                    className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Provide your complete permanent address"
                  />
                </div>
                {latestSubmission?.status === 'rejected' && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-bold">Rejection Reason:</span>
                    </div>
                    {latestSubmission.rejectionReason || 'Documents were unclear or invalid.'}
                  </div>
                )}
                <Button 
                  onClick={handleSubmitKYC} 
                  disabled={uploading || !formData.idNumber || !formData.address}
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
