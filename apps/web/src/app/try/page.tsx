import { Suspense } from 'react';
import { constructMetadata } from '@/lib/metadata';
import { TryClient } from './try-client';

export const metadata = constructMetadata({
  title: 'Onboarding | Auths',
  description:
    'Get started with Auths in minutes. Set up your cryptographic identity or onboard your organization.',
});

type Props = {
  searchParams: Promise<{ flow?: string; redirect?: string }>;
};

export default async function TryPage({ searchParams }: Props) {
  const { flow, redirect } = await searchParams;

  const validFlow = flow === 'individual' || flow === 'org' ? flow : undefined;
  const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : undefined;

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30">
      <section className="pt-28 pb-24 px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-zinc-900" />}>
            <TryClient initialFlow={validFlow} redirectTo={safeRedirect} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
