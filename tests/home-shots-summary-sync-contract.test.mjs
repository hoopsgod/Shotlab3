import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const summaryMigration = fs.readFileSync(new URL("../migrations/008_home_shots_leaderboard_summary.sql", import.meta.url), "utf8");

test("summary contract: shot_logs team/player aliases roll up into team_player_home_shot_totals", () => {
  assert.match(summaryMigration, /create table if not exists team_player_home_shot_totals/);
  assert.match(summaryMigration, /coalesce\(payload->>'team_id', payload->>'teamId', ''\)/);
  assert.match(summaryMigration, /coalesce\(payload->>'player_id', payload->>'playerId', payload->>'email', ''\)/);
  assert.match(summaryMigration, /coalesce\(payload->>'made', ''\) ~ '\^\[0-9\]\+\$'/);
});

test("summary contract: trigger keeps totals in sync on insert, update, and delete", () => {
  assert.match(summaryMigration, /create or replace function trg_team_player_home_shot_totals_sync\(\)/);
  assert.match(summaryMigration, /after insert or update or delete on shot_logs/);
  assert.match(summaryMigration, /perform _leaderboard_apply_home_shot_delta\(old_team_id, old_player_id, -old_made\)/);
  assert.match(summaryMigration, /perform _leaderboard_apply_home_shot_delta\(new_team_id, new_player_id, new_made\)/);
});
