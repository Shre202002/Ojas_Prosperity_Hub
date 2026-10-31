import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Cormorant_Garamond, JetBrains_Mono, DM_Sans, Noto_Sans_Devanagari } from 'next/font/google';
import { AuthProvider } from '@/lib/app-auth';
import { Toaster } from '@/components/ui/toaster';
import { ReferralTracker } from '@/components/ReferralTracker';
import { BRAND } from '@/lib/brand';

const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' });
const display = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const deva = Noto_Sans_Devanagari({ subsets: ['devanagari'], weight: ['500', '600'], variable: '--font-deva' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s | ${BRAND.short}` },
  description: BRAND.description,
  icons: { icon: BRAND.logo, apple: BRAND.logo },
  openGraph: { title: BRAND.name, description: BRAND.description, images: [BRAND.logo] },
};

export const viewport: Viewport = { themeColor: '#274E37' };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable} ${deva.variable} ${jetbrains.variable} font-sans antialiased`}>
        <AuthProvider>
          <ReferralTracker />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
