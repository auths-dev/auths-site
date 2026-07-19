-- The attestation privacy cutover (docs/plans/storage/spend-attestation-privacy.md):
-- proven-live is earned from a signed aggregate activity/v1 attestation the market
-- WITNESSES growing — the raw per-call spend log (the counterparty-graph leak) is
-- never published and never fetched. Pre-launch: replace outright, no back-compat.

-- listings: the published artifact is the attestation, not a log.
alter table listings rename column spend_log_url to attestation_url;

-- The honest third state: verified (signature good) but zero witnessed growth in
-- the trailing window.
alter table listings add column if not exists dormant boolean not null default false;

-- The market's own append-only witnessing history: what it saw, when. The
-- trailing-window delta over these rows — never the seller's absolute claim —
-- earns the proven-live badge.
create table if not exists attestation_checkpoints (
  id bigint generated always as identity primary key,
  listing_id uuid not null references listings(id) on delete cascade,
  head text not null,
  cumulative_cents bigint not null,
  count bigint not null,
  as_of timestamptz not null,
  anchor_tier text not null default 'first-seen',
  observed_at timestamptz not null default now()
);
create index if not exists attestation_checkpoints_listing
  on attestation_checkpoints (listing_id, observed_at);

alter table attestation_checkpoints enable row level security;
-- service-role only (the worker); no anon/authenticated policies.

-- Retire the per-call-derived surfaces: receipt_summaries was the leak (per-day
-- per-rail rows re-derived from raw logs), receipt_checkpoints was the raw-log
-- resume state. The attestation path replaces both.
drop table if exists receipt_summaries;
drop table if exists receipt_checkpoints;
