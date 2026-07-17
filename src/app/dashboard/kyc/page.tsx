
'use client';

import { useState } from 'react';
import { useAuth, useUser, useFirestore, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KYCPage() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = user && db ? doc(db, 'distributors', user.uid) : null;
  const { data: distributor } = useDoc(distributorRef);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    idNumber: '',
    address: '',
  });

  async function handleSubmitKYC() {
    if (!user || !db || !distributor) return;
    setLoading(true);
    try {
      const submissionId = Math.random().toString(36).substring(7);
      const submissionData = {
        id: submissionId,
        distributorId: user.uid,
        sponsorId: distributor.sponsorId,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        idProofUrl: 'https://picsum.photos/400/300?random=1', // Mocked upload
        addressProofUrl: 'https://picsum.photos/400/300?random=2', // Mocked upload
        selfieUrl: 'https://picsum.photos/400/300?random=3', // Mocked upload
      };

      await setDoc(doc(db, 'kycSubmissions', submissionId), submissionData);
      await setDoc(doc(db, 'distributors', user.uid), { kycStatus: 'pending' }, { merge: true });

      toast({
        title: 'KYC Submitted',
        description: 'Your sponsor will review your documents shortly.',
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission failed', description: e.message });
    } finally {
      setLoading(false);
    }
  }

  if (!distributor) return null;

  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold">Identity Verification</h1>
          <p className="text-muted-foreground">Submit your documents to unlock higher withdrawal limits and ranks.</p>
        </div>
        
        {distributor.kycStatus === 'verified' ? (
          <Badge className="bg-emerald-500 h-10 px-6 font-bold text-sm gap-2">
            <CheckCircle2 className="w-4 h-4" /> VERIFIED
          </Badge>
        ) : distributor.kycStatus === 'pending' ? (
          <Badge className="bg-amber-500 h-10 px-6 font-bold text-sm gap-2">
            <Clock className="w-4 h-4" /> PENDING REVIEW
          </Badge>
        ) : (
          <Badge variant="outline" className="border-slate-300 h-10 px-6 font-bold text-sm gap-2">
            <AlertCircle className="w-4 h-4" /> NOT SUBMITTED
          </Badge>
        )}
      </div>

      {distributor.kycStatus === 'verified' ? (
        <Card className="border-none shadow-xl bg-emerald-50 text-emerald-800 p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-bold">You're All Set!</h2>
            <p className="max-w-md mx-auto opacity-80">
              Your identity has been successfully verified by your sponsor. You now have full access to all portal features.
            </p>
          </div>
        </Card>
      ) : distributor.kycStatus === 'pending' ? (
        <Card className="border-none shadow-xl p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
            <Clock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-bold">Awaiting Sponsor Approval</h2>
            <p className="max-w-md mx-auto text-muted-foreground">
              Your documents have been submitted and are currently in the review queue of your sponsor. This usually takes 24-48 hours.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Required Documents
              </CardTitle>
              <CardDescription>Upload clear photos of your official documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-6 border-2 border-dashed rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">ID Proof (Aadhaar/PAN)</p>
                      <p className="text-xs text-muted-foreground">JPG or PNG, max 5MB</p>
                    </div>
                    <Upload className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
                
                <div className="p-6 border-2 border-dashed rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <MapPin className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">Address Proof</p>
                      <p className="text-xs text-muted-foreground">Electricity bill or Bank stmt</p>
                    </div>
                    <Upload className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Additional Information
              </CardTitle>
              <CardDescription>Final details to confirm your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="idNumber">Document ID Number</Label>
                <Input 
                  id="idNumber" 
                  value={formData.idNumber} 
                  onChange={e => setFormData({...formData, idNumber: e.target.value})}
                  placeholder="Enter PAN/Aadhaar number"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Full Residential Address</Label>
                <textarea 
                  id="address" 
                  className="w-full min-h-[100px] rounded-xl border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Complete address with PIN code"
                />
              </div>
              <Button 
                onClick={handleSubmitKYC} 
                disabled={loading || !formData.idNumber || !formData.address}
                className="w-full h-14 font-bold text-lg gap-2 mt-4 shadow-xl shadow-primary/20"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Submit for Verification'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
