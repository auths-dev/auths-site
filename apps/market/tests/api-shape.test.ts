import { describe, it, expect } from 'vitest';
import { endpointSummary } from '@/lib/public-shape';
import { makeListing } from './fixtures';

describe('endpointSummary', () => {
  it('exposes dormant and last_growth_at on every row', () => {
    const rows = [
      makeListing({ slug: 'a', dormant: true, last_growth_at: '2026-03-01T00:00:00.000Z' }),
      makeListing({ slug: 'b', dormant: false, last_growth_at: null }),
    ].map(endpointSummary);

    for (const row of rows) {
      expect(row).toHaveProperty('dormant');
      expect(row).toHaveProperty('last_growth_at');
    }
  });

  it('defaults a missing dormant flag to false and missing last_growth_at to null', () => {
    const row = endpointSummary(makeListing({ dormant: undefined, last_growth_at: null }));
    expect(row.dormant).toBe(false);
    expect(row.last_growth_at).toBeNull();
  });

  it('surfaces a live-proven listing that has since gone dormant', () => {
    const row = endpointSummary(
      makeListing({ live_proven_at: '2026-01-01T00:00:00.000Z', dormant: true }),
    );
    expect(row.live_proven_at).toBe('2026-01-01T00:00:00.000Z');
    expect(row.dormant).toBe(true);
  });
});
