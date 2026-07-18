import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CodeBlock } from '@auths/ledger-ui';
import { getListingBySlug, getReceiptSummaries, verifySpendCommand } from '@/lib/listings';
import { ListingBadges } from '@/components/badges';
import { IntegrationPane } from '@/components/integration-pane';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: 'Not found' };
  return {
    title: listing.name,
    description: `${listing.description} · $${(listing.price_cents / 100).toFixed(2)}/call on ${listing.rails.join(' + ')}`,
  };
}

function cents(c: number): string {
  return `$${(c / 100).toFixed(2)}`;
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const summaries = await getReceiptSummaries(listing.id);
  const totals = summaries.reduce(
    (acc, s) => ({
      calls: acc.calls + s.calls,
      refused: acc.refused + s.refused,
      cents: acc.cents + s.cents_settled,
    }),
    { calls: 0, refused: 0, cents: 0 },
  );
  const latestHash = summaries.at(-1)?.log_hash;

  return (
    <div className="px-6 pt-36 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            {listing.name}
          </h1>
          <ListingBadges listing={listing} />
        </div>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-ink-soft">{listing.description}</p>
        <p className="mt-4 font-mono text-sm text-ink">
          {cents(listing.price_cents)}/call
          <span className="text-ink-faint"> · {listing.rails.join(' + ')}</span>
          {listing.docs_url ? (
            <>
              <span className="text-ink-faint"> · </span>
              <a href={listing.docs_url} className="text-seal hover:text-seal-deep">
                docs
              </a>
            </>
          ) : null}
        </p>

        <h2 className="mt-14 font-display text-2xl font-medium text-ink">Tools</h2>
        <table className="mt-4 w-full max-w-2xl text-left text-sm">
          <tbody>
            {listing.tools.map((t) => (
              <tr key={t.name} className="border-b border-rule last:border-0">
                <td className="py-2.5 pr-4 font-mono text-ink">{t.name}</td>
                <td className="py-2.5 text-ink-soft">{t.description ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-14 font-display text-2xl font-medium text-ink">
          Receipts — re-derived, not reported
        </h2>
        <div className="mt-5 grid max-w-3xl gap-8 sm:grid-cols-3">
          <div>
            <p className="font-mono text-3xl text-ink">{totals.calls}</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
              calls · 30d
            </p>
          </div>
          <div>
            <p className="font-mono text-3xl text-ink">{cents(totals.cents)}</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
              settled · 30d
            </p>
          </div>
          <div>
            <p className="font-mono text-3xl text-ink">{totals.refused}</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
              refusals · 30d
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl font-mono text-[12px] leading-5 text-ink-faint">
          {summaries.length > 0
            ? `Every figure re-derived via verify-spend from the seller's published log (hash ${latestHash?.slice(0, 12)}…).`
            : 'No receipts re-derived yet — figures appear once the receipts worker has verified the published log.'}
        </p>

        <h2 className="mt-14 font-display text-2xl font-medium text-ink">Use it, bounded</h2>
        <div className="mt-5 max-w-3xl">
          <IntegrationPane listing={listing} />
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium text-ink">Audit this yourself</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">
          The receipts are signed and the log is public
          {listing.spend_log_url ? (
            <>
              {' '}
              (<a href={listing.spend_log_url} className="text-seal hover:text-seal-deep">
                spend log
              </a>)
            </>
          ) : null}
          . A party who never called this endpoint can re-derive everything
          above — offline, without trusting the seller or us:
        </p>
        <div className="mt-4 max-w-3xl">
          <CodeBlock language="bash" code={verifySpendCommand(listing)} />
        </div>
      </div>
    </div>
  );
}
