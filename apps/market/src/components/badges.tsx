import { ShieldCheck, ReceiptText, BadgeCheck, TriangleAlert, MoonStar } from 'lucide-react';
import type { Listing } from '@/lib/listings';

/**
 * The badge ladder (PRD §9): Verified (test-proven) → Proven live
 * (receipts observed) → Auths-verified seller (identity proven).
 * Overlays (stale / receipts-invalid) always render — failures are loud.
 */
export function ListingBadges({
  listing,
  sellerAuthsRoot,
}: {
  listing: Listing;
  sellerAuthsRoot?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {listing.verified_at ? (
        <span
          title="Metering, receipts & price proven by a test-mode probe"
          className="inline-flex items-center gap-1.5 rounded-sm border border-seal/40 bg-seal/[0.07] px-2 py-0.5 font-mono text-[11px] font-medium text-seal-deep"
        >
          <ShieldCheck size={12} aria-hidden="true" /> verified
        </span>
      ) : null}
      {listing.live_proven_at ? (
        <span
          title="Signed activity aggregate; growth witnessed by this market in the last 90 days"
          className="inline-flex items-center gap-1.5 rounded-sm border border-seal/40 bg-seal/[0.07] px-2 py-0.5 font-mono text-[11px] font-medium text-seal-deep"
        >
          <ReceiptText size={12} aria-hidden="true" /> proven live
        </span>
      ) : null}
      {listing.dormant && listing.live_proven_at ? (
        <span
          title="Attestation verifies, but no growth witnessed in the last 90 days"
          className="inline-flex items-center gap-1.5 rounded-sm border border-rule bg-paper px-2 py-0.5 font-mono text-[11px] font-medium text-ink-faint"
        >
          <MoonStar size={12} aria-hidden="true" /> dormant
        </span>
      ) : null}
      {sellerAuthsRoot ? (
        <span
          title="Seller proved control of their auths identity"
          className="inline-flex items-center gap-1.5 rounded-sm border border-seal bg-seal px-2 py-0.5 font-mono text-[11px] font-medium text-paper"
        >
          <BadgeCheck size={12} aria-hidden="true" /> auths-verified
        </span>
      ) : null}
      {listing.verification_stale ? (
        <span
          title="The weekly re-probe is failing — claims may have drifted"
          className="inline-flex items-center gap-1.5 rounded-sm border border-deny/50 bg-deny/[0.06] px-2 py-0.5 font-mono text-[11px] font-medium text-deny"
        >
          <TriangleAlert size={12} aria-hidden="true" /> verification stale
        </span>
      ) : null}
      {listing.receipts_invalid ? (
        <span
          title="The published activity attestation failed verification"
          className="inline-flex items-center gap-1.5 rounded-sm border border-deny/50 bg-deny/[0.06] px-2 py-0.5 font-mono text-[11px] font-medium text-deny"
        >
          <TriangleAlert size={12} aria-hidden="true" /> receipts invalid
        </span>
      ) : null}
    </div>
  );
}
