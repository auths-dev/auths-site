import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * The market's watcher feed (network Epic I3): its own append-only witnessing
 * observations across every live listing, as one public surface. The market is
 * exactly the "honest watcher" the threat model wants more of — this feed is
 * what it saw and when, so anyone can hold the market to its own record.
 *
 * Coarse aggregates only, the standing privacy contract: no per-call rows, no
 * counterparties. Reads run under the anon client, so RLS decides visibility —
 * observations surface only for listings the public can already see.
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

interface ObservationRow {
  observed_at: string;
  head: string;
  count: number;
  cumulative_cents: number;
  as_of: string;
  anchor_tier: string;
  anchor_threshold: number | null;
  anchor_witnesses: number | null;
  listings: { slug: string; name: string };
}

export async function GET(req: Request) {
  const requested = Number(new URL(req.url).searchParams.get('limit'));
  const limit = Number.isInteger(requested) && requested > 0
    ? Math.min(requested, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const supabase = await createSupabaseServerClient();
  const [{ data: rows, error }, observationsTotal, listingsWatched] = await Promise.all([
    supabase
      .from('attestation_checkpoints')
      .select(
        'observed_at, head, count, cumulative_cents, as_of, anchor_tier, anchor_threshold, anchor_witnesses, listings!inner(slug, name)',
      )
      .order('observed_at', { ascending: false })
      .limit(limit),
    supabase.from('attestation_checkpoints').select('*', { count: 'exact', head: true }),
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live')
      .not('attestation_url', 'is', null),
  ]);
  if (error) {
    return NextResponse.json({ error: { code: 'query_failed' } }, { status: 500 });
  }

  return NextResponse.json(
    {
      watcher: 'market.auths.dev',
      totals: {
        listings_watched: listingsWatched.count ?? 0,
        observations: observationsTotal.count ?? 0,
      },
      observations: ((rows ?? []) as unknown as ObservationRow[]).map((r) => ({
        listing: r.listings.slug,
        name: r.listings.name,
        observed_at: r.observed_at,
        head: r.head,
        count: r.count,
        cumulative_cents: r.cumulative_cents,
        as_of: r.as_of,
        anchor_tier: r.anchor_tier,
        anchor_threshold: r.anchor_threshold,
        anchor_witnesses: r.anchor_witnesses,
      })),
      note: 'the market’s own witnessing record: signed activity/v1 aggregates verified against each seller’s public identity registry; anchor_tier is derived from verification (witness = embedded quorum anchor re-checked), never from a seller claim',
    },
    { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
