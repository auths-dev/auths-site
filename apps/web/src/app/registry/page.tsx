import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegistryClient } from './registry-client';
import { RegistrySkeleton } from '@/components/registry-skeleton';
import { fetchRecentActivity } from '@/lib/api/registry';
import type { RecentActivity } from '@/lib/api/registry';

export const metadata: Metadata = {
  title: 'Public Registry',
  description:
    'Discover and verify software artifacts, repositories, and cryptographic identities in the Auths Web of Trust.',
};

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
    <Suspense fallback={<RegistrySkeleton />}>
      <RegistryClient initialQuery={q} initialActivity={activity} />
    </Suspense>
  );
}
