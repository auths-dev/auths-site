import { NextResponse } from 'next/server';
import { getActivitySnapshots, getListingBySlug } from '@/lib/listings';

/**
 * Public read: the market's own witnessing history of the listing's signed
 * activity attestation — coarse aggregates only, never per-call rows (the raw
 * log is private; the counterparty graph is never published).
 */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const l = await getListingBySlug(slug);
  if (!l || l.status !== 'live') {
    return NextResponse.json({ error: { code: 'not_found' } }, { status: 404 });
  }
  const snapshots = await getActivitySnapshots(l.id, 90);
  return NextResponse.json(
    {
      slug: l.slug,
      receipts_invalid: l.receipts_invalid,
      dormant: l.dormant ?? false,
      observations: snapshots.map((s) => ({
        observed_at: s.observed_at,
        head: s.head,
        count: s.count,
        cumulative_cents: s.cumulative_cents,
        as_of: s.as_of,
        anchor_tier: s.anchor_tier,
        anchor_threshold: s.anchor_threshold,
        anchor_witnesses: s.anchor_witnesses,
      })),
      note: 'signed activity/v1 aggregates verified against the seller public identity registry; growth is credited only when witnessed by this market across observations',
    },
    { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
