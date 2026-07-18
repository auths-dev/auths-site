-- Billing hangs off the ROOT identity, not the login method (M-S1.1), and every
-- fee row cites the exact log_hash it was computed from — we bill the way we
-- badge: numbers a customer can re-derive, or they don't render.

create table if not exists public.billing_accounts (
  id uuid primary key default gen_random_uuid(),
  root_aid text unique,                    -- the auths root the account keys to
  github_seller_id uuid references public.sellers (id) on delete set null,
  tier text not null default 'open'
    check (tier in ('open', 'seller', 'fleet', 'enterprise')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  -- Billing needs a stable subject: an auths root, or (pre-root) a seller row.
  constraint billing_subject check (root_aid is not null or github_seller_id is not null)
);

create table if not exists public.fleets (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid not null references public.billing_accounts (id) on delete cascade,
  org_root_aid text not null,              -- the org root the delegations chain to
  delegation_count integer not null default 0,
  cap_cents bigint not null default 0,     -- the ONE treasury cap
  treasury_url text,                       -- the coordinator enforcing it
  created_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  billing_account_id uuid references public.billing_accounts (id) on delete set null,
  listing_id uuid references public.listings (id) on delete set null,
  channel_ref text not null,               -- the channel id the netted close settled
  rail text not null check (rail in ('x402', 'stripe')),
  gross_cents bigint not null,
  fee_cents bigint not null default 0,
  -- The citation: SHA-256 of the exact spend-log bytes this settlement was
  -- re-derived from. A fee that cannot be re-derived from its cited log
  -- does not render.
  log_hash text not null,
  settled_at timestamptz not null default now()
);

create table if not exists public.usage_rollups (
  billing_account_id uuid not null references public.billing_accounts (id) on delete cascade,
  period text not null,                    -- YYYY-MM
  settled_cents bigint not null default 0,
  fee_cents bigint not null default 0,
  primary key (billing_account_id, period)
);

create index if not exists settlements_account_idx on public.settlements (billing_account_id);
create index if not exists settlements_listing_idx on public.settlements (listing_id);
create index if not exists fleets_account_idx on public.fleets (billing_account_id);

-- Service-role only for now: billing writes come from settlement processing,
-- never from a browser session.
alter table public.billing_accounts enable row level security;
alter table public.fleets enable row level security;
alter table public.settlements enable row level security;
alter table public.usage_rollups enable row level security;
