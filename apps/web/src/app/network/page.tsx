import type { Metadata } from 'next';
import Link from 'next/link';
import { NetworkMotionDiagram } from '@/components/network-motion-diagram';
import { NetworkQuorumSection } from '@/components/network-quorum-section';
import { NetworkConfigSection } from '@/components/network-config-section';

export const metadata: Metadata = {
  title: 'Auths Witness Network — Decentralized Transparency Quorums',
  description: 'Managed multi-region witness nodes co-signing Key Event Log (KEL) checkpoints and Merkle proofs.',
};

export default function NetworkPage() {
  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-seal/20 pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-6">
            [WITNESS-QUORUM] · DECENTRALIZED PROOFS
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-normal text-ink tracking-tight leading-tight">
            Auths Witness Network
          </h1>
          <p className="mt-4 font-mono text-sm text-seal-deep font-medium">
            Multi-Region Co-Signers & Merkle Transparency Trees
          </p>
          <p className="mt-6 text-base md:text-lg text-ink-soft leading-relaxed">
            Prevent split-brain attacks and silent key history rewrites. Managed witness nodes co-sign KEL sequence checkpoints and anchor Merkle inclusion proofs verifiable offline in browser WebAssembly.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="https://docs.auths.dev/"
              target="_blank"
              rel="noreferrer"
              className="bg-ink hover:bg-seal text-paper px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              Read Documentation
            </a>
            <a
              href="https://github.com/auths-dev/auths-network"
              target="_blank"
              rel="noreferrer"
              className="bg-paper-elevated border border-rule hover:border-ink-faint text-ink px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* 1. Interactive Protocol Motion Diagram */}
        <NetworkMotionDiagram />

        {/* 2. Anti-Equivocation Witness Quorum Section */}
        <NetworkQuorumSection />

        {/* 3. Tabbed Configuration & Annotated Parameter Cards */}
        <NetworkConfigSection />
      </div>
    </main>
  );
}
