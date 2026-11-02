'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, doc, getDoc } from '@/lib/app-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, ChevronRight, ChevronDown, PlusCircle, ShieldCheck, Crown, Link2, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Admin referral codes per leg; when set, each member gets a "join under" link.
type JoinCodes = { left?: string; right?: string };

/** How a member joined: with the Admin's link, with another member's link, or as a root (no sponsor). */
type Source = 'admin' | 'member' | 'root';

const SOURCE: Record<Source, { label: string; legend: string; color: string; icon: typeof Crown }> = {
  admin: { label: 'Admin link', legend: 'Added via Admin link', color: 'var(--tree-admin)', icon: Crown },
  member: { label: 'Member link', legend: "Added via a member's referral link", color: 'var(--tree-member)', icon: Link2 },
  root: { label: 'Root', legend: 'Root / Admin', color: 'var(--tree-root)', icon: ShieldCheck },
};

// One lookup per sponsor for the lifetime of the page, however many members they sponsored.
const sponsorCache = new Map<string, Promise<any | null>>();
function loadSponsor(id: string) {
  if (!sponsorCache.has(id)) {
    sponsorCache.set(id, getDoc(doc({}, 'distributors', id)).then((r) => (r.exists() ? r.data() : null)).catch(() => { sponsorCache.delete(id); return null; }));
  }
  return sponsorCache.get(id)!;
}

function useSponsor(sponsorId?: string | null) {
  const [sponsor, setSponsor] = useState<any | null>(null);
  useEffect(() => {
    let live = true;
    if (!sponsorId) { setSponsor(null); return; }
    loadSponsor(sponsorId).then((s) => { if (live) setSponsor(s); });
    return () => { live = false; };
  }, [sponsorId]);
  return sponsor;
}

export function TreeLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-xs', className)} aria-label="Tree colour legend">
      {(Object.keys(SOURCE) as Source[]).map((key) => (
        <span key={key} className="flex items-center gap-2 font-medium">
          <i className="h-3 w-3 rounded-full" style={{ background: SOURCE[key].color }} />
          {SOURCE[key].legend}
        </span>
      ))}
      <span className="flex items-center gap-2 font-medium text-muted-foreground"><Shuffle className="h-3.5 w-3.5" />Placed under a different member than the sponsor</span>
    </div>
  );
}

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

  const distributorRef = useMemoFirebase(() => (db ? doc(db, 'distributors', id) : null), [db, id]);
  const { data: node, loading } = useDoc(distributorRef);
  const sponsor = useSponsor(node?.sponsorId);

  if (loading) return <div className="h-32 w-64 animate-pulse rounded-xl bg-muted" />;
  if (!node) return null;

  const source: Source = !node.sponsorId || node.rank === 'Admin' ? 'root' : sponsor?.rank === 'Admin' ? 'admin' : 'member';
  const meta = SOURCE[source];
  const spillover = Boolean(node.sponsorId && node.parentId && node.sponsorId !== node.parentId);

  // New members can only extend this member's own leg: left-leg members grow left, right-leg members grow right.
  const joinCode = node.leg === 'left' ? joinCodes?.left : node.leg === 'right' ? joinCodes?.right : undefined;
  const copyJoinLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${joinCode}&under=${node.uid}`);
    toast({ title: 'Join link copied', description: `New member will be placed on the ${node.leg} side below ${node.name}.` });
  };

  return (
    <div className="flex flex-col items-center">
      <Card
        className={cn('relative w-64 overflow-hidden border shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl', node.status === 'inactive' && 'opacity-60')}
        style={{ borderColor: `color-mix(in srgb, ${meta.color} 55%, transparent)` }}
      >
        {unrestricted && <ShieldCheck className="absolute right-2 top-3 h-3 w-3 text-primary opacity-50" />}
        <div className="h-1.5 w-full" style={{ background: meta.color }} />
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10" style={{ boxShadow: `0 0 0 2px ${meta.color}` }}>
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.uid}`} />
              <AvatarFallback>{node.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{node.name}</p>
              <p className="font-mono-data text-[10px] uppercase text-muted-foreground">{node.uid.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${meta.color} 18%, transparent)`, color: meta.color }}>
              <meta.icon className="h-3 w-3" />{meta.label}
            </span>
            {source === 'member' && sponsor?.name && <span className="max-w-[110px] truncate text-[10px] text-muted-foreground" title={`Sponsor: ${sponsor.name}`}>by {sponsor.name}</span>}
            {spillover && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground" title="Placed below a different member than the sponsor"><Shuffle className="h-3 w-3" />Spillover</span>}
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="h-5 text-[8px] font-bold uppercase">{node.rank}</Badge>
              <Badge className={cn('h-5 text-[8px] font-bold uppercase text-white', node.kycStatus === 'verified' ? 'bg-emerald-600' : node.kycStatus === 'rejected' ? 'bg-red-600' : 'bg-amber-500')}>KYC: {node.kycStatus || 'none'}</Badge>
            </div>
            <div className="flex gap-3">
              <div className="text-center"><p className="text-[8px] font-bold uppercase text-muted-foreground">L</p><p className="font-mono-data text-[10px] font-bold">{node.leftCount || 0}</p></div>
              <div className="text-center"><p className="text-[8px] font-bold uppercase text-muted-foreground">R</p><p className="font-mono-data text-[10px] font-bold">{node.rightCount || 0}</p></div>
            </div>
          </div>

          {joinCode && (
            <Button variant="outline" className="h-8 w-full gap-1 text-[10px] font-bold uppercase tracking-wider" onClick={copyJoinLink}>
              <UserPlus className="h-3 w-3" /> Copy {node.leg} join link
            </Button>
          )}

          {node.leftChildId || node.rightChildId ? (
            <Button variant="ghost" className="flex h-8 w-full items-center justify-center gap-1 hover:bg-muted" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">{isExpanded ? 'Collapse' : 'Expand Downline'}</span>
            </Button>
          ) : (
            <div className="rounded-lg bg-muted py-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">No Downline</div>
          )}
        </CardContent>
      </Card>

      {isExpanded && (
        <div className="relative mt-8 flex gap-8">
          <div className="absolute left-1/2 top-0 h-8 w-px -translate-x-1/2 bg-border" />
          {node.leftChildId ? <TreeNode id={node.leftChildId} level={level + 1} unrestricted={unrestricted} joinCodes={joinCodes} /> : <EmptyNode position="Left" />}
          {node.rightChildId ? <TreeNode id={node.rightChildId} level={level + 1} unrestricted={unrestricted} joinCodes={joinCodes} /> : <EmptyNode position="Right" />}
        </div>
      )}
    </div>
  );
}

function EmptyNode({ position }: { position: string }) {
  return (
    <Card className="flex w-64 flex-col items-center justify-center space-y-4 border-2 border-dashed border-border bg-muted/50 p-8 shadow-none">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-primary shadow-sm"><PlusCircle className="h-6 w-6" /></div>
      <div className="space-y-1 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{position} Slot Open</p>
        <p className="text-[10px] text-muted-foreground">Invite someone to fill this leg</p>
      </div>
    </Card>
  );
}

export function GenealogyTree({ rootId, unrestricted, joinCodes }: { rootId: string; unrestricted?: boolean; joinCodes?: JoinCodes }) {
  return (
    <div className="p-4 sm:p-8">
      <TreeLegend className="mb-6" />
      <div className="overflow-x-auto">
        <div className="flex min-w-max justify-center pb-20">
          <TreeNode id={rootId} level={0} unrestricted={unrestricted} joinCodes={joinCodes} />
        </div>
      </div>
    </div>
  );
}
