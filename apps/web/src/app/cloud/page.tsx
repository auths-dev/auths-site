import { constructMetadata } from '@/lib/metadata';
import {
  CloudHero,
  CloudValueProps,
  CloudComparison,
  CloudEnterprise,
  CloudArchitectureDiagram,
  CloudBottomCTA,
} from '@/components/cloud-sections';
import { LandingFooter } from '@/components/landing-sections';

export const metadata = constructMetadata({
  title: 'Cloud | Auths',
  description:
    'Enterprise-grade software identity with zero infrastructure. Policy enforcement, IdP binding, audit trails — backed by cryptography, stored in Git.',
});

function Divider() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  );
}

export default function CloudPage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <CloudHero />
      <Divider />
      <CloudValueProps />
      <Divider />
      <CloudComparison />
      <Divider />
      <CloudEnterprise />
      <Divider />
      <CloudArchitectureDiagram />
      <Divider />
      <CloudBottomCTA />
      <LandingFooter />
    </main>
  );
}
