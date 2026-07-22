/**
 * Pure projections from the internal `Listing` to the stable public v1 API
 * shape. Kept here (not inline in the route) so the machine-readable contract —
 * including the dormancy signals a programmatic buyer relies on — is unit-lockable.
 */

import type { Listing } from '@/lib/listings';

/** One row of the public `GET /api/v1/endpoints` list. */
export interface EndpointSummary {
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  rails: Listing['rails'];
  tools: Listing['tools'];
  verified_at: string | null;
  live_proven_at: string | null;
  dormant: boolean;
  last_growth_at: string | null;
  verification_stale: boolean;
  receipts_invalid: boolean;
  url: string;
}

/**
 * Project a listing into the public list-API row. Dormancy and last-growth are
 * first-class here so a machine consumer can see a listing has gone quiet.
 *
 * Args:
 * * `l`: the internal listing record.
 *
 * Usage:
 * ```ignore
 * const rows = listings.map(endpointSummary);
 * ```
 */
export function endpointSummary(l: Listing): EndpointSummary {
  return {
    slug: l.slug,
    name: l.name,
    description: l.description,
    price_cents: l.price_cents,
    rails: l.rails,
    tools: l.tools,
    verified_at: l.verified_at,
    live_proven_at: l.live_proven_at,
    dormant: l.dormant ?? false,
    last_growth_at: l.last_growth_at ?? null,
    verification_stale: l.verification_stale,
    receipts_invalid: l.receipts_invalid,
    url: `https://market.auths.dev/e/${l.slug}`,
  };
}
