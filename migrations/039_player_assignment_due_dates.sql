alter table public.player_assignments
  add column if not exists due_date date;

create index if not exists player_assignments_team_due_idx
  on public.player_assignments(team_id, due_date)
  where due_date is not null and state <> 'completed';

comment on column public.player_assignments.due_date is
  'Optional coach-selected calendar deadline. Stored as a date-only value to avoid timezone drift.';

notify pgrst, 'reload schema';
