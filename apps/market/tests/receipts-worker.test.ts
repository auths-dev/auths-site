import { describe, it, expect } from 'vitest';
import { computeLiveness, resolveVerifiedAnchor } from '@/lib/attestation-view';

describe('resolveVerifiedAnchor', () => {
  it('an anchor-blind SDK result (no anchor field) stays first-seen', () => {
    expect(resolveVerifiedAnchor({})).toBeNull();
  });

  it('a first-seen anchor is not the witness tier', () => {
    expect(
      resolveVerifiedAnchor({
        anchor: {
          tier: 'first-seen',
          threshold: 0,
          witnesses: 0,
          cosigners: 0,
          seedId: '',
          witnessSetSaid: '',
        },
      }),
    ).toBeNull();
  });

  it('a forged witness anchor with zero threshold is rejected', () => {
    expect(
      resolveVerifiedAnchor({
        anchor: {
          tier: 'witness',
          threshold: 0,
          witnesses: 0,
          cosigners: 0,
          seedId: 's',
          witnessSetSaid: 'w',
        },
      }),
    ).toBeNull();
  });

  it('a real verified witness anchor returns the summary', () => {
    const anchor = {
      tier: 'witness',
      threshold: 2,
      witnesses: 2,
      cosigners: 2,
      seedId: 'seed',
      witnessSetSaid: 'said',
    };
    expect(resolveVerifiedAnchor({ anchor })).toEqual(anchor);
  });
});

describe('computeLiveness', () => {
  it('clears the proven-live latch when the window goes flat', () => {
    const update = computeLiveness({
      live_proven_at: '2026-01-01T00:00:00.000Z',
      witnessedDelta: 0,
      observedAt: '2026-04-01T00:00:00.000Z',
    });

    expect(update.dormant).toBe(true);
    expect(update.live_proven_at).toBeNull();
    expect(update).not.toHaveProperty('last_growth_at');
  });

  it('keeps the original proven-live timestamp while growth continues and stamps last_growth_at', () => {
    const update = computeLiveness({
      live_proven_at: '2026-01-01T00:00:00.000Z',
      witnessedDelta: 500,
      observedAt: '2026-04-01T00:00:00.000Z',
    });

    expect(update.dormant).toBe(false);
    expect(update.live_proven_at).toBe('2026-01-01T00:00:00.000Z');
    expect(update.last_growth_at).toBe('2026-04-01T00:00:00.000Z');
  });

  it('sets proven-live on first witnessed growth', () => {
    const update = computeLiveness({
      live_proven_at: null,
      witnessedDelta: 120,
      observedAt: '2026-04-01T00:00:00.000Z',
    });

    expect(update.live_proven_at).toBe('2026-04-01T00:00:00.000Z');
    expect(update.last_growth_at).toBe('2026-04-01T00:00:00.000Z');
    expect(update.dormant).toBe(false);
  });
});
