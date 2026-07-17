import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/supabase-github';

async function signInAction() {
  'use server';
  const h = await headers();
  const origin = h.get('origin') ?? 'https://market.auths.dev';
  const url = await auth.signIn(`${origin}/auth/callback`);
  redirect(url);
}

export const metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth.getSession();
  if (session) redirect('/dashboard');

  return (
    <section className="px-6 pt-40 pb-24">
      <div className="mx-auto max-w-md">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Sellers
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink">
          Sign in to list an endpoint.
        </h1>
        <p className="mt-4 text-base leading-7 text-ink-soft">
          Buyers never need an account — listings and receipts are public.
          Selling starts with GitHub; proving your auths identity later
          upgrades your badge tier.
        </p>

        {error ? (
          <p className="mt-6 rounded-lg border border-deny/50 bg-deny/[0.06] p-3 font-mono text-sm text-deny">
            Sign-in failed — try again.
          </p>
        ) : null}

        <form action={signInAction} className="mt-8">
          <button
            type="submit"
            className="rounded-sm bg-seal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-seal-deep"
          >
            Continue with GitHub
          </button>
        </form>
      </div>
    </section>
  );
}
