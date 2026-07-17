import Link from 'next/link';
import { auth } from '@/lib/auth/supabase-github';
import { getSellerListings } from '@/lib/listings';
import { ListingBadges } from '@/components/badges';

export const metadata = { title: 'Dashboard' };

const STATUS_LABEL: Record<string, string> = {
  pending_verification: 'pending verification',
  live: 'live',
  failed: 'failed',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const seller = await auth.requireSeller();
  const { submitted } = await searchParams;
  const listings = await getSellerListings(seller.id);

  return (
    <section className="px-6 pt-36 pb-24">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Dashboard
        </p>
        <h1 className="mt-4 font-display text-4xl font-medium tracking-tight text-ink">
          {seller.githubLogin ? `@${seller.githubLogin}` : 'Your listings'}
        </h1>

        {submitted ? (
          <p className="mt-6 max-w-xl rounded-lg border border-seal/40 bg-seal/[0.06] p-4 text-sm leading-6 text-ink-soft">
            Submitted. The prober will make one test-mode call against your
            endpoint and re-derive your price from the published log; the
            listing goes live when it passes, and the result lands here
            either way.
          </p>
        ) : null}

        {listings.length === 0 && !submitted ? (
          <p className="mt-8 max-w-xl text-base leading-7 text-ink-soft">
            No listings yet.{' '}
            <Link href="/sell" className="text-seal hover:text-seal-deep">
              Sell your first endpoint
            </Link>
            .
          </p>
        ) : (
          <div className="mt-10 space-y-4">
            {listings.map((l) => (
              <div key={l.id} className="rounded-lg border border-rule p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-xl font-medium text-ink">{l.name}</span>
                    <span className="font-mono text-[13px] text-ink-faint">/e/{l.slug}</span>
                  </div>
                  <span
                    className={`font-mono text-[12px] ${l.status === 'failed' ? 'text-deny' : l.status === 'live' ? 'text-seal-deep' : 'text-ink-faint'}`}
                  >
                    {STATUS_LABEL[l.status]}
                  </span>
                </div>
                <div className="mt-3">
                  <ListingBadges listing={l} sellerAuthsRoot={seller.authsRoot} />
                </div>
                {l.status === 'failed' && l.fail_reason ? (
                  <p className="mt-3 rounded-md border border-deny/50 bg-deny/[0.06] p-3 font-mono text-[12px] leading-5 text-deny">
                    {l.fail_reason}
                  </p>
                ) : null}
                {l.status === 'live' ? (
                  <p className="mt-3 font-mono text-[12px] text-ink-faint">
                    Earnings render here once the receipts worker has
                    re-derived your published log (US-007/US-008).
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
