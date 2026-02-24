import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PackageClient } from './package-client';
import { PackageSkeleton } from './package-skeleton';

type Props = {
  params: Promise<{ ecosystem: string; name: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ecosystem, name } = await params;
  const packageName = name.map(decodeURIComponent).join('/');

  return {
    title: `${ecosystem}:${packageName} | Auths Registry`,
    description: `Supply chain provenance and cryptographic verification for ${ecosystem}:${packageName}.`,
  };
}

export default async function PackagePage({ params }: Props) {
  const { ecosystem, name } = await params;
  const packageName = name.map(decodeURIComponent).join('/');

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      <Suspense fallback={<PackageSkeleton />}>
        <PackageClient ecosystem={ecosystem} name={packageName} />
      </Suspense>
    </div>
  );
}
