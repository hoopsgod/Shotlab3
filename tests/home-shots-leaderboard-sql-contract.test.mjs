import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  new URL("../migrations/022_home_shots_leaderboard_membership_uuid_resolution.sql", import.meta.url),
  "utf8",
);

test("SQL contract: leaderboard RPC accepts text team ids and enforces top-10 limit", () => {
  assert.match(migration, /p_team_id text/);
  assert.match(migration, /v_limit integer := greatest\(1, least\(coalesce\(p_limit, 10\), 10\)\)/);
  assert.match(migration, /limit v_limit/);
});

test("SQL contract: ranking and deterministic tie-break are explicit", () => {
  assert.match(migration, /order by t\.total_home_shots desc, ep\.player_display_name asc, ep\.player_id asc/);
});

test("SQL contract: players with zero\/no home shots are excluded", () => {
  assert.match(migration, /where t\.team_id = v_team_id\s+and t\.total_home_shots > 0/);
});

test("SQL contract: privacy boundary requires active team membership using text comparisons", () => {
  assert.match(migration, /from team_memberships tm/);
  assert.match(migration, /to_jsonb\(tm\)->>'team_id'/);
  assert.match(migration, /to_jsonb\(tm\)->>'user_id'/);
  assert.match(migration, /lower\(coalesce\(to_jsonb\(tm\)->>'status', ''\)\) = 'active'/);
});

test("SQL contract: scope validation and role filtering are explicit", () => {
  assert.match(migration, /v_scope not in \('players', 'coaches', 'all'\)/);
  assert.match(migration, /\(v_scope = 'players' and ep\.participant_role <> 'coach'\)/);
  assert.match(migration, /\(v_scope = 'coaches' and ep\.participant_role = 'coach'\)/);
});

test("SQL contract: RPC grants and schema reload are present", () => {
  assert.match(migration, /grant execute on function public\.get_team_home_shots_leaderboard\(text, text, integer, text\)/);
  assert.match(migration, /to anon, authenticated, service_role/);
  assert.match(migration, /notify pgrst, 'reload schema';/);
});


test("SQL contract: authorization supports raw requester and resolved UUID", () => {
  assert.match(migration, /resolve_app_user_uuid\(v_requester_user_id\)/);
  assert.match(migration, /\) = v_requester_user_id/);
  assert.match(migration, /\) = v_requester_uuid/);
});
