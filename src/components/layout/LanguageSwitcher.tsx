'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  const choose = (code: string) => { if (code === lang) return; writeLang(code); setLang(code); location.reload(); };

  return (
    <div className={cn('notranslate', className)} translate="no">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Choose language"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-background px-3 text-xs font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Languages className="h-4 w-4" aria-hidden />
          <span>{current.label.split(' ')[0]}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="notranslate max-h-72 w-48 overflow-y-auto rounded-xl" translate="no">
          {LANGUAGES.map((l) => (
            <DropdownMenuItem key={l.code} onSelect={() => choose(l.code)} className="cursor-pointer justify-between text-sm">
              {l.label}
              {l.code === lang && <Check className="h-4 w-4 text-primary" aria-hidden />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
