'use client';

import { Check, Lock, X } from 'lucide-react';

type Tips = { need: string; dos: string[]; donts: string[] };

const TIPS: Tips[] = [
  { need: 'One government photo ID: PAN, Aadhaar, Passport, Voter ID or Driving Licence.', dos: ['All four corners visible', 'Text sharp and readable', 'Good light, no glare'], donts: ['Cropped or folded edges', 'Blurry or dark photos', 'Photos of a screen'] },
  { need: 'A document that shows your current address, such as Aadhaar, a recent utility bill or bank statement.', dos: ['Name and full address visible', 'Bill or statement under 3 months old', 'Whole page in the frame'], donts: ['Hidden or covered details', 'Expired or old documents', 'Edited or filtered images'] },
  { need: 'A live photo of your face taken now. It is matched against your ID.', dos: ['Face the light, look at the camera', 'Face fully visible', 'Plain background'], donts: ['Sunglasses, cap or mask', 'Filters or group photos', 'Photo of another photo'] },
  { need: 'Check everything once. You can go back and edit any step.', dos: ['Numbers match the documents', 'Address matches the proof'], donts: [] },
];

function List({ items, good }: { items: string[]; good: boolean }) {
  if (!items.length) return null;
  const Icon = good ? Check : X;
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-sm">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${good ? 'text-primary' : 'text-destructive'}`} aria-hidden />
          <span className={good ? '' : 'text-muted-foreground'}>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Body({ step }: { step: number }) {
  const tips = TIPS[step];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{tips.need}</p>
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">Do</p>
        <List items={tips.dos} good />
      </div>
      {tips.donts.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-destructive">Avoid</p>
          <List items={tips.donts} good={false} />
        </div>
      )}
    </div>
  );
}

/** Guidance for the current step: a sticky side panel on desktop, a collapsible section on mobile. */
export function KycTips({ step }: { step: number }) {
  return (
    <>
      <details className="group rounded-2xl border bg-card md:hidden" open={step === 0}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          What you need for this step
          <span aria-hidden className="text-muted-foreground transition-transform duration-200 group-open:rotate-180">⌄</span>
        </summary>
        <div className="border-t px-4 py-4"><Body step={step} /></div>
      </details>

      <aside className="sticky top-6 hidden space-y-5 rounded-2xl border bg-card p-5 md:block" aria-label="Tips for this step">
        <h2 className="font-headline text-lg font-bold">What you need</h2>
        <Body step={step} />
        <p className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          Your documents are encrypted and seen only by the verification team. We never share them.
        </p>
      </aside>
    </>
  );
}
