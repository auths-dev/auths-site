import { NextResponse, type NextRequest } from 'next/server';
import { getLiveListings, type Rail } from '@/lib/listings';

/** Public read: live listings. Stable v1 shape; no auth. */
export async function GET(request: NextRequest) {
  const rail = request.nextUrl.searchParams.get('rail');
  const railFilter = rail === 'x402' || rail === 'stripe' ? (rail as Rail) : undefined;
  const listings = await getLiveListings(railFilter);
  return NextResponse.json(
    {
      endpoints: listings.map((l) => ({
        slug: l.slug,
        name: l.name,
        description: l.description,
        price_cents: l.price_cents,
        rails: l.rails,
        tools: l.tools,
        verified_at: l.verified_at,
        live_proven_at: l.live_proven_at,
        verification_stale: l.verification_stale,
        receipts_invalid: l.receipts_invalid,
        url: `https://market.auths.dev/e/${l.slug}`,
      })),
    },
    { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
