import type { Metadata } from 'next';
import Link from 'next/link';
import { IamMotionDiagram } from '@/components/iam-motion-diagram';
import { IamBiometricSection } from '@/components/iam-biometric-section';
import { IamConfigSection } from '@/components/iam-config-section';

export const metadata: Metadata = {
  title: 'Auths Zero-Trust Developer IAM — Biometric Passkey & Presentation Suite',
  description: 'Passwordless presentation challenges for SSH terminal logins, Kubernetes kubectl, and AWS CLI.',
};

export default function IamPage() {
  return (
    <main className="min-h-screen bg-paper text-ink selection:bg-seal/20 pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-3.5 py-1 font-mono text-[11px] uppercase tracking-wider font-bold text-seal bg-seal/10 border border-seal/20 rounded-full mb-6">
            [PASSKEY-IAM] · BIOMETRIC SUITE
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-normal text-ink tracking-tight leading-tight">
            Auths Developer IAM
          </h1>
          <p className="mt-4 font-mono text-sm text-seal-deep font-medium">
            Passwordless Biometric Presentation Authentication for Infrastructure
          </p>
          <p className="mt-6 text-base md:text-lg text-ink-soft leading-relaxed">
            Replace static SSH keys, static tokens, and password databases. Authenticate infrastructure access via hardware Touch ID presentation challenges verifiable offline without central identity issuers.
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
        <IamMotionDiagram />

        {/* 2. Zero Static Secrets & Touch ID IAM Section */}
        <IamBiometricSection />

        {/* 3. Tabbed Configuration & Annotated Parameter Cards */}
        <IamConfigSection />
      </div>
    </main>
  );
}
