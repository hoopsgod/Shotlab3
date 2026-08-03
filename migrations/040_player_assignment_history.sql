create table if not exists public.player_assignment_history (
  team_id text not null,
  player_identity text not null,
  player_name text not null default '',
  assignment_text text not null,
  result_detail text not null default '',
  due_date date,
  state text not null default 'completed',
  assigned_by text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  acknowledged_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz not null,
  archived_at timestamptz not null default now(),
  primary key (team_id, player_identity, created_at),
  constraint player_assignment_history_completed check (state = 'completed'),
  constraint player_assignment_history_identity_size check (octet_length(player_identity) between 1 and 320),
  constraint player_assignment_history_name_size check (octet_length(player_name) <= 320),
  constraint player_assignment_history_text_size check (octet_length(assignment_text) between 1 and 4000),
  constraint player_assignment_history_result_size check (octet_length(result_detail) <= 1000)
);

create index if not exists player_assignment_history_team_completed_idx
  on public.player_assignment_history(team_id, completed_at desc);

alter table public.player_assignment_history enable row level security;

revoke all on table public.player_assignment_history from public, anon, authenticated;
grant select, insert, update, delete on table public.player_assignment_history to service_role;

comment on table public.player_assignment_history is
  'Immutable completed coach-directed assignments archived before the next active assignment is issued. Read and written only through authenticated ShotLab APIs. Private coach notes are never stored here.';

notify pgrst, 'reload schema';
