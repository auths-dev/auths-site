import { Suspense } from 'react';
import { constructMetadata } from '@/lib/metadata';
import { JoinClient } from './join-client';

export const metadata = constructMetadata({
  title: 'Join Organization | Auths',
  description: 'Accept an invitation to join an Auths organization.',
});

type Props = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <section className="pt-28 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-900" />}>
            <JoinClient code={code} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
