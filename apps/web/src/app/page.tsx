import {
  LandingHero,
  LandingPillars,
  LandingTechStack,
} from '@/components/landing-sections';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <LandingHero />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <LandingPillars />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      <LandingTechStack />
    </main>
  );
}
