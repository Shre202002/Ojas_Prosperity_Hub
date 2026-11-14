'use client';

import { useEffect, useState } from 'react';
import { FileText, Pencil } from 'lucide-react';

function Thumb({ file, round }: { file: File | null; round?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setUrl(null); return; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <span className={`grid h-14 w-14 shrink-0 place-items-center overflow-hidden bg-muted ${round ? 'rounded-full' : 'rounded-lg'}`}>
      {url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="" className="h-full w-full object-cover" /> : <FileText className="h-5 w-5 text-muted-foreground" aria-hidden />}
    </span>
  );
}

type Row = { title: string; file: File | null; lines: string[]; step: number; round?: boolean };

/** Summary of what will be sent. Each row links back to the step to fix it. Numbers are masked. */
export function KycReview({ rows, onEdit }: { rows: Row[]; onEdit: (step: number) => void }) {
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {rows.map((r) => (
        <li key={r.title} className="flex items-center gap-3 p-4">
          <Thumb file={r.file} round={r.round} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{r.title}</p>
            {r.lines.map((l) => <p key={l} className="truncate text-sm text-muted-foreground">{l}</p>)}
          </div>
          <button type="button" onClick={() => onEdit(r.step)} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Pencil className="h-4 w-4" aria-hidden />Edit<span className="sr-only"> {r.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
