import { siteImage } from './site-images';

export const BRAND = {
  name: 'Shri Jaya Ayur Neuro',
  short: 'SJAPL',
  legalName: 'Shri Jaya Ayur Neuro Pvt Ltd',
  tagline: 'आरोग्यं परमं सुखम्',
  taglineEn: 'Health is the Supreme Happiness',
  description:
    'Shri Jaya Ayur Neuro (SJAPL): authentic Ayurvedic and neuro-wellness products, with a rewarding binary network for our members.',
  logo: siteImage('/assets/logo.jpeg') as string,
  // Storage/runtime identifiers
  sessionKey: 'sjapl_session_token',
  referralPrefix: 'SJAPL',
} as const;
