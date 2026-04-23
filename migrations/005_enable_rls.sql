alter table team_memberships enable row level security;
alter table team_invites enable row level security;
alter table invite_join_sessions enable row level security;
alter table team_invite_redemptions enable row level security;

drop policy if exists team_memberships_self_read on team_memberships;
create policy team_memberships_self_read
on team_memberships
for select
using (auth.uid()::text = user_id);

drop policy if exists team_invite_redemptions_self_read on team_invite_redemptions;
create policy team_invite_redemptions_self_read
on team_invite_redemptions
for select
using (auth.uid()::text = user_id);

drop policy if exists invite_join_sessions_self_read on invite_join_sessions;
create policy invite_join_sessions_self_read
on invite_join_sessions
for select
using (auth.uid()::text = user_id or auth.uid()::text = subject_key);
