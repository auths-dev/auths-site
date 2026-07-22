/**
 * Pure shapers over the market's own witnessing history. Nothing here reads a
 * seller's document directly: the only fact-grade outputs are the delta this
 * market observed across its polls and the anchor tier the SDK re-verified.
 * The seller's genuinely-signed absolute is a CLAIM, never a market fact — it
 * is surfaced only under a verified quorum anchor, and null otherwise.
 */

import type { ActivitySnapshot } from '@/lib/listings';

/**
 * The quorum shape behind a `witness`-tier observation, restated by the SDK
 * only AFTER it verified the embedded finalized anchor (threshold met, every
 * counted cosigner inside the declared set, inclusion proofs replayed). Absent
 * on unanchored documents and on SDK builds predating the witness network — in
 * both cases the tier stays `first-seen`. Never read from the document.
 */
export interface VerifiedAnchorSummary {
  tier: string;
  threshold: number;
  witnesses: number;
  cosigners: number;
  seedId: string;
  witnessSetSaid: string;
}

/** The witnessed, fact-grade view of a listing's activity history. */
export interface WitnessedView {
  anchor_tier: string;
  /** Market-observed delta over the window — PROVEN. */
  witnessed_cents: number;
  witnessed_calls: number;
  window_days: number;
  /**
   * The absolute is provable ONLY under a verified quorum anchor. Unanchored it
   * is the seller's genuinely-signed CLAIM, never a market fact — so it is null.
   */
  seller_claimed_cumulative_cents: number | null;
  unwitnessed: boolean;
}

/**
 * Reduce a listing's observation history to the numbers the market can stand
 * behind: the witnessed delta and the verified anchor tier. The seller's
 * absolute is exposed only when the latest observation is quorum-anchored.
 *
 * Args:
 * * `snapshots`: the market's append-only observations, oldest-first.
 * * `windowDays`: the trailing window the delta is measured over.
 *
 * Usage:
 * ```ignore
 * const view = witnessedView(snapshots);
 * if (view.unwitnessed) hideAbsolute();
 * ```
 */
export function witnessedView(snapshots: ActivitySnapshot[], windowDays = 90): WitnessedView {
  const latest = snapshots.at(-1);
  const first = snapshots[0];
  const anchored = latest?.anchor_tier === 'witness';
  return {
    anchor_tier: latest?.anchor_tier ?? 'first-seen',
    witnessed_cents: latest && first ? latest.cumulative_cents - first.cumulative_cents : 0,
    witnessed_calls: latest && first ? latest.count - first.count : 0,
    window_days: windowDays,
    seller_claimed_cumulative_cents: anchored ? (latest?.cumulative_cents ?? 0) : null,
    unwitnessed: !anchored,
  };
}

/**
 * The `witness` tier is granted ONLY by a present, verified quorum anchor. An
 * absent or anchor-blind SDK, or any non-witness / zero-threshold anchor, maps
 * to null (first-seen). This is the load-bearing fail-safe: it must stay
 * fail-closed so a forged or missing anchor can never mint a witness badge.
 *
 * Args:
 * * `check`: the SDK's verification result; `anchor` is absent on builds that
 *   predate the witness network and present (possibly null) on anchor-aware ones.
 *
 * Usage:
 * ```ignore
 * const anchor = resolveVerifiedAnchor(check);
 * ```
 */
export function resolveVerifiedAnchor(check: {
  anchor?: VerifiedAnchorSummary | null;
}): VerifiedAnchorSummary | null {
  return check.anchor && check.anchor.tier === 'witness' && check.anchor.threshold >= 1
    ? check.anchor
    : null;
}

/** Inputs to the decaying-liveness computation for one observed listing. */
export interface LivenessInput {
  live_proven_at: string | null;
  witnessedDelta: number;
  observedAt: string;
}

/**
 * Build the listing update from this poll's witnessed growth. Proven-live is a
 * DECAYING signal, not a latch: the earliest proof is kept while growth
 * continues and cleared the moment the trailing window goes flat, so a seller
 * who went dark no longer reads as proven live. `last_growth_at` is stamped
 * whenever the window grew.
 *
 * Args:
 * * `input`: the stored `live_proven_at`, this poll's witnessed delta, and the
 *   observation timestamp.
 *
 * Usage:
 * ```ignore
 * await supabase.from('listings').update(computeLiveness(input)).eq('id', id);
 * ```
 */
export function computeLiveness({
  live_proven_at,
  witnessedDelta,
  observedAt,
}: LivenessInput): Record<string, unknown> {
  const grew = witnessedDelta > 0;
  const update: Record<string, unknown> = {
    receipts_invalid: false,
    verification_stale: false,
    fail_reason: null,
    dormant: !grew,
    live_proven_at: grew ? (live_proven_at ?? observedAt) : null,
  };
  if (grew) update.last_growth_at = observedAt;
  return update;
}
