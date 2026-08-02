create table if not exists public.player_assignments (
  team_id text not null,
  player_identity text not null,
  player_name text not null default '',
  assignment_text text not null,
  result_detail text not null default '',
  state text not null default 'assigned',
  assigned_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  primary key (team_id, player_identity),
  constraint player_assignments_state check (state in ('assigned', 'acknowledged', 'started', 'completed')),
  constraint player_assignments_identity_size check (octet_length(player_identity) between 1 and 320),
  constraint player_assignments_name_size check (octet_length(player_name) <= 320),
  constraint player_assignments_text_size check (octet_length(assignment_text) between 1 and 4000),
  constraint player_assignments_result_size check (octet_length(result_detail) <= 1000)
);

create index if not exists player_assignments_team_updated_idx
  on public.player_assignments(team_id, updated_at desc);

alter table public.player_assignments enable row level security;

revoke all on table public.player_assignments from public, anon, authenticated;

comment on table public.player_assignments is
  'Current coach-directed assignment for one active team player. Written and read only through authenticated ShotLab APIs. Private coach notes are never stored here.';

notify pgrst, 'reload schema';
