'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, RefreshCw, SwitchCamera, UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  /** Which camera to prefer: `user` is the front camera (selfie), `environment` the back camera (documents). */
  facing: 'user' | 'environment';
  label: string;
  onCapture: (file: File) => void;
  onClose: () => void;
  /** Lets the member give up on the camera and pick a file instead. */
  onUseFile: () => void;
};

function describeError(error: any): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'The camera only works on a secure (HTTPS) page.';
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError': return 'Camera access is blocked. Allow the camera in your browser’s address bar, then tap Try again.';
    case 'NotFoundError':
    case 'OverconstrainedError': return 'No camera was found on this device.';
    case 'NotReadableError':
    case 'AbortError': return 'The camera is being used by another app. Close it and tap Try again.';
    default: return 'We could not start the camera.';
  }
}

/** In-page camera: live preview, capture, retake, then hands back a JPEG File like any picked file. */
export function CameraCapture({ open, facing, label, onCapture, onClose, onUseFile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<'starting' | 'live' | 'captured' | 'error'>('starting');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [side, setSide] = useState<'user' | 'environment'>(facing);
  const [canSwitch, setCanSwitch] = useState(false);
  const [still, setStill] = useState<{ blob: Blob; url: string } | null>(null);
  const selfie = side === 'user';

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => { if (open) { setSide(facing); setStill(null); setAttempt((n) => n + 1); } }, [open, facing]);

  // Start (or restart) the camera whenever the dialog opens, the side changes, or the member retries.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setMode('starting'); setError('');
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('unsupported'), { name: 'NotFoundError' });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: side }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) { video.srcObject = stream; await video.play().catch(() => undefined); }
        navigator.mediaDevices.enumerateDevices().then((d) => { if (!cancelled) setCanSwitch(d.filter((x) => x.kind === 'videoinput').length > 1); }).catch(() => undefined);
        setMode('live');
      } catch (e: any) {
        if (cancelled) return;
        setError(describeError(e)); setMode('error');
      }
    })();
    return () => { cancelled = true; stopStream(); };
  }, [open, side, attempt, stopStream]);

  useEffect(() => () => { if (still) URL.revokeObjectURL(still.url); }, [still]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0); // saved image is never mirrored
    canvas.toBlob((blob) => {
      if (!blob) { setError('Could not capture the photo. Please try again.'); setMode('error'); return; }
      stopStream(); // camera light off while reviewing
      setStill({ blob, url: URL.createObjectURL(blob) });
      setMode('captured');
    }, 'image/jpeg', 0.92);
  };

  const use = () => {
    if (!still) return;
    onCapture(new File([still.blob], `${selfie ? 'selfie' : 'document'}-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    onClose();
  };

  const retake = () => { setStill(null); setAttempt((n) => n + 1); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg gap-4 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Take your {label}</DialogTitle>
          <DialogDescription>{selfie ? 'Face the light and look straight at the camera.' : 'Fit the whole document inside the frame and hold steady.'}</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${selfie ? '[transform:scaleX(-1)]' : ''} ${mode === 'live' ? '' : 'invisible'}`} />
          {mode === 'captured' && still && /* eslint-disable-next-line @next/next/no-img-element */ <img src={still.url} alt="Captured photo" className="absolute inset-0 h-full w-full object-cover" />}
          {mode === 'live' && (selfie
            ? <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-[78%] aspect-[3/4] rounded-[50%] border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" /></div>
            : <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center"><div className="h-[72%] w-[86%] rounded-xl border-2 border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" /></div>)}
          {mode === 'starting' && <div className="absolute inset-0 grid place-items-center text-white" role="status"><Loader2 className="h-8 w-8 animate-spin" aria-label="Starting camera" /></div>}
          {mode === 'error' && (
            <div role="alert" className="absolute inset-0 grid place-items-center bg-background p-6 text-center">
              <div className="space-y-3">
                <Camera className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {mode === 'live' && (
            <>
              <Button type="button" onClick={capture} className="h-12 min-w-40 gap-2 rounded-xl font-semibold"><Camera className="h-5 w-5" aria-hidden />Capture</Button>
              {canSwitch && <Button type="button" variant="outline" onClick={() => setSide(side === 'user' ? 'environment' : 'user')} className="h-12 gap-2 rounded-xl"><SwitchCamera className="h-4 w-4" aria-hidden />Switch camera</Button>}
            </>
          )}
          {mode === 'captured' && (
            <>
              <Button type="button" onClick={use} className="h-12 min-w-40 gap-2 rounded-xl font-semibold"><Check className="h-5 w-5" aria-hidden />Use photo</Button>
              <Button type="button" variant="outline" onClick={retake} className="h-12 gap-2 rounded-xl"><RefreshCw className="h-4 w-4" aria-hidden />Retake</Button>
            </>
          )}
          {mode === 'error' && (
            <>
              <Button type="button" onClick={() => setAttempt((n) => n + 1)} className="h-12 gap-2 rounded-xl"><RefreshCw className="h-4 w-4" aria-hidden />Try again</Button>
              <Button type="button" variant="outline" onClick={() => { onClose(); onUseFile(); }} className="h-12 gap-2 rounded-xl"><UploadCloud className="h-4 w-4" aria-hidden />Upload a file instead</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
