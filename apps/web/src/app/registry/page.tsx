import { Suspense } from 'react';
import { RegistryClient } from './registry-client';
import { RegistrySkeleton } from '@/components/registry-skeleton';
import { fetchRecentActivity } from '@/lib/api/registry';
import type { RecentActivity } from '@/lib/api/registry';
import { constructMetadata } from '@/lib/metadata';

export const metadata = constructMetadata({
  title: 'Registry | Auths',
  description:
    'Verify software artifacts, cryptographic identities, and provenance on the Auths open verification network.',
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
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<RegistrySkeleton />}>
            <RegistryClient initialQuery={q} initialActivity={activity} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
