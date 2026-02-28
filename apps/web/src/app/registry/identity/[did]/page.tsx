import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IdentityClient } from './identity-client';
import { IdentitySkeleton } from './identity-skeleton';
import { truncateMiddle } from '@/lib/format';
import { constructMetadata } from '@/lib/metadata';
import { ProfilePageJsonLd } from '@/components/json-ld';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://auths.dev';

type Props = {
  params: Promise<{ did: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { did } = await params;
  const decoded = decodeURIComponent(did);
  const short = truncateMiddle(decoded, 32);

  const ogImage = `${BASE_URL}/api/og?title=${encodeURIComponent(short)}&subtitle=${encodeURIComponent('Cryptographic Identity · Auths Registry')}`;

  return constructMetadata({
    title: `${short} | Auths Registry`,
    description: `Cryptographic identity profile for ${short} on the Auths Web of Trust.`,
    image: ogImage,
  });
}

export default async function IdentityPage({ params }: Props) {
  const { did } = await params;
  const decoded = decodeURIComponent(did);
  const profileUrl = `${BASE_URL}/registry/identity/${did}`;

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      <ProfilePageJsonLd did={decoded} url={profileUrl} />
      <Suspense fallback={<IdentitySkeleton />}>
        <IdentityClient did={decoded} />
      </Suspense>
    </div>
  );
}
