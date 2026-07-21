import type { Metadata } from 'next';
import { Fraunces, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LedgerFooter, MotionProvider } from '@auths/ledger-ui';
import { ExplorerNav } from '@/components/explorer-nav';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
});

const TITLE = 'Auths Explorer — the witness network, verified in your browser';
const DESC =
  'A sigstore-style lens over the Auths witness network. The server only fetches bytes; the verifier recomputes every SAID, chain, and receipt quorum in your browser before anything renders as valid.';

export const metadata: Metadata = {
  metadataBase: new URL('https://explorer.auths.dev'),
  title: { template: '%s | Auths Explorer', default: TITLE },
  description: DESC,
  openGraph: { title: TITLE, description: DESC, siteName: 'Auths Explorer', type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} bg-paper text-ink antialiased selection:bg-seal/20`}
      >
        <MotionProvider>
          <ExplorerNav />
          <main>{children}</main>
          <LedgerFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
