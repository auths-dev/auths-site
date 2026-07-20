/**
 * The prober cadence, stated once so the seller-facing banner and the pending
 * status chip cannot drift from each other — or from the cron in vercel.json
 * (`/api/cron/probe` runs at `0 6 * * *`).
 */

/** Human-readable cadence of the market prober. Mirrors the `0 6 * * *` cron. */
export const PROBE_SCHEDULE = 'daily, ~06:00 UTC';

/** Display labels for a listing's lifecycle status, cadence baked into pending. */
export const STATUS_LABEL: Record<string, string> = {
  pending_verification: `pending verification · checked ${PROBE_SCHEDULE}`,
  live: 'live',
  failed: 'failed',
};
