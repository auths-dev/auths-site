import type { Metadata } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LedgerFooter, MotionProvider } from '@auths/ledger-ui';
import { MarketNav } from '@/components/market-nav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
});

const TITLE = 'Auths Market — sell tool calls. Buy them bounded.';
const DESC =
  'Paid MCP endpoints with proven prices: sellers meter per call over Stripe or x402, buying agents pay under a hard budget, and growth is credited only when this market witnesses it.';

export const metadata: Metadata = {
  metadataBase: new URL('https://market.auths.dev'),
  title: { template: '%s | Auths Market', default: TITLE },
  description: DESC,
  openGraph: { title: TITLE, description: DESC, siteName: 'Auths Market', type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} bg-paper text-ink antialiased selection:bg-seal/20`}
      >
        <MotionProvider>
          <MarketNav />
          <main>{children}</main>
          <LedgerFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
