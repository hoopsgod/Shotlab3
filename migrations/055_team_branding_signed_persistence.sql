alter table public.teams
  add column if not exists branding jsonb not null default '{}'::jsonb;

alter table public.teams
  drop constraint if exists teams_branding_object_chk;

alter table public.teams
  add constraint teams_branding_object_chk
  check (jsonb_typeof(branding) = 'object');

comment on column public.teams.branding is
  'Coach-managed ShotLab team branding persisted through the signed teams API. Stores sanitized colors, text scale, and logo sources.';
