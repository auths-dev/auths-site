import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IdentityClient } from './identity-client';
import { IdentitySkeleton } from './identity-skeleton';
import { truncateMiddle } from '@/lib/format';

type Props = {
  params: Promise<{ did: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { did } = await params;
  const decoded = decodeURIComponent(did);
  const short = truncateMiddle(decoded, 32);

  return {
    title: `${short} | Auths Registry`,
    description: `Cryptographic identity profile for ${short} on the Auths Web of Trust.`,
  };
}

export default async function IdentityPage({ params }: Props) {
  const { did } = await params;
  const decoded = decodeURIComponent(did);

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      <Suspense fallback={<IdentitySkeleton />}>
        <IdentityClient did={decoded} />
      </Suspense>
    </div>
  );
}
