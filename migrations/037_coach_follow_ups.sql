create table if not exists public.coach_follow_ups (
  team_id text not null,
  player_identity text not null,
  player_name text not null default '',
  state text not null default 'planned',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_by text not null,
  primary key (team_id, player_identity),
  constraint coach_follow_ups_state check (state in ('planned', 'completed', 'dismissed')),
  constraint coach_follow_ups_identity_size check (octet_length(player_identity) between 1 and 320),
  constraint coach_follow_ups_name_size check (octet_length(player_name) <= 320),
  constraint coach_follow_ups_note_size check (octet_length(note) <= 4000)
);

create index if not exists coach_follow_ups_team_updated_idx
  on public.coach_follow_ups(team_id, updated_at desc);

alter table public.coach_follow_ups enable row level security;

revoke all on table public.coach_follow_ups from public, anon, authenticated;

comment on table public.coach_follow_ups is
  'Coach-only follow-up task state written through the authenticated ShotLab API. Records do not imply that a message was sent or a player was notified.';

notify pgrst, 'reload schema';
