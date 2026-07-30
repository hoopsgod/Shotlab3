-- The application session key (sl:session) is local device state only.
-- Supabase Auth uses auth-managed tokens and legacy auth uses legacy_auth_sessions.
-- The legacy public.sessions table must not remain writable from browser roles.

alter table public.sessions enable row level security;

drop policy if exists "Allow all" on public.sessions;

revoke all privileges on table public.sessions from public, anon, authenticated;
grant select, insert, update, delete on table public.sessions to service_role;

notify pgrst, 'reload schema';
