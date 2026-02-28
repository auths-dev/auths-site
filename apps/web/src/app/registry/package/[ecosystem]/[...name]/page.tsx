import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PackageClient } from './package-client';
import { PackageSkeleton } from './package-skeleton';
import { constructMetadata } from '@/lib/metadata';
import { SoftwareAppJsonLd } from '@/components/json-ld';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://auths.dev';

type Props = {
  params: Promise<{ ecosystem: string; name: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ecosystem, name } = await params;
  const packageName = name.map(decodeURIComponent).join('/');
  const label = `${ecosystem}:${packageName}`;

  const ogImage = `${BASE_URL}/api/og?title=${encodeURIComponent(label)}&subtitle=${encodeURIComponent('Supply chain provenance · Auths Registry')}&status=verified`;

  return constructMetadata({
    title: `${label} | Auths Registry`,
    description: `Supply chain provenance and cryptographic verification for ${label}.`,
    image: ogImage,
  });
}

export default async function PackagePage({ params }: Props) {
  const { ecosystem, name } = await params;
  const packageName = name.map(decodeURIComponent).join('/');

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      <SoftwareAppJsonLd name={packageName} ecosystem={ecosystem} />
      <Suspense fallback={<PackageSkeleton />}>
        <PackageClient ecosystem={ecosystem} name={packageName} />
      </Suspense>
    </div>
  );
}
