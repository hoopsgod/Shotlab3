import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("game stat table is RLS protected and browser roles receive no direct table grants", () => {
  const sql = read("migrations/055_in_season_performance_hub.sql");
  assert.match(sql, /alter table public\.player_game_stats enable row level security/i);
  assert.match(sql, /revoke all privileges on table public\.player_game_stats from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.player_game_stats to service_role/i);
  assert.doesNotMatch(sql, /raw_csv|csv_text/i);
});

test("game stat API uses authenticated team access and coach-only writes", () => {
  const endpoint = read("functions/v1/game-stats/index.js");
  assert.match(endpoint, /readAuthenticatedIdentity/);
  assert.match(endpoint, /collectTeamPriorityAccess/);
  assert.match(endpoint, /access\.writableTeamIds\.has\(teamId\)/);
  assert.match(endpoint, /coach_write_required/);
  assert.match(endpoint, /buildGameStatCsvPreview/);
  assert.match(endpoint, /file_sha256/);
});

test("players receive leaderboard aggregates and personal stats, not raw teammate stat rows", () => {
  const endpoint = read("functions/v1/game-stats/index.js");
  assert.match(endpoint, /current_leaderboards/);
  assert.match(endpoint, /program_leaderboards/);
  assert.match(endpoint, /my_current_stats/);
  assert.match(endpoint, /my_program_stats/);
  assert.match(endpoint, /\.\.\.\(canWrite \? \{ team_current_stats:/);
});

test("coach app wires In Season directly and preserves a bounded custom drill capacity", () => {
  const app = read("src/App.jsx");
  assert.match(app, /InSeasonPerformanceHub/);
  assert.match(app, /k:"in-season"/);
  assert.match(app, /tab==="in-season"/);
  assert.match(app, /updateProgramDrill/);
  assert.match(app, /countCustomInSeasonProgramDrills\(programDrills\)>=30/);
  assert.match(app, /Program drill limit reached \(7 custom drills\)/);
});

test("In Season UI requires CSV preview before commit and exposes current/program record surfaces", () => {
  const ui = read("src/components/InSeasonPerformanceHub.jsx");
  assert.match(ui, /Preview CSV/);
  assert.match(ui, /Commit verified import/);
  assert.match(ui, /Program record/);
  assert.match(ui, /Current standard/);
  assert.match(ui, /Save score/);
  assert.match(ui, /raw CSV/);
});
