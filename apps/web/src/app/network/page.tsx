import { constructMetadata } from '@/lib/metadata';
import {
  NetworkHero,
  NetworkStats,
  NetworkHowItWorks,
  NetworkValueProps,
  NetworkComparison,
  NetworkEcosystem,
  NetworkArchitecture,
  NetworkBottomCTA,
} from '@/components/network-sections';
import { LandingFooter } from '@/components/landing-sections';

export const metadata = constructMetadata({
  title: 'Network | Auths',
  description:
    'A public, cryptographic trust layer for software. Search identities, verify artifacts, prove provenance — no account required, no vendor lock-in, no cost.',
});

function Divider() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  );
}

export default function NetworkPage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <NetworkHero />
      <Divider />
      <NetworkStats />
      <Divider />
      <NetworkHowItWorks />
      <Divider />
      <NetworkValueProps />
      <Divider />
      <NetworkComparison />
      <Divider />
      <NetworkEcosystem />
      <Divider />
      <NetworkArchitecture />
      <Divider />
      <NetworkBottomCTA />
      <LandingFooter />
    </main>
  );
}
