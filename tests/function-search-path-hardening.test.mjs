import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync(
  new URL("../migrations/040_function_search_path_hardening.sql", import.meta.url),
  "utf8",
);
const compact = migration.replace(/\s+/g, " ").trim().toLowerCase();

const EXPECTED_SIGNATURES = [
  "_leaderboard_apply_home_shot_delta(text, text, bigint)",
  "_leaderboard_parse_made(jsonb)",
  "_leaderboard_parse_player_id(jsonb)",
  "_leaderboard_parse_team_id(jsonb)",
  "coach_signup_create_team_and_invite(text, text, integer, integer)",
  "confirm_team_invite_join_from_context(text, text, text, text)",
  "ensure_team_invite_code_for_legacy_restore(text, text)",
  "hash_invite_code(text)",
  "lookup_team_invite_by_code(text)",
  "normalize_invite_code(text)",
  "random_invite_code(integer)",
  "reject_season_archive_mutation()",
  "resolve_team_invite_context(text, text, integer)",
  "shot_logs_use_roster_player_key()",
  "trg_team_player_home_shot_totals_sync()",
];

test("all advisor-flagged function signatures receive a fixed trusted search path", () => {
  for (const signature of EXPECTED_SIGNATURES) {
    assert.ok(
      compact.includes(`alter function public.${signature} set search_path = public, extensions;`),
      `missing fixed search_path for ${signature}`,
    );
  }
  assert.equal((compact.match(/set search_path = public, extensions;/g) || []).length, EXPECTED_SIGNATURES.length);
  assert.match(compact, /notify pgrst, 'reload schema';/);
});

test("hardening migration changes function configuration only", () => {
  assert.doesNotMatch(migration, /create\s+(or replace\s+)?function/i);
  assert.doesNotMatch(migration, /drop\s+function/i);
  assert.doesNotMatch(migration, /alter\s+table/i);
  assert.doesNotMatch(migration, /create\s+policy|drop\s+policy/i);
  assert.doesNotMatch(migration, /insert\s+into|update\s+public\.|delete\s+from/i);
  assert.doesNotMatch(migration, /revoke\s+execute|grant\s+execute/i);
});

test("trusted path includes public application objects and pgcrypto extensions", () => {
  assert.match(migration, /search_path\s*=\s*public,\s*extensions/i);
  assert.doesNotMatch(migration, /search_path\s*=\s*['"]?\$user/i);
  assert.doesNotMatch(migration, /pg_temp/i);
});

test("migration covers invite, leaderboard, archive, and shot-log function groups", () => {
  const groups = {
    invite: ["hash_invite_code", "resolve_team_invite_context", "confirm_team_invite_join_from_context"],
    leaderboard: ["_leaderboard_parse_team_id", "_leaderboard_apply_home_shot_delta", "trg_team_player_home_shot_totals_sync"],
    archive: ["reject_season_archive_mutation"],
    shotLogs: ["shot_logs_use_roster_player_key"],
  };
  for (const [group, names] of Object.entries(groups)) {
    for (const name of names) assert.match(migration, new RegExp(`public\\.${name}\\b`, "i"), group);
  }
});