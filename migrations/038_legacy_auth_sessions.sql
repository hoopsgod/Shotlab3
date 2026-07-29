-- Opaque server-side sessions for ShotLab's legacy email/password accounts.
-- Raw session tokens are sent only in an HttpOnly cookie. The database stores
-- SHA-256 token hashes so a database read cannot be used as a browser session.

create table if not exists public.legacy_auth_sessions (
  token_hash text primary key,
  user_email text not null,
  user_role text not null default 'player',
  team_id text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint legacy_auth_sessions_token_hash_check
    check (char_length(token_hash) = 64),
  constraint legacy_auth_sessions_email_check
    check (char_length(user_email) between 3 and 320),
  constraint legacy_auth_sessions_role_check
    check (user_role in ('player', 'coach', 'assistant_coach')),
  constraint legacy_auth_sessions_expiry_check
    check (expires_at > created_at)
);

create index if not exists legacy_auth_sessions_user_email_idx
  on public.legacy_auth_sessions (user_email);

create index if not exists legacy_auth_sessions_expires_at_idx
  on public.legacy_auth_sessions (expires_at)
  where revoked_at is null;

alter table public.legacy_auth_sessions enable row level security;

revoke all on table public.legacy_auth_sessions from public;
revoke all on table public.legacy_auth_sessions from anon;
revoke all on table public.legacy_auth_sessions from authenticated;

grant select, insert, update, delete on table public.legacy_auth_sessions to service_role;

comment on table public.legacy_auth_sessions is
  'API-only opaque sessions for legacy ShotLab accounts. Raw tokens are never stored.';
comment on column public.legacy_auth_sessions.token_hash is
  'Lowercase SHA-256 hex digest of the HttpOnly cookie token.';
