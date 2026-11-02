import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Lora, IBM_Plex_Mono, DM_Sans, Noto_Sans_Devanagari } from 'next/font/google';
import { AuthProvider } from '@/lib/app-auth';
import { Toaster } from '@/components/ui/toaster';
import { ReferralTracker } from '@/components/ReferralTracker';
import { BRAND } from '@/lib/brand';
import { CartProvider } from '@/lib/cart';

const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
const display = Lora({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const deva = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['500', '600'], variable: '--font-deva' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:9002'),
  title: { default: BRAND.name, template: `%s | ${BRAND.short}` },
  description: BRAND.description,
  icons: { icon: BRAND.logo, apple: BRAND.logo },
  openGraph: { type: 'website', siteName: BRAND.name, title: BRAND.name, description: BRAND.description, images: [BRAND.logo], locale: 'en_IN' },
  twitter: { card: 'summary', title: BRAND.name, description: BRAND.description, images: [BRAND.logo] },
};

export const viewport: Viewport = { themeColor: '#21c45d' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable} ${deva.variable} ${plexMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <CartProvider>
            <ReferralTracker />
            {children}
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
