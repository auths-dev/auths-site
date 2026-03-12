import { constructMetadata } from '@/lib/metadata';
import { LandingFooter } from '@/components/landing-sections';
import { PricingTiers } from './pricing-tiers';

export const metadata = constructMetadata({
  title: 'Pricing | Auths Cloud',
  description:
    'Simple, transparent pricing for Auths Cloud. Free for individuals, powerful for teams, customizable for enterprise.',
});

function Divider() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  );
}

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <PricingTiers />
      <Divider />
      <LandingFooter />
    </main>
  );
}
