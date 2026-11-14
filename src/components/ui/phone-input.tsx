'use client';

import * as React from 'react';
import PhoneInputBase from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Phone field with a country-code dropdown (India first). Typing "+44…" switches the country automatically. Value is E.164. */
export function PhoneInput({ id, value, onChange, className }: Props) {
  return (
    <PhoneInputBase
      id={id}
      international
      defaultCountry="IN"
      countryOptionsOrder={['IN', '|', '...']}
      value={value || undefined}
      onChange={(v) => onChange(v ?? '')}
      className={cn('sjapl-phone', className)}
      numberInputProps={{ className: 'sjapl-phone-input', suppressHydrationWarning: true }}
    />
  );
}
