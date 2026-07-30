-- Pin function resolution to trusted schemas without changing function bodies.
-- `public` contains ShotLab tables and helper functions; `extensions` contains
-- pgcrypto helpers used by invite generation and hashing.

alter function public._leaderboard_apply_home_shot_delta(text, text, bigint)
  set search_path = public, extensions;
alter function public._leaderboard_parse_made(jsonb)
  set search_path = public, extensions;
alter function public._leaderboard_parse_player_id(jsonb)
  set search_path = public, extensions;
alter function public._leaderboard_parse_team_id(jsonb)
  set search_path = public, extensions;

alter function public.coach_signup_create_team_and_invite(text, text, integer, integer)
  set search_path = public, extensions;
alter function public.confirm_team_invite_join_from_context(text, text, text, text)
  set search_path = public, extensions;
alter function public.ensure_team_invite_code_for_legacy_restore(text, text)
  set search_path = public, extensions;
alter function public.hash_invite_code(text)
  set search_path = public, extensions;
alter function public.lookup_team_invite_by_code(text)
  set search_path = public, extensions;
alter function public.normalize_invite_code(text)
  set search_path = public, extensions;
alter function public.random_invite_code(integer)
  set search_path = public, extensions;
alter function public.resolve_team_invite_context(text, text, integer)
  set search_path = public, extensions;

alter function public.reject_season_archive_mutation()
  set search_path = public, extensions;
alter function public.shot_logs_use_roster_player_key()
  set search_path = public, extensions;
alter function public.trg_team_player_home_shot_totals_sync()
  set search_path = public, extensions;

notify pgrst, 'reload schema';