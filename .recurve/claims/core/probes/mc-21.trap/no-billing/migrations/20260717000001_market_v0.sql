-- Auths Market v0 schema (PRD §7.2). The database is an index/cache: the
-- receipts and registries remain the source of truth, and every row in
-- receipt_summaries must be reproducible from its log_hash.

create table public.sellers (
  -- The seller row IS the Supabase auth user (id = auth.uid()). Created by
  -- the app on first sign-in through the AuthPort adapter.
  id uuid primary key references auth.users (id) on delete cascade,
  auth_provider text not null default 'github',
  auth_subject text not null,
  github_login text,
  -- Filled by the future Auths-native adapter (see lib/auth/port.ts):
  -- a proven root identifier unlocks the top badge tier. Never required.
  auths_root text,
  created_at timestamptz not null default now(),
  unique (auth_provider, auth_subject)
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text not null,
  description text not null,
  tools jsonb not null default '[]'::jsonb,
  price_cents integer not null check (price_cents >= 0),
  rails text[] not null check (rails <@ array['x402','stripe']),
  endpoint jsonb not null,
  spend_log_url text,
  docs_url text,
  status text not null default 'pending_verification'
    check (status in ('pending_verification', 'live', 'failed')),
  -- overlays, not statuses: a live listing can be stale or receipts-invalid
  verification_stale boolean not null default false,
  receipts_invalid boolean not null default false,
  fail_reason text,
  verified_at timestamptz,
  -- badge tier 2: set when the receipts worker first re-derives real
  -- (non-test-mode) settled calls from the seller's published log
  live_proven_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_status_idx on public.listings (status);
create index listings_seller_idx on public.listings (seller_id);

create table public.probe_runs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  started_at timestamptz not null default now(),
  verdict text,
  detail jsonb
);

create index probe_runs_listing_idx on public.probe_runs (listing_id, started_at desc);

create table public.receipt_summaries (
  listing_id uuid not null references public.listings (id) on delete cascade,
  day date not null,
  calls integer not null default 0,
  refused integer not null default 0,
  cents_settled integer not null default 0,
  rail_split jsonb not null default '{}'::jsonb,
  log_hash text not null,
  derived_at timestamptz not null default now(),
  primary key (listing_id, day)
);

-- Row-level security: sellers own their rows; the public reads live
-- listings; workers write with the service role (bypasses RLS).
alter table public.sellers enable row level security;
alter table public.listings enable row level security;
alter table public.probe_runs enable row level security;
alter table public.receipt_summaries enable row level security;

create policy "sellers read own row"
  on public.sellers for select using (id = auth.uid());
create policy "sellers insert own row"
  on public.sellers for insert with check (id = auth.uid());
create policy "sellers update own row"
  on public.sellers for update using (id = auth.uid());

create policy "public reads live listings"
  on public.listings for select using (status = 'live' or seller_id = auth.uid());
create policy "sellers insert own listings"
  on public.listings for insert with check (seller_id = auth.uid());
create policy "sellers update own listings"
  on public.listings for update using (seller_id = auth.uid());
create policy "sellers delete own listings"
  on public.listings for delete using (seller_id = auth.uid());

create policy "sellers read own probe runs"
  on public.probe_runs for select using (
    exists (select 1 from public.listings l
            where l.id = listing_id and l.seller_id = auth.uid())
  );

create policy "public reads live receipt summaries"
  on public.receipt_summaries for select using (
    exists (select 1 from public.listings l
            where l.id = listing_id
              and (l.status = 'live' or l.seller_id = auth.uid()))
  );
