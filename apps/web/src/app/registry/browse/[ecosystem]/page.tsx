import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BrowseClient } from './browse-client';

interface Props {
  params: Promise<{ ecosystem: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ecosystem } = await params;
  return {
    title: `Browse ${ecosystem} packages — Auths Registry`,
    description: `Browse all claimed ${ecosystem} packages on the Auths decentralized identity registry.`,
  };
}

export default async function BrowsePage({ params }: Props) {
  const { ecosystem } = await params;
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Suspense
        fallback={
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-zinc-900/50" />
            ))}
          </div>
        }
      >
        <BrowseClient ecosystem={ecosystem} />
      </Suspense>
    </main>
  );
}
