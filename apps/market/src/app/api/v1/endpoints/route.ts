import { NextResponse, type NextRequest } from 'next/server';
import { getLiveListings, type Rail } from '@/lib/listings';
import { endpointSummary } from '@/lib/public-shape';

/** Public read: live listings. Stable v1 shape; no auth. */
export async function GET(request: NextRequest) {
  const rail = request.nextUrl.searchParams.get('rail');
  const railFilter = rail === 'x402' || rail === 'stripe' ? (rail as Rail) : undefined;
  const listings = await getLiveListings(railFilter);
  return NextResponse.json(
    {
      endpoints: listings.map(endpointSummary),
    },
    { headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
