-- Shot logs are written through /v1/home-shots/log and read through the
-- authenticated /v1/shot-logs route. Remove direct browser table access.

alter table public.shot_logs enable row level security;

drop policy if exists "Allow all" on public.shot_logs;

revoke all privileges on table public.shot_logs from public, anon, authenticated;
grant select, insert, update, delete on table public.shot_logs to service_role;

notify pgrst, 'reload schema';
