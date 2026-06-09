
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PlusCircle, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Badge,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

const MOCK_TREE_DATA = {
  name: "Rajesh Kumar",
  id: "RAJ882",
  package: "Executive",
  rank: "Silver",
  left: {
    name: "Sunil Sharma",
    id: "SUN123",
    package: "Starter",
    rank: "Bronze",
    left: { name: "Amit G.", id: "AM99", package: "Executive", rank: "Star", left: null, right: null },
    right: { name: "Pooja V.", id: "PV22", package: "Starter", rank: "Star", left: null, right: null },
  },
  right: {
    name: "Anjali Gupta",
    id: "ANJ456",
    package: "Business",
    rank: "Bronze",
    left: { name: "Vikram S.", id: "VS01", package: "Business", rank: "Star", left: null, right: null },
    right: null,
  }
};

const Node = ({ data, level = 0 }: { data: any, level?: number }) => {
  if (!data) return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted flex items-center justify-center text-muted-foreground group cursor-pointer hover:border-primary transition-colors">
        <PlusCircle className="w-5 h-5" />
      </div>
      <div className="text-[10px] mt-1 text-muted-foreground uppercase">Empty</div>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <div className="flex flex-col items-center p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[140px] border-t-4 border-t-primary">
        <Avatar className="h-10 w-10 mb-2 border-2 border-primary/10">
          <AvatarImage src={`https://picsum.photos/seed/${data.id}/200`} />
          <AvatarFallback>{data.name[0]}</AvatarFallback>
        </Avatar>
        <div className="text-xs font-bold font-headline text-center truncate w-full">{data.name}</div>
        <div className="text-[10px] text-muted-foreground font-bold">{data.id}</div>
        <div className="mt-2 flex gap-1">
          <div className="bg-secondary/10 text-secondary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
            {data.rank}
          </div>
          <div className="bg-primary/10 text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
             {data.package}
          </div>
        </div>
      </div>

      <div className="flex gap-12 relative">
        {/* Connecting lines - simplistic conceptual representation */}
        {(data.left || data.right) && level < 2 && (
          <div className="absolute top-[-16px] left-1/2 w-full h-[2px] bg-border -translate-x-1/2 -z-10"></div>
        )}
        {level < 2 && (
          <>
            <Node data={data.left} level={level + 1} />
            <Node data={data.right} level={level + 1} />
          </>
        )}
      </div>
    </div>
  );
};

export default function TreePage() {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Binary Tree</h1>
          <p className="text-muted-foreground">Visualize your organizational structure and team growth.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z-10, 50))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="text-sm font-bold w-12 text-center">{zoom}%</div>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z+10, 150))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-8 bg-border mx-2"></div>
          <Button variant="outline" size="sm" className="gap-2">
            <Maximize className="w-4 h-4" /> Fullscreen
          </Button>
        </div>
      </div>

      <Card className="flex-1 bg-white border-none shadow-xl overflow-hidden relative flex flex-col">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span>Premium</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-muted border border-dashed"></div>
                <span>Vacant</span>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input 
                className="w-full bg-white border rounded-full pl-10 h-10 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
                placeholder="Find member..."
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-12 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
          <div className="flex justify-center transition-transform origin-top" style={{ transform: `scale(${zoom/100})` }}>
            <Node data={MOCK_TREE_DATA} />
          </div>
        </CardContent>
        
        {/* Floating Details Card */}
        <div className="absolute bottom-6 left-6 max-w-xs animate-in slide-in-from-bottom duration-500">
          <Card className="shadow-2xl border-primary/20 bg-white/90 backdrop-blur-md">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Info className="w-4 h-4" /> Team Statistics
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground uppercase tracking-wider mb-1">Left Total</div>
                  <div className="text-lg font-bold">1,450 BV</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase tracking-wider mb-1">Right Total</div>
                  <div className="text-lg font-bold">920 BV</div>
                </div>
              </div>
              <Button size="sm" className="w-full gap-2">
                Recalculate BV <ShieldCheck className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}
