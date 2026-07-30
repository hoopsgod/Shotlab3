alter table public.events enable row level security;
alter table public.rsvps enable row level security;

drop policy if exists "Allow all" on public.events;
drop policy if exists "Allow all" on public.rsvps;

revoke all privileges on table public.events from public, anon, authenticated;
revoke all privileges on table public.rsvps from public, anon, authenticated;

grant select, insert, update, delete on table public.events to service_role;
grant select, insert, update, delete on table public.rsvps to service_role;

notify pgrst, 'reload schema';
