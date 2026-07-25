'use client';

import { useState } from 'react';
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
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
  Loader2,
  Filter,
  User,
  Users,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminKYCReviewHub() {
  const db = useFirestore();
  const auth = useAuth();
  const { user } = useUser(auth);
  const { toast } = useToast();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'sponsor'>('all');

  const submissionsQuery = useMemoFirebase(() => (
    db ? query(collection(db, 'kycSubmissions'), orderBy('submittedAt', 'desc')) : null
  ), [db]);
  
  const { data: submissions, loading } = useCollection(submissionsQuery, 'kyc (admin)');

  const filteredSubmissions = submissions?.filter(s => {
    const matchesSearch = s.distributorId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.idNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || s.reviewerType === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const pendingItems = filteredSubmissions.filter(s => s.status === 'pending');
  const historyItems = filteredSubmissions.filter(s => s.status !== 'pending');

  async function handleKYCDecision(submissionId: string, distributorId: string, status: 'verified' | 'rejected', reason?: string) {
    if (!db || !user) return;
    setProcessingId(submissionId);
    
    try {
      // 1. Update KYC Submission
      const submissionRef = doc(db, 'kycSubmissions', submissionId);
      await updateDoc(submissionRef, {
        status,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
        rejectionReason: reason || null
      });

      // 2. Update Distributor Status
      const distRef = doc(db, 'distributors', distributorId);
      await updateDoc(distRef, {
        kycStatus: status,
        updatedAt: serverTimestamp()
      });

      toast({
        title: `KYC ${status === 'verified' ? 'Approved' : 'Rejected'}`,
        description: `Member ${distributorId.slice(0, 8)} has been updated.`,
      });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Action failed', description: e.message });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-4xl font-headline font-bold">Global KYC Review Hub</h1>
          <p className="text-slate-400 max-w-lg font-medium">
            Manage priority individual verifications and perform spot-audits on sponsor-reviewed accounts.
          </p>
        </div>

        <div className="relative w-full md:w-96 relative z-10">
          <Search className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
          <Input 
            placeholder="Search by ID or Document..." 
            className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <div className="h-1.5 w-full bg-primary" />
          <CardContent className="p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Admin Review</p>
            <p className="text-3xl font-mono-data font-bold mt-1">
              {submissions?.filter(s => s.status === 'pending' && s.reviewerType === 'admin').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <div className="h-1.5 w-full bg-secondary" />
          <CardContent className="p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sponsor Review Pending</p>
            <p className="text-3xl font-mono-data font-bold mt-1">
              {submissions?.filter(s => s.status === 'pending' && s.reviewerType === 'sponsor').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-white overflow-hidden">
           <div className="h-1.5 w-full bg-slate-900" />
          <CardContent className="p-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Today</p>
            <p className="text-3xl font-mono-data font-bold mt-1">
              {submissions?.filter(s => s.status === 'verified').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-white p-1 rounded-2xl shadow-sm h-14 border">
            <TabsTrigger value="pending" className="px-10 h-full rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
              <Clock className="w-4 h-4 mr-2" /> Pending Approval
            </TabsTrigger>
            <TabsTrigger value="history" className="px-10 h-full rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold transition-all">
              <ShieldCheck className="w-4 h-4 mr-2" /> Audit History
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="bg-transparent text-sm font-bold outline-none cursor-pointer"
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
            >
              <option value="all">All Submission Types</option>
              <option value="admin">Individuals (Priority)</option>
              <option value="sponsor">Sponsor Assisted</option>
            </select>
          </div>
        </div>

        <TabsContent value="pending" className="animate-in fade-in duration-500">
          {loading ? (
            <div className="flex items-center justify-center p-20">
               <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : pendingItems.length === 0 ? (
            <Card className="border-none shadow-xl bg-white/50 p-20 text-center rounded-[2.5rem] border-2 border-dashed border-muted">
              <p className="text-muted-foreground font-medium italic text-lg">No pending KYC verifications found.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingItems.map((sub) => (
                <Card key={sub.id} className="border border-muted shadow-xl rounded-[2.5rem] bg-white overflow-hidden group">
                  <CardContent className="p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6 flex-1">
                      <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.distributorId}`} />
                        <AvatarFallback>DS</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-headline font-bold text-foreground">Member #{sub.distributorId.slice(0, 8)}</h4>
                          {sub.reviewerType === 'admin' ? (
                            <Badge className="bg-primary text-white font-bold text-[10px] gap-1">
                              <User className="w-3 h-3" /> INDIVIDUAL ROOT
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-bold text-[10px] gap-1">
                              <Users className="w-3 h-3" /> SPONSOR REFERRAL
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground font-medium flex items-center gap-4">
                          <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> ID: {sub.idNumber}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" /> {sub.address.slice(0, 30)}...</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                          Submitted: {new Date(sub.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <Button variant="outline" className="h-14 px-6 rounded-2xl gap-2 font-bold border-muted hover:bg-background">
                        <ExternalLink className="w-4 h-4" /> View Docs
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="h-14 px-6 rounded-2xl gap-2 font-bold shadow-lg shadow-destructive/20"
                        onClick={() => handleKYCDecision(sub.id, sub.distributorId, 'rejected', 'Documents are blurry or invalid.')}
                        disabled={processingId === sub.id}
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </Button>
                      <Button 
                        className="h-14 px-8 rounded-2xl gap-2 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                        onClick={() => handleKYCDecision(sub.id, sub.distributorId, 'verified')}
                        disabled={processingId === sub.id}
                      >
                        {processingId === sub.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Verify Member
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in duration-500">
          <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
            <CardContent className="p-0">
              <div className="divide-y divide-muted">
                {historyItems.map((sub) => (
                  <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-6">
                       <Avatar className="h-12 w-12 border shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.distributorId}`} />
                        <AvatarFallback>DS</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">Member ID: {sub.distributorId.slice(0, 10)}</p>
                          <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest">{sub.reviewerType}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Reviewed by {sub.reviewedBy === user?.uid ? 'You' : sub.reviewedBy} on {sub.reviewedAt?.toDate ? sub.reviewedAt.toDate().toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       {sub.status === 'rejected' && (
                         <div className="text-right hidden md:block">
                           <p className="text-[10px] font-bold text-destructive uppercase tracking-widest">Reason</p>
                           <p className="text-xs text-muted-foreground">{sub.rejectionReason}</p>
                         </div>
                       )}
                       <Badge className={cn(
                        "font-bold uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-full",
                        sub.status === 'verified' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-destructive text-white shadow-lg shadow-destructive/20'
                      )}>
                        {sub.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
