'use client';

import { createContext, useContext, useEffect, useState, type CSSProperties } from 'react';
import { useFirestore, useDoc, useMemoFirebase, doc, getDoc } from '@/lib/app-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, ChevronDown, ChevronUp, PlusCircle, Crown, Link2, ShieldCheck, Shuffle, Minus, Plus, Maximize2, ChevronsDownUp, ChevronsUpDown, Users } from 'lucide-react';
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

// Expand-all / collapse-all is broadcast to every node; `tick` changes on each click so repeated clicks still apply.
const ExpandSignal = createContext<{ mode: 'expand' | 'collapse' | null; tick: number }>({ mode: null, tick: 0 });

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

const KYC_DOT: Record<string, string> = { verified: 'bg-emerald-500', rejected: 'bg-red-500' };

interface TreeNodeProps { id: string; level: number; unrestricted?: boolean; joinCodes?: JoinCodes }

function TreeNode({ id, level, unrestricted, joinCodes }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const signal = useContext(ExpandSignal);
  useEffect(() => {
    if (signal.mode) setIsExpanded(signal.mode === 'expand');
  }, [signal.tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const db = useFirestore();
  const { toast } = useToast();

  const distributorRef = useMemoFirebase(() => (db ? doc(db, 'distributors', id) : null), [db, id]);
  const { data: node, loading } = useDoc(distributorRef);
  const sponsor = useSponsor(node?.sponsorId);

  if (loading) return <li><div className="h-28 w-56 animate-pulse rounded-2xl bg-muted" /></li>;
  if (!node) return null;

  const source: Source = !node.sponsorId || node.rank === 'Admin' ? 'root' : sponsor?.rank === 'Admin' ? 'admin' : 'member';
  const meta = SOURCE[source];
  const spillover = Boolean(node.sponsorId && node.parentId && node.sponsorId !== node.parentId);
  const downline = Number(node.leftCount || 0) + Number(node.rightCount || 0);
  const hasChildren = Boolean(node.leftChildId || node.rightChildId);
  const kyc = String(node.kycStatus || 'none');

  // New members can only extend this member's own leg: left-leg members grow left, right-leg members grow right.
  const joinCode = node.leg === 'left' ? joinCodes?.left : node.leg === 'right' ? joinCodes?.right : undefined;
  const copyJoinLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${joinCode}&under=${node.uid}`);
    toast({ title: 'Join link copied', description: `New member will be placed on the ${node.leg} side below ${node.name}.` });
  };

  const style = { '--tree-line': `color-mix(in srgb, ${meta.color} 70%, transparent)`, '--gt-glow': meta.color } as CSSProperties;

  return (
    <li style={style}>
      <div
        className={cn('gt-card relative w-56 overflow-hidden rounded-2xl border bg-card shadow-sm', node.status === 'inactive' && 'opacity-60')}
        style={{ borderColor: `color-mix(in srgb, ${meta.color} 45%, transparent)` }}
      >
        <div className="h-1.5 w-full" style={{ background: meta.color }} />
        {unrestricted && <ShieldCheck className="absolute right-2 top-3 h-3 w-3 text-primary opacity-40" aria-hidden />}
        <div className="space-y-2.5 p-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 shrink-0" style={{ boxShadow: `0 0 0 2px ${meta.color}` }}>
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.uid}`} alt="" />
              <AvatarFallback>{node.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight" title={node.name}>{node.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {source === 'member' && sponsor?.name ? `Sponsor: ${sponsor.name}` : node.rank}
              </p>
            </div>
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', KYC_DOT[kyc] || 'bg-amber-500')} title={`KYC: ${kyc}`} aria-label={`KYC ${kyc}`} />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}>
              <meta.icon className="h-3 w-3" />{meta.label}
            </span>
            {spillover && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground" title="Placed below a different member than the sponsor"><Shuffle className="h-3 w-3" />Spillover</span>}
          </div>

          <div className="grid grid-cols-3 divide-x rounded-xl bg-muted/60 py-1.5 text-center">
            {[{ l: 'Left', v: node.leftCount || 0 }, { l: 'Right', v: node.rightCount || 0 }, { l: 'Team', v: downline }].map((c) => (
              <div key={c.l}><p className="text-[9px] font-medium uppercase text-muted-foreground">{c.l}</p><p className="font-mono-data text-xs font-bold">{c.v}</p></div>
            ))}
          </div>

          {(joinCode || hasChildren) && (
            <div className="flex items-center gap-2">
              {joinCode && (
                <button onClick={copyJoinLink} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-colors hover:bg-muted" title={`Copy ${node.leg} join link`}>
                  <UserPlus className="h-3.5 w-3.5" />Join link
                </button>
              )}
              {hasChildren && (
                <button onClick={() => setIsExpanded(!isExpanded)} aria-expanded={isExpanded} aria-label={isExpanded ? 'Collapse downline' : 'Expand downline'} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-colors" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {isExpanded ? 'Hide' : `+${downline || ''} Show`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <ul>
          {node.leftChildId ? <TreeNode id={node.leftChildId} level={level + 1} unrestricted={unrestricted} joinCodes={joinCodes} /> : <EmptyNode position="Left" />}
          {node.rightChildId ? <TreeNode id={node.rightChildId} level={level + 1} unrestricted={unrestricted} joinCodes={joinCodes} /> : <EmptyNode position="Right" />}
        </ul>
      )}
    </li>
  );
}

function EmptyNode({ position }: { position: string }) {
  return (
    <li>
      <div className="flex w-40 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-3 py-4 text-muted-foreground">
        <PlusCircle className="h-4 w-4 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{position} slot open</span>
      </div>
    </li>
  );
}

function ToolButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex h-8 items-center justify-center gap-1.5 rounded-lg border bg-card px-2.5 text-xs font-medium transition-colors hover:bg-muted">{children}</button>
  );
}

export function GenealogyTree({ rootId, unrestricted, joinCodes }: { rootId: string; unrestricted?: boolean; joinCodes?: JoinCodes }) {
  const [signal, setSignal] = useState<{ mode: 'expand' | 'collapse' | null; tick: number }>({ mode: null, tick: 0 });
  const [zoom, setZoom] = useState(1);
  const clamp = (n: number) => Math.min(1.4, Math.max(0.5, Math.round(n * 10) / 10));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <TreeLegend />
        <div className="flex items-center gap-2" role="toolbar" aria-label="Tree controls">
          <ToolButton onClick={() => setSignal((s) => ({ mode: 'expand', tick: s.tick + 1 }))} label="Expand all"><ChevronsUpDown className="h-3.5 w-3.5" /><span className="hidden sm:inline">Expand all</span></ToolButton>
          <ToolButton onClick={() => setSignal((s) => ({ mode: 'collapse', tick: s.tick + 1 }))} label="Collapse all"><ChevronsDownUp className="h-3.5 w-3.5" /><span className="hidden sm:inline">Collapse</span></ToolButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton onClick={() => setZoom((z) => clamp(z - 0.1))} label="Zoom out"><Minus className="h-3.5 w-3.5" /></ToolButton>
          <span className="w-10 text-center text-xs font-medium tabular-nums">{Math.round(zoom * 100)}%</span>
          <ToolButton onClick={() => setZoom((z) => clamp(z + 0.1))} label="Zoom in"><Plus className="h-3.5 w-3.5" /></ToolButton>
          <ToolButton onClick={() => setZoom(1)} label="Reset zoom"><Maximize2 className="h-3.5 w-3.5" /></ToolButton>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border bg-muted/30 p-4 sm:p-8" style={{ backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
        <ExpandSignal.Provider value={signal}>
          <div className="flex min-w-max justify-center pb-10" style={{ zoom } as CSSProperties}>
            <ul className="gt">
              <TreeNode id={rootId} level={0} unrestricted={unrestricted} joinCodes={joinCodes} />
            </ul>
          </div>
        </ExpandSignal.Provider>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Users className="h-3 w-3" />Click “Show” on a member to open their downline. Green dot = KYC verified, amber = pending, red = rejected.</p>
    </div>
  );
}
