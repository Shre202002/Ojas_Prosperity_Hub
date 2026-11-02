// Store details shown on the public website. Set them in .env (NEXT_PUBLIC_* so client components can read them);
// anything left empty is simply hidden from the UI, so no placeholder numbers ever appear on the live site.
const clean = (value?: string) => (value ?? '').trim();

/** Statutory "marketed by / manufactured by" lines shown on product pages (from the client's catalogue). */
export const COMPANY = {
  marketer: { name: 'Shri Jaya Ayur Neuro Private Limited', address: 'Enclave Kho, Nagoriyan, Dantli, Jaipur, Rajasthan 303012' },
  manufacturer: { name: 'Shri Amrit Herbals', address: 'H-1/2203 Ramchandrapura, Industrial Area, Ex. Sitapura, Jaipur, Rajasthan 302022' },
} as const;

export const SITE = {
  email: clean(process.env.NEXT_PUBLIC_STORE_EMAIL),
  phone: clean(process.env.NEXT_PUBLIC_STORE_PHONE),
  // Digits only, with country code, e.g. 919876543210
  whatsapp: clean(process.env.NEXT_PUBLIC_STORE_WHATSAPP).replace(/\D/g, ''),
  address: clean(process.env.NEXT_PUBLIC_STORE_ADDRESS),
  gstin: clean(process.env.NEXT_PUBLIC_STORE_GSTIN),
  hours: clean(process.env.NEXT_PUBLIC_STORE_HOURS),
  social: {
    instagram: clean(process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM),
    facebook: clean(process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK),
    youtube: clean(process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE),
  },
  // Policy defaults used in the draft legal pages. Confirm these with the business before launch.
  policy: {
    dispatchDays: '2 to 3 business days',
    deliveryDays: '5 to 10 business days',
    returnWindowDays: 7,
    lastUpdated: '1 November 2026',
  },
} as const;

/** Server-side destination for contact messages and order enquiries. */
export const storeInbox = () => clean(process.env.STORE_EMAIL) || SITE.email;

export const whatsappLink = (text: string) =>
  SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}` : '';
