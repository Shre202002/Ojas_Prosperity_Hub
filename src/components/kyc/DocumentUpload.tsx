'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, FileText, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { fileProblem } from '@/lib/kyc-rules';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  /** Selfie: photos only, front camera, round face guide. */
  variant?: 'document' | 'selfie';
  file: File | null;
  onFile: (file: File | null) => void;
};

/** Upload area for one KYC document: drag & drop, camera or file picker, instant validation, preview. */
export function DocumentUpload({ title, variant = 'document', file, onFile }: Props) {
  const id = useId();
  const selfie = variant === 'selfie';
  const accept = selfie ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf';
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accepts = (candidate: File | undefined | null) => {
    if (!candidate) return;
    const problem = fileProblem(candidate, selfie);
    setError(problem || '');
    if (!problem) onFile(candidate);
  };

  if (file) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className={cn('grid shrink-0 place-items-center overflow-hidden bg-muted', selfie ? 'h-20 w-20 rounded-full' : 'h-20 w-20 rounded-lg')}>
            {preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt={`${title} preview`} className="h-full w-full object-cover" /> : <FileText className="h-7 w-7 text-muted-foreground" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · uploaded to this device</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-semibold hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RefreshCw className="h-3.5 w-3.5" aria-hidden />Replace</button>
              <button type="button" onClick={() => { onFile(null); setError(''); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="h-3.5 w-3.5" aria-hidden />Remove</button>
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept={accept} className="sr-only" tabIndex={-1} onChange={(e) => { accepts(e.target.files?.[0]); e.target.value = ''; }} />
        {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); accepts(e.dataTransfer.files?.[0]); }}
        className={cn('rounded-2xl border-2 border-dashed p-5 text-center transition-colors duration-200', dragging ? 'border-primary bg-primary/10' : 'border-muted bg-background', error && 'border-destructive/50')}
      >
        <div className={cn('mx-auto grid place-items-center bg-primary/10 text-primary', selfie ? 'h-24 w-24 rounded-full' : 'h-12 w-12 rounded-xl')}>
          {selfie ? <Camera className="h-9 w-9" aria-hidden /> : <UploadCloud className="h-6 w-6" aria-hidden />}
        </div>
        <p className="mt-3 text-sm font-semibold">{selfie ? 'Take a clear photo of your face' : `Add your ${title.toLowerCase()}`}</p>
        <p className="mt-1 text-xs text-muted-foreground">{selfie ? 'JPG, PNG or WEBP · up to 8 MB' : 'Drag a file here, or choose one. JPG, PNG, WEBP or PDF · up to 8 MB'}</p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <label htmlFor={`${id}-camera`} className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Camera className="h-4 w-4" aria-hidden />Take photo
            <input ref={cameraRef} id={`${id}-camera`} type="file" accept="image/*" capture={selfie ? 'user' : 'environment'} className="sr-only" onChange={(e) => { accepts(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          <label htmlFor={`${id}-file`} className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-background px-5 text-sm font-semibold transition-colors hover:bg-secondary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <UploadCloud className="h-4 w-4" aria-hidden />Upload file
            <input id={`${id}-file`} type="file" accept={accept} className="sr-only" onChange={(e) => { accepts(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
      </div>
      {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
