import type { Metadata } from 'next';
import './globals.css';
import { Playfair_Display, JetBrains_Mono, DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/lib/app-auth';
import { Toaster } from '@/components/ui/toaster';
import { ReferralTracker } from '@/components/ReferralTracker';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'Direct Seller Portal',
  description: 'Premium Binary MLM Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased`}>
        <AuthProvider>
          <ReferralTracker />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
