import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrgClient } from './org-client';
import { OrgSkeleton } from './org-skeleton';
import { truncateMiddle } from '@/lib/format';
import { constructMetadata } from '@/lib/metadata';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://auths.dev';

type Props = {
  params: Promise<{ did: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { did } = await params;
  const decoded = decodeURIComponent(did);
  const short = truncateMiddle(decoded, 32);

  const ogImage = `${BASE_URL}/api/og?title=${encodeURIComponent(short)}&subtitle=${encodeURIComponent('Organization · Auths Registry')}`;

  return constructMetadata({
    title: `${short} | Org · Auths Registry`,
    description: `Organization profile for ${short} on the Auths Web of Trust.`,
    image: ogImage,
  });
}

export default async function OrgPage({ params }: Props) {
  const { did } = await params;
  const decoded = decodeURIComponent(did);

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-20">
      <Suspense fallback={<OrgSkeleton />}>
        <OrgClient did={decoded} />
      </Suspense>
    </div>
  );
}
