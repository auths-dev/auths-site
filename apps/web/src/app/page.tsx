import { Suspense } from 'react';
import { Hero } from '@/components/hero';
import { RegistryClient } from '@/app/registry/registry-client';
import { RegistrySkeleton } from '@/components/registry-skeleton';
import { fetchRecentActivity } from '@/lib/api/registry';
import type { RecentActivity } from '@/lib/api/registry';

async function getRecentActivity(): Promise<RecentActivity | null> {
  try {
    return await fetchRecentActivity();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const activity = await getRecentActivity();

  return (
    <main className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      {/* Simple, clean dark background */}

      {/* =========================================
          SECTION 1: THE PUBLIC REGISTRY 
          ========================================= */}
      <section 
        id="registry" 
        className="relative z-10 scroll-mt-24 pt-24 pb-24"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          {/* Marketing Framing: Product first, cryptography as subtext */}
          <div className="mx-auto max-w-2xl text-center mb-8">
            <h2 className="text-base font-semibold leading-7 text-emerald-400">
              Your Developer Passport
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl font-mono">
              Build trust across the web.
            </p>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Verify your identity across GitHub, GitLab, NPM, and AI Agents. Prove exactly who you are and what you've built, backed by permanent, decentralized cryptography.
            </p>
          </div>

          {/* Clean, 2-Layer Container: Just a simple border and translucent backdrop */}
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-md">
              <Suspense fallback={<RegistrySkeleton />}>
                <RegistryClient initialActivity={activity} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle Visual Divider */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
         <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      </div>

      {/* =========================================
          SECTION 2: ZERO-TRUST VERIFICATION 
          ========================================= */}
      <section 
        id="verify" 
        className="relative z-10 scroll-mt-0 py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          
          {/* Marketing Framing: Deduplicated from the Hero component */}
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-blue-400">
              Local WASM Engine
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl font-mono">
              Don't trust. Verify.
            </p>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Drop an artifact hash below. Our in-browser WebAssembly engine reconstructs the cryptographic chain of trust without ever pinging a server.
            </p>
          </div>

          {/* Clean, 2-Layer Container */}
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-md">
              <Hero />
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}