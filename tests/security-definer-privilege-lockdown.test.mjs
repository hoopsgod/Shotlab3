import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migration = fs.readFileSync(new URL("../migrations/039_security_definer_privilege_lockdown.sql", import.meta.url), "utf8");
const leaderboardRoute = fs.readFileSync(new URL("../functions/v1/leaderboards/home-shots.js", import.meta.url), "utf8");
const seasonPrivileges = fs.readFileSync(new URL("../migrations/035_tighten_season_rollover_privileges.sql", import.meta.url), "utf8");

function collectSourceFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectSourceFiles(target));
    else if (/\.(js|jsx|mjs|ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

test("service-mediated security definer functions revoke public client execution", () => {
  assert.match(migration, /revoke execute on function public\.resolve_app_user_uuid\(text\)\s+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.resolve_app_user_uuid\(text\)\s+to service_role/i);

  assert.match(migration, /revoke execute on function public\.get_team_home_shots_leaderboard\(text, text, integer, text\)\s+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.get_team_home_shots_leaderboard\(text, text, integer, text\)\s+to service_role/i);

  assert.match(migration, /revoke execute on function public\.get_team_home_shots_leaderboard\(uuid, text, integer\)\s+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.get_team_home_shots_leaderboard\(uuid, text, integer\)\s+to service_role/i);
  assert.match(migration, /notify pgrst, 'reload schema'/i);
});

test("authenticated season rollover RPCs remain intentionally available", () => {
  assert.doesNotMatch(migration, /revoke execute on function public\.is_active_team_coach/i);
  assert.doesNotMatch(migration, /revoke execute on function public\.start_new_season/i);
  assert.match(seasonPrivileges, /grant execute on function public\.is_active_team_coach\(text\) to authenticated/i);
  assert.match(seasonPrivileges, /grant execute on function public\.start_new_season\(jsonb\) to authenticated/i);
  assert.match(seasonPrivileges, /revoke execute on function public\.start_new_season\(jsonb\) from public, anon/i);
});

test("leaderboard RPC is mediated by the Cloudflare service-role route", () => {
  assert.match(leaderboardRoute, /callRpc\(env, rpcName, rpcArgs\)/);
  assert.match(leaderboardRoute, /const rpcName = "get_team_home_shots_leaderboard"/);
  assert.match(leaderboardRoute, /requireApiToken\(request, env\)/);
});

test("browser application source does not call locked RPCs directly", () => {
  const srcRoot = new URL("../src", import.meta.url);
  const source = collectSourceFiles(srcRoot).map((file) => fs.readFileSync(file, "utf8")).join("\n");
  assert.doesNotMatch(source, /resolve_app_user_uuid/);
  assert.doesNotMatch(source, /get_team_home_shots_leaderboard/);
});

test("migration does not change function definitions or business tables", () => {
  assert.doesNotMatch(migration, /create\s+(or replace\s+)?function/i);
  assert.doesNotMatch(migration, /drop\s+function/i);
  assert.doesNotMatch(migration, /alter\s+table/i);
  assert.doesNotMatch(migration, /delete\s+from|update\s+public\.|insert\s+into/i);
});
