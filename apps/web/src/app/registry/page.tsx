import { Suspense } from 'react';
import { RegistryClient } from './registry-client';
import { RegistrySkeleton } from '@/components/registry-skeleton';
import { fetchRecentActivity } from '@/lib/api/registry';
import type { RecentActivity } from '@/lib/api/registry';
import { constructMetadata } from '@/lib/metadata';

export const metadata = constructMetadata({
  title: 'Public Registry | Auths',
  description:
    'Discover and verify software artifacts and cryptographic identities on the Auths Web of Trust.',
});

type Props = {
  searchParams: Promise<{ q?: string }>;
};

async function getRecentActivity(): Promise<RecentActivity | null> {
  try {
    return await fetchRecentActivity();
  } catch {
    return null;
  }
}

export default async function RegistryPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const activity = q ? null : await getRecentActivity();

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <section className="pt-28 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center mb-8">
            <h1 className="text-base font-semibold leading-7 text-emerald-400">
              Your Developer Passport
            </h1>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl font-mono">
              Build trust across the web.
            </p>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Verify your identity across GitHub, GitLab, NPM, and AI Agents.
              Prove exactly who you are and what you&apos;ve built, backed by
              permanent, decentralized cryptography.
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-md">
              <Suspense fallback={<RegistrySkeleton />}>
                <RegistryClient initialQuery={q} initialActivity={activity} />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
