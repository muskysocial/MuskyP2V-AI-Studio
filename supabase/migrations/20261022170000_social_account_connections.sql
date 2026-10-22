-- Store social OAuth connections server-side only. Tokens are encrypted by the Edge Function.
create table if not exists public.social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('tiktok','instagram','facebook','youtube','x')),
  provider_user_id text not null,
  display_name text,
  avatar_url text,
  access_token_ciphertext text not null,
  access_token_iv text not null,
  refresh_token_ciphertext text,
  refresh_token_iv text,
  scopes text[] not null default '{}',
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_user_id)
);

create index if not exists social_connections_user_provider_idx
  on public.social_connections (user_id, provider);

create table if not exists public.social_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('tiktok','instagram','facebook','youtube','x')),
  state_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists social_oauth_states_expiry_idx
  on public.social_oauth_states (expires_at);

create table if not exists public.social_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.viral_campaigns(id) on delete cascade,
  provider text not null check (provider in ('tiktok','instagram','facebook','youtube','x')),
  provider_publish_id text,
  status text not null default 'processing' check (status in ('processing','published','failed','unknown')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, campaign_id, provider)
);

create index if not exists social_publish_jobs_user_idx
  on public.social_publish_jobs (user_id, created_at desc);

alter table public.social_connections enable row level security;
alter table public.social_oauth_states enable row level security;

-- OAuth tokens and state are only read/written by trusted server-side Edge Functions.
revoke all on table public.social_connections from public, anon, authenticated;
revoke all on table public.social_oauth_states from public, anon, authenticated;
alter table public.social_publish_jobs enable row level security;
revoke all on table public.social_publish_jobs from public, anon, authenticated;
grant all on table public.social_connections to service_role;
grant all on table public.social_oauth_states to service_role;
grant all on table public.social_publish_jobs to service_role;
