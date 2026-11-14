'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { CheckCircle2, FileText, RefreshCw, Trash2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  icon: LucideIcon;
  title: string;
  hint: string;
  accept: string;
  /** Opens the camera on phones (selfie). */
  capture?: 'user';
  file: File | null;
  onFile: (file: File | null) => void;
  /** File uploaded and every required detail entered. */
  complete: boolean;
  /** Detail fields; shown only once a file has been chosen. */
  children?: ReactNode;
};

/** One KYC document: big click target, preview, and (after upload) the details that belong to it. */
export function DocumentUpload({ icon: Icon, title, hint, accept, capture, file, onFile, complete, children }: Props) {
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const isImage = !!file && file.type.startsWith('image/');

  useEffect(() => {
    if (!file || !isImage) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <section className={cn('rounded-2xl border-2 p-4 transition-colors', complete ? 'border-primary/40 bg-primary/5' : file ? 'border-amber-300 bg-amber-50/50' : 'border-dashed border-muted bg-card')}>
      <div className="flex items-center gap-3">
        <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', complete ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground')}>
          {complete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{title} <span className="text-destructive" aria-label="required">*</span></p>
          <p className="text-xs font-medium text-muted-foreground">{complete ? 'Done ✓' : file ? 'Now fill in the details below' : hint}</p>
        </div>
      </div>

      {!file ? (
        <label htmlFor={inputId} className="mt-3 flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed border-primary/30 bg-background px-4 py-6 text-center transition-colors hover:bg-primary/5 focus-within:ring-2 focus-within:ring-primary/30">
          <span className="text-sm font-semibold text-primary">Tap to upload</span>
          <span className="text-xs text-muted-foreground">{accept.includes('pdf') ? 'JPG, PNG, WEBP or PDF · max 8 MB' : 'JPG, PNG or WEBP photo · max 8 MB'}</span>
          <input id={inputId} type="file" accept={accept} capture={capture} className="sr-only" onChange={(e) => onFile(e.target.files?.[0] || null)} />
        </label>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3 rounded-xl border bg-background p-2">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
              {preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt={`${title} preview`} className="h-full w-full object-cover" /> : <FileText className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <label htmlFor={inputId} className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary" title="Change file">
              <RefreshCw className="h-4 w-4" /><span className="sr-only">Change file</span>
              <input id={inputId} type="file" accept={accept} capture={capture} className="sr-only" onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
            </label>
            <button type="button" onClick={() => onFile(null)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Remove file"><Trash2 className="h-4 w-4" /><span className="sr-only">Remove file</span></button>
          </div>
          {children && <div className="mt-4 space-y-4">{children}</div>}
        </>
      )}
    </section>
  );
}
