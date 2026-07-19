import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CodeBlock } from '@auths/ledger-ui';
import { getActivitySnapshots, getListingBySlug, verifySpendCommand } from '@/lib/listings';
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

  const snapshots = await getActivitySnapshots(listing.id);
  const latest = snapshots.at(-1);
  const first = snapshots[0];
  const witnessed = latest && first
    ? { calls: latest.count - first.count, cents: latest.cumulative_cents - first.cumulative_cents }
    : { calls: 0, cents: 0 };
  const latestHead = latest?.head;

  return (
    <div className="px-6 pt-36 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            {listing.name}
          </h1>
          <ListingBadges
            listing={listing}
            anchor={
              latest
                ? {
                    tier: latest.anchor_tier,
                    threshold: latest.anchor_threshold,
                    witnesses: latest.anchor_witnesses,
                  }
                : null
            }
          />
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
            <p className="font-mono text-3xl text-ink">{witnessed.calls}</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
              witnessed calls · 30d
            </p>
          </div>
          <div>
            <p className="font-mono text-3xl text-ink">{cents(witnessed.cents)}</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
              witnessed settled · 30d
            </p>
          </div>
          <div>
            <p className="font-mono text-3xl text-ink">{latest ? cents(latest.cumulative_cents) : '—'}</p>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-wider text-ink-faint">
              attested lifetime
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl font-mono text-[12px] leading-5 text-ink-faint">
          {snapshots.length > 0
            ? `Signed activity attestation, verified against the seller's public identity registry (head ${latestHead?.slice(0, 12)}…). Growth figures count only what this market witnessed — never the seller's claim.${
                latest?.anchor_tier === 'witness' && latest.anchor_threshold && latest.anchor_witnesses
                  ? ` Latest observation carries a quorum anchor verified against ${latest.anchor_threshold} of ${latest.anchor_witnesses} declared witnesses.`
                  : ''
              }`
            : 'No attestation verified yet — figures appear once the receipts worker has checked the published activity.json.'}
        </p>

        <h2 className="mt-14 font-display text-2xl font-medium text-ink">Use it, bounded</h2>
        <div className="mt-5 max-w-3xl">
          <IntegrationPane listing={listing} />
        </div>

        <h2 className="mt-14 font-display text-2xl font-medium text-ink">Audit this yourself</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-soft">
          The seller publishes a signed activity attestation
          {listing.attestation_url ? (
            <>
              {' '}
              (<a href={listing.attestation_url} className="text-seal hover:text-seal-deep">
                activity.json
              </a>)
            </>
          ) : null}
          {' '}— an aggregate committing to its private per-call log without
          revealing any counterparty. A party who never called this endpoint can
          re-check the signature and the market-witnessed growth, trusting
          neither the seller nor us:
        </p>
        <div className="mt-4 max-w-3xl">
          <CodeBlock language="bash" code={verifySpendCommand(listing)} />
        </div>
      </div>
    </div>
  );
}
