'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const KYC_STEPS = ['ID proof', 'Address proof', 'Selfie', 'Review'] as const;

/** Progress through the KYC steps. Finished steps are buttons so a member can go back and fix something. */
export function KycStepper({ step, done, onGo }: { step: number; done: boolean[]; onGo: (step: number) => void }) {
  return (
    <nav aria-label="Verification progress">
      <p className="mb-3 text-sm font-semibold text-muted-foreground md:hidden" aria-live="polite">Step {step + 1} of {KYC_STEPS.length} · <span className="text-foreground">{KYC_STEPS[step]}</span></p>
      <ol className="flex items-center">
        {KYC_STEPS.map((label, i) => {
          const complete = done[i] && i < step;
          const current = i === step;
          const clickable = i < step;
          return (
            <li key={label} className={cn('flex items-center', i < KYC_STEPS.length - 1 && 'flex-1')}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onGo(i)}
                aria-current={current ? 'step' : undefined}
                className={cn('group flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', clickable ? 'cursor-pointer' : 'cursor-default')}
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors duration-200', complete ? 'border-primary bg-primary text-primary-foreground' : current ? 'border-primary bg-background text-primary' : 'border-muted bg-background text-muted-foreground')}>
                  {complete ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn('hidden text-sm font-semibold md:inline', current ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
              </button>
              {i < KYC_STEPS.length - 1 && <span aria-hidden className={cn('mx-2 h-0.5 flex-1 rounded transition-colors duration-200 md:mx-3', i < step ? 'bg-primary' : 'bg-muted')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
