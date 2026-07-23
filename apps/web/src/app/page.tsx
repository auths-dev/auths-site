import type { Metadata } from 'next';
import { PlatformHero } from '@/components/home/platform-hero';
import { ProductMatrix } from '@/components/home/product-matrix';
import {
  LedgerAudit,
  LedgerBound,
  LedgerWrap,
  LedgerRevoke,
  LedgerHowItWorks,
  LedgerRotation,
  LedgerCTA,
} from '@/components/landing-ledger';

export const metadata: Metadata = {
  title: 'Auths — Decentralized Identity for AI Agents, Supply Chains & Developers',
  description: 'Cryptographic commit signing, agent spend governance, and zero-trust verification powered by Git and WebAssembly. No central authority required.',
  openGraph: {
    title: 'Auths — Decentralized Cryptographic Proof Platform',
    description: 'No CA. No central server. Just Git and cryptography.',
  },
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-paper text-ink selection:bg-seal/20 overflow-hidden">
      {/* 1. Platform Vision Hero */}
      <PlatformHero />

      {/* 2. Commercial Product Suite Matrix */}
      <ProductMatrix />

      {/* 3. Deep Technical Proof & Protocol Explanation */}
      <LedgerAudit />
      <LedgerBound />
      <LedgerWrap />
      <LedgerRevoke />
      <LedgerHowItWorks />
      <LedgerRotation />
      <LedgerCTA />
    </main>
  );
}
