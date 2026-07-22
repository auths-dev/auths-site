import { describe, it, expect } from 'vitest';
import { listingStatus } from '@/components/badges';
import { makeListing } from './fixtures';

const BOOLS = [false, true];

describe('listingStatus', () => {
  it('a failing re-check always wins over any green state', () => {
    for (const verified_at of [null, '2026-01-01T00:00:00.000Z']) {
      for (const live_proven_at of [null, '2026-01-01T00:00:00.000Z']) {
        for (const dormant of BOOLS) {
          for (const verification_stale of BOOLS) {
            for (const receipts_invalid of BOOLS) {
              const status = listingStatus(
                makeListing({
                  verified_at,
                  live_proven_at,
                  dormant,
                  verification_stale,
                  receipts_invalid,
                }),
              );
              if (receipts_invalid || verification_stale) {
                expect(status.kind).toBe('failed');
              }
              expect(['failed', 'proven_live', 'verified', 'pending']).toContain(status.kind);
            }
          }
        }
      }
    }
  });

  it('a verified listing with invalid receipts reads failed, never verified', () => {
    const status = listingStatus(
      makeListing({ verified_at: '2026-01-01T00:00:00.000Z', receipts_invalid: true }),
    );
    expect(status.kind).toBe('failed');
    if (status.kind === 'failed') expect(status.reason).toBe('receipts_invalid');
  });

  it('proven-live requires live_proven_at and no dormancy', () => {
    expect(
      listingStatus(makeListing({ live_proven_at: '2026-01-01T00:00:00.000Z', dormant: false }))
        .kind,
    ).toBe('proven_live');
    expect(
      listingStatus(
        makeListing({
          live_proven_at: '2026-01-01T00:00:00.000Z',
          dormant: true,
          verified_at: '2026-01-01T00:00:00.000Z',
        }),
      ).kind,
    ).toBe('verified');
  });

  it('surfaces a verified quorum only from a real witness anchor', () => {
    const listing = makeListing({ live_proven_at: '2026-01-01T00:00:00.000Z', dormant: false });
    const anchored = listingStatus(listing, { tier: 'witness', threshold: 2, witnesses: 3 });
    const bare = listingStatus(listing, { tier: 'first-seen', threshold: null, witnesses: null });
    if (anchored.kind === 'proven_live') expect(anchored.quorum).toEqual({ t: 2, n: 3 });
    if (bare.kind === 'proven_live') expect(bare.quorum).toBeNull();
  });

  it('a bare listing is pending', () => {
    expect(listingStatus(makeListing()).kind).toBe('pending');
  });
});
