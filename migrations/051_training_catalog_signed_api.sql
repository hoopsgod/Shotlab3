-- Persist coach-customized training catalogs across devices while keeping all
-- table access behind the authenticated Cloudflare API.

create table if not exists public.training_drills (
  team_id text not null references public.teams(id) on delete cascade,
  id text not null,
  mode text not null check (mode in ('home', 'program')),
  name text not null check (char_length(name) between 1 and 320),
  description text,
  instructions text,
  max_score numeric check (max_score is null or max_score >= 0),
  icon text,
  sort_order integer not null default 0 check (sort_order between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text not null,
  primary key (team_id, id)
);

create index if not exists training_drills_team_mode_sort_idx
  on public.training_drills (team_id, mode, sort_order, name);

alter table public.training_drills enable row level security;

revoke all privileges on table public.training_drills from public, anon, authenticated;
grant select, insert, update, delete on table public.training_drills to service_role;

comment on table public.training_drills is
  'Coach-customized At Home and Program drill definitions. Browser roles use the signed /v1/training-catalog API.';

notify pgrst, 'reload schema';
