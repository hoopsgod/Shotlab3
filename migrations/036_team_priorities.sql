create table if not exists public.team_priorities (
  team_id text primary key,
  priorities jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text not null,
  constraint team_priorities_object check (jsonb_typeof(priorities) = 'object'),
  constraint team_priorities_size check (octet_length(priorities::text) <= 12000)
);

create index if not exists team_priorities_updated_at_idx
  on public.team_priorities(updated_at desc);

alter table public.team_priorities enable row level security;

revoke all on table public.team_priorities from public, anon, authenticated;

comment on table public.team_priorities is
  'Player-facing team guidance written through the authenticated ShotLab API. Direct client table access is intentionally disabled.';

notify pgrst, 'reload schema';
