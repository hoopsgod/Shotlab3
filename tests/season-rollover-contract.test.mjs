import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("migration creates one active season per team and an atomic idempotent RPC", async () => {
  const sql = await read("migrations/034_active_seasons_and_rollover.sql");
  assert.match(sql, /create table if not exists public\.active_seasons/i);
  assert.match(sql, /active_seasons_one_active_per_team/i);
  assert.match(sql, /create table if not exists public\.season_player_memberships/i);
  assert.match(sql, /create table if not exists public\.season_rollovers/i);
  assert.match(sql, /create or replace function public\.start_new_season\(p_plan jsonb\)/i);
  assert.match(sql, /public\.is_active_team_coach\(v_team_id\)/i);
  assert.match(sql, /where transition_id = v_transition_id/i);
  assert.match(sql, /source_archive_id text not null references public\.season_archives/i);
  assert.doesNotMatch(sql, /update\s+public\.season_archives/i);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.season_archives/i);
});

test("API validates plans and delegates persistence to the transactional RPC", async () => {
  const source = await read("functions/v1/seasons/index.js");
  assert.match(source, /MAX_PLAN_BYTES/);
  assert.match(source, /returningMemberships\.length > 500/);
  assert.match(source, /callRpc\(env, "start_new_season"/);
  assert.match(source, /enforceRateLimit/);
  assert.match(source, /x-user-id|readUserId/);
  assert.doesNotMatch(source, /season_archives.*(?:update|delete)/i);
});

test("wizard is mobile-first, reviewable, and explicitly prevents history carryover", async () => {
  const source = await read("src/components/NewSeasonWizard.jsx");
  assert.match(source, /Step \{step \+ 1\} of 4/);
  assert.match(source, /Historical results were not copied/);
  assert.match(source, /Every player defaults to Not Returning/);
  assert.match(source, /data-testid="new-season-wizard"/);
  assert.match(source, /data-testid="create-new-season"/);
  assert.match(source, /createNewSeason/);
});

test("client service only updates local active-season cache after server success", async () => {
  const source = await read("src/lib/seasonRolloverService.js");
  const persistIndex = source.indexOf("const saved = await persist");
  const successGuardIndex = source.indexOf("if (!saved?.ok)");
  const cacheIndex = source.indexOf("cacheSeasons(next)");
  assert.ok(persistIndex >= 0);
  assert.ok(successGuardIndex > persistIndex);
  assert.ok(cacheIndex > successGuardIndex);
});
