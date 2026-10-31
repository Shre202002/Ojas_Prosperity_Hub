'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, doc } from '@/lib/app-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  UserPlus, 
  ChevronRight, 
  ChevronDown, 
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Admin referral codes per leg; when set, each member gets a "join under" link.
type JoinCodes = { left?: string; right?: string };

interface TreeNodeProps {
  id: string;
  level: number;
  unrestricted?: boolean;
  joinCodes?: JoinCodes;
}

function TreeNode({ id, level, unrestricted, joinCodes }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const db = useFirestore();
  const { toast } = useToast();
  
  const distributorRef = useMemoFirebase(() => (
    db ? doc(db, 'distributors', id) : null
  ), [db, id]);
  
  const { data: node, loading } = useDoc(distributorRef);

  if (loading) return <div className="p-4 animate-pulse bg-muted rounded-xl w-64 h-32" />;
  if (!node) return null;

  // New members can only extend this member's own leg: left-leg members grow left, right-leg members grow right.
  const joinCode = node.leg === 'left' ? joinCodes?.left : node.leg === 'right' ? joinCodes?.right : undefined;
  const copyJoinLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${joinCode}&under=${node.uid}`);
    toast({ title: 'Join link copied', description: `New member will be placed on the ${node.leg} side below ${node.name}.` });
  };

  return (
    <div className="flex flex-col items-center">
      <Card className={cn(
        "w-64 border-none shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl relative",
        node.status === 'inactive' ? 'opacity-60' : '',
        node.kycStatus === 'verified' ? 'ring-2 ring-emerald-400' : node.kycStatus === 'rejected' ? 'ring-2 ring-red-400' : 'ring-2 ring-amber-300'
      )}>
        {unrestricted && <ShieldCheck className="absolute top-2 right-2 w-3 h-3 text-primary opacity-50" />}
        <div className="h-1.5 w-full bg-primary" />
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.uid}`} />
              <AvatarFallback>{node.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{node.name}</p>
              <p className="text-[10px] font-mono-data text-muted-foreground uppercase">{node.uid.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-1 items-center">
              <Badge variant="outline" className="text-[8px] font-bold h-5 uppercase">{node.rank}</Badge>
              <Badge className={cn("text-[8px] font-bold h-5 uppercase text-white", node.kycStatus === 'verified' ? 'bg-emerald-600' : node.kycStatus === 'rejected' ? 'bg-red-600' : 'bg-amber-500')}>{node.kycStatus || 'not submitted'}</Badge>
            </div>
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-[8px] font-bold text-muted-foreground uppercase">L</p>
                <p className="text-[10px] font-mono-data font-bold">{node.leftCount || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-bold text-muted-foreground uppercase">R</p>
                <p className="text-[10px] font-mono-data font-bold">{node.rightCount || 0}</p>
              </div>
            </div>
          </div>

          {joinCode && (
            <Button variant="outline" className="w-full h-8 gap-1 text-[10px] font-bold uppercase tracking-wider" onClick={copyJoinLink}>
              <UserPlus className="w-3 h-3" /> Copy {node.leg} join link
            </Button>
          )}
          
          {node.leftChildId || node.rightChildId ? (
            <Button 
              variant="ghost" 
              className="w-full h-8 flex items-center justify-center gap-1 hover:bg-muted"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isExpanded ? 'Collapse' : 'Expand Downline'}
              </span>
            </Button>
          ) : (
            <div className="text-center py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted rounded-lg">
              No Downline
            </div>
          )}
        </CardContent>
      </Card>

      {isExpanded && (
        <div className="mt-8 flex gap-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-200" />
          
          {node.leftChildId ? (
            <TreeNode id={node.leftChildId} level={level + 1} unrestricted={unrestricted} joinCodes={joinCodes} />
          ) : (
            <EmptyNode position="Left" />
          )}
          {node.rightChildId ? (
            <TreeNode id={node.rightChildId} level={level + 1} unrestricted={unrestricted} joinCodes={joinCodes} />
          ) : (
            <EmptyNode position="Right" />
          )}
        </div>
      )}
    </div>
  );
}

function EmptyNode({ position }: { position: string }) {
  return (
    <Card className="w-64 border-2 border-dashed border-border bg-muted shadow-none flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
        <PlusCircle className="w-6 h-6" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{position} Slot Open</p>
        <p className="text-[10px] text-muted-foreground">Invite someone to fill this leg</p>
      </div>
    </Card>
  );
}

export function GenealogyTree({ rootId, unrestricted, joinCodes }: { rootId: string; unrestricted?: boolean; joinCodes?: JoinCodes }) {
  return (
    <div className="p-8 overflow-x-auto">
      <div className="min-w-max flex justify-center pb-20">
        <TreeNode id={rootId} level={0} unrestricted={unrestricted} joinCodes={joinCodes} />
      </div>
    </div>
  );
}
