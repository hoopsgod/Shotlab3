import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  new URL("../migrations/023_home_shots_leaderboard_left_join_profiles.sql", import.meta.url),
  "utf8",
);

test("SQL contract: leaderboard RPC accepts text team ids and enforces top-10 limit", () => {
  assert.match(migration, /p_team_id text/);
  assert.match(migration, /v_limit integer := greatest\(1, least\(coalesce\(p_limit, 10\), 10\)\)/);
  assert.match(migration, /limit v_limit/);
});

test("SQL contract: totals remain source of truth and missing profiles are allowed", () => {
  assert.match(migration, /from team_player_home_shot_totals t/);
  assert.match(migration, /left join profiles/);
  assert.match(migration, /t\.total_home_shots > 0/);
});

test("SQL contract: profile join and display-name fallback are explicit", () => {
  assert.match(migration, /coalesce\(nullif\(profiles\.rec->>'team_id'/);
  assert.match(migration, /totals\.player_id in \(/);
  assert.match(migration, /nullif\(trim\(coalesce\(profiles\.rec->>'name', ''\)\), ''\)/);
  assert.match(migration, /split_part\(totals\.player_id, '@', 1\)/);
  assert.match(migration, /'Player'/);
});

test("SQL contract: scope and hidden-profile behavior handles missing profiles", () => {
  assert.match(migration, /v_scope not in \('players', 'coaches', 'all'\)/);
  assert.match(migration, /\(v_scope = 'players' and \(e\.profile is null or e\.profile_role <> 'coach'\)\)/);
  assert.match(migration, /\(v_scope = 'coaches' and e\.profile is not null and e\.profile_role = 'coach'\)/);
  assert.match(migration, /e\.is_hidden = false/);
});

test("SQL contract: ranking tie-break, grants, and schema reload are present", () => {
  assert.match(migration, /order by filtered\.total_home_shots desc, filtered\.player_display_name asc, filtered\.player_id asc/);
  assert.match(migration, /grant execute on function public\.get_team_home_shots_leaderboard\(text, text, integer, text\)/);
  assert.match(migration, /to anon, authenticated, service_role/);
  assert.match(migration, /notify pgrst, 'reload schema';/);
});

test("SQL contract: privacy boundary allows email or resolved UUID active membership", () => {
  assert.match(migration, /resolve_app_user_uuid\(v_requester_user_id\)::text/);
  assert.match(migration, /to_jsonb\(tm\)->>'user_id'/);
  assert.match(migration, /v_requester_user_uuid <> ''/);
  assert.match(migration, /lower\(coalesce\(to_jsonb\(tm\)->>'status', ''\)\) = 'active'/);
});
