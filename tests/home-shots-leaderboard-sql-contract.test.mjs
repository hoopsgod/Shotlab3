import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(new URL("../migrations/008_home_shots_leaderboard_summary.sql", import.meta.url), "utf8");

test("SQL contract: leaderboard RPC enforces top-10 limit", () => {
  assert.match(migration, /v_limit integer := greatest\(1, least\(coalesce\(p_limit, 10\), 10\)\)/);
  assert.match(migration, /limit v_limit/);
});

test("SQL contract: ranking and deterministic tie-break are explicit", () => {
  assert.match(migration, /order by t\.total_home_shots desc, ep\.player_display_name asc, ep\.player_id asc/);
});

test("SQL contract: players with zero/no home shots are excluded", () => {
  assert.match(migration, /where t\.team_id = p_team_id::text\s+and t\.total_home_shots > 0/);
});

test("SQL contract: privacy boundary requires active team membership", () => {
  assert.match(migration, /from team_memberships tm/);
  assert.match(migration, /tm\.team_id = p_team_id/);
  assert.match(migration, /tm\.user_id = trim\(p_requester_user_id\)/);
  assert.match(migration, /tm\.status = 'active'/);
});
