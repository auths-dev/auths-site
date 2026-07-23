import type { Metadata } from 'next';
import Link from 'next/link';
import { SupplyChainMotionDiagram } from '@/components/supply-chain-motion-diagram';
import { SupplyChainHardwareSection } from '@/components/supply-chain-hardware-section';
import { SupplyChainConfigSection } from '@/components/supply-chain-config-section';

export const metadata: Metadata = {
  title: 'Auths Supply Chain Shield — Hardware Commit Signing & SLSA L3',
  description: 'Biometric Secure Enclave commit signing (P-256) and zero-CA automated CI/CD release verification.',
};

export default function SupplyChainPage() {
  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-seal/20 pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-6">
            [SUPPLY-CHAIN] · SLSA LEVEL 3
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-normal text-ink tracking-tight leading-tight">
            Auths Supply Chain Shield
          </h1>
          <p className="mt-4 font-mono text-sm text-seal-deep font-medium">
            Hardware-Backed Commit Signing & Zero-CA Automated Provenance
          </p>
          <p className="mt-6 text-base md:text-lg text-ink-soft leading-relaxed">
            Eliminate centralized Certificate Authorities. Sign developer commits with hardware keys (Secure Enclave P-256) and generate SLSA Level 3 release provenance verifiable 100% offline.
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
              href="https://github.com/auths-dev/auths"
              target="_blank"
              rel="noreferrer"
              className="bg-paper-elevated border border-rule hover:border-ink-faint text-ink px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>

        {/* 1. Interactive Protocol Motion Diagram */}
        <SupplyChainMotionDiagram />

        {/* 2. Secure Enclave P-256 Hardware Attestation */}
        <SupplyChainHardwareSection />

        {/* 3. Tabbed Configuration & Annotated Parameter Cards */}
        <SupplyChainConfigSection />
      </div>
    </main>
  );
}
