'use client';

import { useState } from 'react';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase, doc, updateDoc, collection, query, where, serverTimestamp } from '@/lib/app-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  Search,
  MapPin,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function KYCReviewQueue() {
  const auth = useAuth();
  const { user } = useUser(auth);
  const db = useFirestore();
  const { toast } = useToast();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const submissionsQuery = useMemoFirebase(() => (
    db && user ? query(collection(db, 'kycSubmissions'), where('sponsorId', '==', user.uid)) : null
  ), [db, user?.uid]);
  
  const { data: submissions, loading } = useCollection(submissionsQuery, 'reviews');

  const pendingSubmissions = submissions?.filter(s => s.status === 'pending') || [];
  const historySubmissions = submissions?.filter(s => s.status !== 'pending') || [];

  async function handleKYCDecision(submissionId: string, status: 'verified' | 'rejected', reason?: string) {
    if (!db || !user) return;
    setProcessingId(submissionId);
    
    try {
      const submissionRef = doc(db, 'kycSubmissions', submissionId);
      await updateDoc(submissionRef, {
        status,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
        rejectionReason: reason || null
      });

      toast({
        title: `KYC ${status === 'verified' ? 'Approved' : 'Rejected'}`,
        description: 'The distributor has been notified of your decision.',
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: e.message });
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12 min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-muted">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold text-primary">Network KYC Reviews</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Clock className="w-4 h-4 text-[hsl(var(--status-pending))]" />
            Process identity verifications for your personally referred members.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID or Name..." 
            className="pl-12 h-14 rounded-2xl border-muted bg-background font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <h3 className="font-headline text-2xl font-bold text-primary flex items-center gap-3">
            Pending Approval
            <Badge className="bg-primary text-white font-mono-data rounded-full h-6 px-2">
              {pendingSubmissions.length}
            </Badge>
          </h3>
        </div>

        {pendingSubmissions.length === 0 ? (
          <Card className="border-none shadow-xl bg-white/50 p-20 text-center rounded-[2.5rem] border-2 border-dashed border-muted">
            <CardContent className="space-y-4">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-muted-foreground mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <p className="text-muted-foreground font-medium italic text-lg">Your verification queue is currently empty.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingSubmissions.map((sub) => (
              <Card key={sub.id} className="border border-muted shadow-xl rounded-[2.5rem] bg-white overflow-hidden group">
                <CardContent className="p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6 flex-1">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.distributorId}`} />
                      <AvatarFallback>DS</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-2xl font-headline font-bold text-foreground">Distributor #{sub.distributorId.slice(0, 8)}</h4>
                        <Badge variant="outline" className="font-mono-data text-[10px] tracking-widest text-muted-foreground border-muted">
                          SUBMITTED: {new Date(sub.submittedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground font-medium flex items-center gap-4">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> ID: {sub.idNumber}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" /> {sub.address.slice(0, 30)}...</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    <Button variant="outline" className="h-14 px-6 rounded-2xl gap-2 font-bold flex-1 lg:flex-none border-muted hover:bg-background">
                      <ExternalLink className="w-4 h-4" /> View Docs
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="h-14 px-6 rounded-2xl gap-2 font-bold flex-1 lg:flex-none shadow-lg shadow-destructive/20"
                      onClick={() => handleKYCDecision(sub.id, 'rejected', 'Documents are blurry or invalid.')}
                      disabled={processingId === sub.id}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                    <Button 
                      className="h-14 px-8 rounded-2xl gap-2 font-bold flex-1 lg:flex-none bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      onClick={() => handleKYCDecision(sub.id, 'verified')}
                      disabled={processingId === sub.id}
                    >
                      {processingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {historySubmissions.length > 0 && (
        <div className="space-y-6 pt-10 border-t border-muted">
          <h3 className="font-headline text-2xl font-bold text-primary px-4">Verification History</h3>
          <Card className="border border-muted shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-muted">
                {historySubmissions.map((sub) => (
                  <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-background transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-xl shadow-sm bg-background",
                        sub.status === 'verified' ? 'text-primary' : 'text-destructive'
                      )}>
                        {sub.status === 'verified' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Member ID: {sub.distributorId.slice(0, 10)}</p>
                        <p className="text-xs text-muted-foreground font-medium">Reviewed on {sub.reviewedAt?.toDate ? sub.reviewedAt.toDate().toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "font-bold uppercase tracking-widest text-[10px] px-3",
                      sub.status === 'verified' ? 'bg-primary text-white' : 'bg-destructive text-white'
                    )}>
                      {sub.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
