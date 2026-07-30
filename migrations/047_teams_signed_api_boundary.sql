-- Team identity, ownership, and invite codes must be mediated by signed APIs.
-- Team creation remains exclusively handled by the existing create-team route.

alter table public.teams enable row level security;

drop policy if exists "Allow all" on public.teams;

revoke all privileges on table public.teams from public, anon, authenticated;
grant select, insert, update, delete on table public.teams to service_role;

notify pgrst, 'reload schema';
