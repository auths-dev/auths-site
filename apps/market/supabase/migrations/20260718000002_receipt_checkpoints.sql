-- Incremental receipts verification: the worker's OWN proven end-state per
-- listing. When a freshly fetched log's prefix bytes still hash to log_hash,
-- the worker re-verifies only the suffix, resuming from verified_len records
-- with last_binding / last_cents — trust in prior work the worker itself
-- proved, never in the operator. Any prefix mutation misses the hash and
-- forces a full re-verification.
create table if not exists public.receipt_checkpoints (
  listing_id uuid primary key references public.listings (id) on delete cascade,
  log_hash text not null,
  prefix_bytes integer not null,
  verified_len integer not null,
  last_binding text not null,
  last_cents integer not null,
  derived_at timestamptz not null default now()
);

-- Service-role only: no policies on purpose — checkpoints are worker state,
-- never a public surface.
alter table public.receipt_checkpoints enable row level security;
