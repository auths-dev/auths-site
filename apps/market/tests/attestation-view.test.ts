import { describe, it, expect } from 'vitest';
import { witnessedView } from '@/lib/attestation-view';
import { makeSnapshot } from './fixtures';

describe('witnessedView', () => {
  it('a single forged unanchored absolute yields no surfaced verified earnings number', () => {
    const forged = makeSnapshot({
      anchor_tier: 'first-seen',
      cumulative_cents: 50_000_000,
      count: 10_000,
    });

    const view = witnessedView([forged]);

    expect(view.seller_claimed_cumulative_cents).toBeNull();
    expect(view.unwitnessed).toBe(true);
    expect(view.witnessed_cents).toBe(0);
  });

  it('exposes the absolute only when the latest observation is quorum-anchored', () => {
    const anchored = makeSnapshot({
      anchor_tier: 'witness',
      anchor_threshold: 2,
      anchor_witnesses: 2,
      cumulative_cents: 4_200,
      count: 12,
    });

    const view = witnessedView([anchored]);

    expect(view.seller_claimed_cumulative_cents).toBe(4_200);
    expect(view.unwitnessed).toBe(false);
    expect(view.anchor_tier).toBe('witness');
  });

  it('credits only the delta the market observed across two points', () => {
    const first = makeSnapshot({ cumulative_cents: 1_000, count: 4, anchor_tier: 'witness' });
    const latest = makeSnapshot({
      cumulative_cents: 1_600,
      count: 7,
      anchor_tier: 'witness',
      anchor_threshold: 2,
      anchor_witnesses: 2,
    });

    const view = witnessedView([first, latest]);

    expect(view.witnessed_cents).toBe(600);
    expect(view.witnessed_calls).toBe(3);
    expect(view.window_days).toBe(90);
  });

  it('an empty history witnesses nothing and stays unwitnessed', () => {
    const view = witnessedView([]);
    expect(view.witnessed_cents).toBe(0);
    expect(view.seller_claimed_cumulative_cents).toBeNull();
    expect(view.unwitnessed).toBe(true);
    expect(view.anchor_tier).toBe('first-seen');
  });
});
