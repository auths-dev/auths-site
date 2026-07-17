import { auth } from '@/lib/auth/supabase-github';

export const metadata = { title: 'Dashboard' };

/** Seller home. Placeholder until US-008 — proves the auth flow end to end. */
export default async function DashboardPage() {
  const seller = await auth.requireSeller();

  return (
    <section className="px-6 pt-40 pb-24">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Dashboard
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink">
          {seller.githubLogin ? `@${seller.githubLogin}` : 'Signed in.'}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-ink-soft">
          Your listings and re-derived earnings land here (US-008). Next step:
          list an endpoint from the Sell page.
        </p>
      </div>
    </section>
  );
}
