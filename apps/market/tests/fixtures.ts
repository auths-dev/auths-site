import type { ActivitySnapshot, Listing } from '@/lib/listings';

/** A fully-populated live listing; override only the fields under test. */
export function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    seller_id: 'seller-1',
    slug: 'demo',
    name: 'Demo Endpoint',
    description: 'A demo paid endpoint.',
    tools: [{ name: 'search' }],
    price_cents: 3,
    rails: ['x402'],
    endpoint: { transport: 'url', url: 'https://x.example/mcp' },
    attestation_url: 'https://x.example/activity.json',
    dormant: false,
    docs_url: null,
    status: 'live',
    verification_stale: false,
    receipts_invalid: false,
    fail_reason: null,
    verified_at: null,
    live_proven_at: null,
    last_growth_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** One observation row; override the aggregate fields under test. */
export function makeSnapshot(overrides: Partial<ActivitySnapshot> = {}): ActivitySnapshot {
  return {
    listing_id: 'listing-1',
    head: 'aaaaaaaaaaaa',
    cumulative_cents: 0,
    count: 0,
    as_of: '2026-01-01T00:00:00.000Z',
    observed_at: '2026-01-01T00:00:00.000Z',
    anchor_tier: 'first-seen',
    anchor_threshold: null,
    anchor_witnesses: null,
    ...overrides,
  };
}
