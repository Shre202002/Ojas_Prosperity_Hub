'use client';

import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', label: 'অসমীয়া (Assamese)' },
  { code: 'ur', label: 'اردو (Urdu)' },
  { code: 'ne', label: 'नेपाली (Nepali)' },
];

function readLang() {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return match?.[1] || 'en';
}

// googtrans must be set on the host (and the bare domain on some setups) for the widget to pick it up.
function writeLang(code: string) {
  const host = location.hostname;
  const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
  const targets = [undefined, host, `.${host}`];
  for (const domain of targets) {
    const d = domain ? `; domain=${domain}` : '';
    document.cookie = code === 'en'
      ? `googtrans=; expires=${expire}; path=/${d}`
      : `googtrans=/en/${code}; path=/${d}`;
  }
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setLang] = useState('en');
  useEffect(() => { setLang(readLang()); }, []);

  return (
    <label className={cn('notranslate inline-flex items-center gap-1.5 text-sm text-foreground/80', className)} translate="no">
      <Languages className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">Language</span>
      <select
        value={lang}
        onChange={(e) => { writeLang(e.target.value); setLang(e.target.value); location.reload(); }}
        className="max-w-[9.5rem] cursor-pointer rounded-md border border-input bg-background py-1.5 pl-2 pr-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Choose language"
      >
        {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>
    </label>
  );
}
