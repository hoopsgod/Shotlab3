create table if not exists public.legacy_auth_profiles (
  email text primary key,
  password_hash text not null,
  password_salt text not null,
  name text not null,
  role text not null check (role in ('coach','player')),
  team_id text null,
  hide_from_leaderboards boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_legacy_auth_profiles_email_lower on public.legacy_auth_profiles (lower(email));
create index if not exists idx_legacy_auth_profiles_team_id on public.legacy_auth_profiles (team_id);

alter table public.legacy_auth_profiles enable row level security;

revoke all on table public.legacy_auth_profiles from anon;
revoke all on table public.legacy_auth_profiles from authenticated;
grant select, insert, update, delete on table public.legacy_auth_profiles to service_role;

comment on table public.legacy_auth_profiles is
  'Stores legacy auth password hashes/salts. Access is restricted to Cloudflare Functions using service-role credentials; frontend clients must never query this table directly.';
