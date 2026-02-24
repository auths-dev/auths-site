import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegistryClient } from './registry-client';
import { RegistrySkeleton } from '@/components/registry-skeleton';

export const metadata: Metadata = {
  title: 'Public Registry',
  description:
    'Discover and verify software artifacts, repositories, and cryptographic identities in the Auths Web of Trust.',
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RegistryPage({ searchParams }: Props) {
  const { q } = await searchParams;

  return (
    <Suspense fallback={<RegistrySkeleton />}>
      <RegistryClient initialQuery={q} />
    </Suspense>
  );
}
