import { NextResponse } from 'next/server';
import { getListingBySlug, getReceiptSummaries } from '@/lib/listings';

/** Public read: re-derived day buckets + the command to reproduce them. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const l = await getListingBySlug(slug);
  if (!l || l.status !== 'live') {
    return NextResponse.json({ error: { code: 'not_found' } }, { status: 404 });
  }
  const summaries = await getReceiptSummaries(l.id, 90);
  return NextResponse.json(
    {
      slug: l.slug,
      receipts_invalid: l.receipts_invalid,
      days: summaries.map((s) => ({
        day: s.day,
        calls: s.calls,
        refused: s.refused,
        cents_settled: s.cents_settled,
        log_hash: s.log_hash,
      })),
      note: 'every figure re-derived via verify-spend from the seller-published log named by log_hash',
    },
    { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
