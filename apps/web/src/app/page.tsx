import {
  LandingHero,
  LandingOnTheEdge,
  LandingInTheCloud,
  LandingStartBuilding,
  LandingIdentityTypes,
  LandingArchitecture,
  LandingTechStack,
  LandingBottomCTA,
  LandingFooter,
} from '@/components/landing-sections';

function Divider() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <LandingHero />
      <Divider />
      <LandingOnTheEdge />
      <Divider />
      <LandingInTheCloud />
      <Divider />
      <LandingStartBuilding />
      <Divider />
      <LandingIdentityTypes />
      <Divider />
      <LandingArchitecture />
      <Divider />
      <LandingTechStack />
      <Divider />
      <LandingBottomCTA />
      <LandingFooter />
    </main>
  );
}
