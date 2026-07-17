import type { Metadata } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SiteNav } from '@/components/site-nav';
import { LedgerFooter } from '@auths/ledger-ui';
import { MotionProvider } from '@auths/ledger-ui';
import { constructMetadata, SITE_TITLE } from '@/lib/metadata';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
});

export const metadata: Metadata = {
  ...constructMetadata(),
  title: {
    template: '%s | Auths',
    default: SITE_TITLE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} bg-paper text-ink antialiased selection:bg-seal/20`}
      >
        <MotionProvider>
          <SiteNav />
          <main>{children}</main>
          <LedgerFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
