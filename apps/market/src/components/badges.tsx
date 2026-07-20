import { ShieldCheck, ReceiptText, BadgeCheck, TriangleAlert } from 'lucide-react';
import type { Listing } from '@/lib/listings';
import { PROBE_SCHEDULE } from '@/lib/schedule';

/**
 * The proven-live provenance, from the latest checkpoint's VERIFIED anchor
 * columns (worker-derived — a tier claimed inside the seller's document is
 * never credited). Absent → the badge reads market-witnessed, the floor tier.
 */
export interface AnchorProvenance {
  tier: string;
  threshold: number | null;
  witnesses: number | null;
}

/** The single primary trust state a listing resolves to. */
export type ListingStatus =
  | { kind: 'failed'; label: string; reason: 'receipts_invalid' | 'verification_stale' }
  | { kind: 'proven_live'; quorum: { t: number; n: number } | null }
  | { kind: 'verified' }
  | { kind: 'pending' };

/**
 * Collapse a listing's re-check flags into ONE primary status. A failing
 * re-check wins over any prior green state, so a card can never show a green
 * trust chip beside a red failure chip. The identity (`auths-verified`) chip
 * is orthogonal and rendered separately.
 *
 * Args:
 * * `l`: the listing being rendered.
 * * `anchor`: the latest checkpoint's verified anchor provenance, if any.
 *
 * Usage:
 * ```ignore
 * const status = listingStatus(listing, anchor);
 * ```
 */
export function listingStatus(l: Listing, anchor?: AnchorProvenance | null): ListingStatus {
  if (l.receipts_invalid) {
    return { kind: 'failed', label: 'receipts invalid', reason: 'receipts_invalid' };
  }
  if (l.verification_stale) {
    return { kind: 'failed', label: 're-verification pending', reason: 'verification_stale' };
  }
  if (l.live_proven_at && !l.dormant) {
    const quorum =
      anchor?.tier === 'witness' && anchor.threshold && anchor.witnesses
        ? { t: anchor.threshold, n: anchor.witnesses }
        : null;
    return { kind: 'proven_live', quorum };
  }
  if (l.verified_at) return { kind: 'verified' };
  return { kind: 'pending' };
}

const CHIP = 'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium';
const GREEN = `${CHIP} border border-seal/40 bg-seal/[0.07] text-seal-deep`;

function PrimaryChip({ status }: { status: ListingStatus }) {
  if (status.kind === 'failed' && status.reason === 'receipts_invalid') {
    return (
      <span
        title="The published activity attestation failed verification"
        className={`${CHIP} border border-deny/50 bg-deny/[0.06] text-deny`}
      >
        <TriangleAlert size={12} aria-hidden="true" /> {status.label}
      </span>
    );
  }
  if (status.kind === 'failed') {
    return (
      <span
        title={`The re-probe has not re-confirmed this listing yet — re-checked ${PROBE_SCHEDULE}`}
        className={`${CHIP} border border-rule bg-paper-deep text-ink-soft`}
      >
        <TriangleAlert size={12} aria-hidden="true" /> {status.label}
      </span>
    );
  }
  if (status.kind === 'proven_live') {
    const { quorum } = status;
    return (
      <span
        title={
          quorum
            ? `Signed activity aggregate; growth witnessed by this market, and the latest observation carries a quorum anchor verified against ${quorum.t} of ${quorum.n} declared witnesses`
            : 'Signed activity aggregate; growth witnessed by this market in the last 90 days'
        }
        className={GREEN}
      >
        <ReceiptText size={12} aria-hidden="true" /> proven live ·{' '}
        {quorum ? `quorum-anchored ${quorum.t}-of-${quorum.n}` : 'market-witnessed'}
      </span>
    );
  }
  if (status.kind === 'verified') {
    return (
      <span
        title="Metering, receipts & price proven by a test-mode probe"
        className={GREEN}
      >
        <ShieldCheck size={12} aria-hidden="true" /> verified
      </span>
    );
  }
  return (
    <span
      title={`Not verified yet — the prober runs ${PROBE_SCHEDULE}`}
      className={`${CHIP} border border-rule bg-paper text-ink-faint`}
    >
      pending verification
    </span>
  );
}

/**
 * One coherent status chip per listing, plus the orthogonal identity badge.
 * The five re-check flags are reconciled by `listingStatus` so a green trust
 * chip and a red failure chip never render together.
 */
export function ListingBadges({
  listing,
  sellerAuthsRoot,
  anchor,
}: {
  listing: Listing;
  sellerAuthsRoot?: string | null;
  anchor?: AnchorProvenance | null;
}) {
  const status = listingStatus(listing, anchor);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrimaryChip status={status} />
      {sellerAuthsRoot ? (
        <span
          title="Seller proved control of their auths identity"
          className={`${CHIP} border border-seal bg-seal text-paper`}
        >
          <BadgeCheck size={12} aria-hidden="true" /> auths-verified
        </span>
      ) : null}
    </div>
  );
}
