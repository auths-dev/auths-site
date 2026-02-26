import {
  LandingHero,
  LandingOnTheEdge,
  LandingInTheCloud,
  LandingStartBuilding,
  LandingIdentityTypes,
  LandingArchitecture,
  LandingFooter,
} from '@/components/landing-sections';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <LandingHero />

      <div className="mx-auto max-w-3xl px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <LandingOnTheEdge />

      <div className="mx-auto max-w-3xl px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <LandingInTheCloud />

      <div className="mx-auto max-w-3xl px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <LandingStartBuilding />

      <div className="mx-auto max-w-3xl px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <LandingIdentityTypes />

      <div className="mx-auto max-w-3xl px-6">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <LandingArchitecture />

      <LandingFooter />
    </main>
  );
}
