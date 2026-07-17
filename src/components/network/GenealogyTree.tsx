'use client';

import { useState } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  UserPlus, 
  ChevronRight, 
  ChevronDown, 
  MoreVertical,
  PlusCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  id: string;
  mode: 'sponsor' | 'placement';
  level: number;
}

function TreeNode({ id, mode, level }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const db = useFirestore();
  
  const distributorRef = useMemoFirebase(() => (
    db ? doc(db, 'distributors', id) : null
  ), [db, id]);
  
  const { data: node, loading } = useDoc(distributorRef);

  // For Sponsor mode, fetch all direct referrals
  const childrenQuery = useMemoFirebase(() => (
    db && mode === 'sponsor' ? query(collection(db, 'distributors'), where('sponsorId', '==', id)) : null
  ), [db, id, mode]);
  
  const { data: sponsorChildren } = useCollection(childrenQuery);

  if (loading) return <div className="p-4 animate-pulse bg-slate-100 rounded-xl w-64 h-32" />;
  if (!node) return null;

  return (
    <div className="flex flex-col items-center">
      <Card className={cn(
        "w-64 border-none shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl",
        node.status === 'inactive' ? 'opacity-60' : ''
      )}>
        <div className={cn("h-1.5 w-full", mode === 'placement' ? 'bg-primary' : 'bg-slate-900')} />
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
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <Badge variant="outline" className="text-[8px] font-bold h-5 uppercase">
              {node.rank}
            </Badge>
            {mode === 'placement' && (
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
            )}
          </div>
          
          {(mode === 'sponsor' && sponsorChildren && sponsorChildren.length > 0) || (mode === 'placement' && (node.leftChildId || node.rightChildId)) ? (
            <Button 
              variant="ghost" 
              className="w-full h-8 flex items-center justify-center gap-1 hover:bg-slate-50"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isExpanded ? 'Collapse' : 'Expand Downline'}
              </span>
            </Button>
          ) : (
            <div className="text-center py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-50 rounded-lg">
              No Downline
            </div>
          )}
        </CardContent>
      </Card>

      {isExpanded && (
        <div className="mt-8 flex gap-8 relative">
          {/* Connector lines - simplified for the pass */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-200" />
          
          {mode === 'sponsor' ? (
            sponsorChildren?.map((child: any) => (
              <TreeNode key={child.uid} id={child.uid} mode={mode} level={level + 1} />
            ))
          ) : (
            <>
              {node.leftChildId ? (
                <TreeNode id={node.leftChildId} mode={mode} level={level + 1} />
              ) : (
                <EmptyNode position="Left" />
              )}
              {node.rightChildId ? (
                <TreeNode id={node.rightChildId} mode={mode} level={level + 1} />
              ) : (
                <EmptyNode position="Right" />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyNode({ position }: { position: string }) {
  return (
    <Card className="w-64 border-2 border-dashed border-slate-200 bg-slate-50/50 shadow-none flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
        <PlusCircle className="w-6 h-6" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{position} Slot Open</p>
        <p className="text-[10px] text-slate-400">Invite someone to fill this leg</p>
      </div>
      <Button variant="outline" size="sm" className="h-9 font-bold text-[10px] uppercase gap-2">
        <UserPlus className="w-3 h-3" /> Copy Invite
      </Button>
    </Card>
  );
}

export function GenealogyTree({ rootId, mode }: { rootId: string; mode: 'sponsor' | 'placement' }) {
  return (
    <div className="p-8 overflow-x-auto">
      <div className="min-w-max flex justify-center pb-20">
        <TreeNode id={rootId} mode={mode} level={0} />
      </div>
    </div>
  );
}
