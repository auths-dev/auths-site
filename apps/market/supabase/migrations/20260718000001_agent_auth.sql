-- Agent-native seller auth (US-013/US-015): single-use challenges + provider identity.

-- Single-use challenge nonces. Service-role only (no policies): minted by
-- POST /api/v1/challenge, consumed (deleted) exactly once at verification.
create table public.auth_challenges (
  nonce text primary key,
  audience text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.auth_challenges enable row level security;

-- Agent sellers have no Supabase auth user, so their row id is generated, the
-- auth.users foreign key goes (GitHub sellers still use id = auth.uid(); their
-- RLS policies are unchanged), and the (provider, subject) pair is the real
-- identity key.
alter table public.sellers drop constraint sellers_id_fkey;
alter table public.sellers alter column id set default gen_random_uuid();
create unique index sellers_provider_subject
  on public.sellers (auth_provider, auth_subject);
