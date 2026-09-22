import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/056_home_shots_leaderboard_identity_roster_contract.sql', import.meta.url), 'utf8');
const route = fs.readFileSync(new URL('../functions/v1/leaderboards/home-shots.js', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../src/lib/homeShotsLeaderboardService.js', import.meta.url), 'utf8');

test('home-shots RPC returns stable identities and only active, current-team roster records', () => {
  assert.match(migration, /returns table\(\s*rank integer,\s*player_id text,/s);
  assert.match(migration, /join profiles/);
  assert.doesNotMatch(migration, /left join profiles\s+on/s);
  assert.match(migration, /e\.is_inactive = false/);
  assert.match(migration, /e\.roster_status not in \('archived', 'removed', 'team_local_data_deleted', 'deleted', 'hidden'\)/);
  assert.match(migration, /select ranked\.rank, ranked\.player_id, ranked\.player_display_name, ranked\.total_home_shots/);
  assert.match(migration, /revoke execute on function public\.get_team_home_shots_leaderboard\(text, text, integer, text\)\s+from public, anon, authenticated/s);
  assert.match(migration, /grant execute on function public\.get_team_home_shots_leaderboard\(text, text, integer, text\)\s+to service_role/s);
});

test('browser service treats populated identity-less payloads as an unavailable integration, never a successful empty leaderboard', () => {
  assert.match(route, /playerId \? \{ player_id: playerId \} : \{\}/);
  assert.match(service, /const hasRowIdentity/);
  assert.match(service, /errorCode: 'invalid_leaderboard_rows'/);
  assert.match(service, /homeShotsLeaderboardFailureState\(\{ errorCode: 'endpoint_missing', parseMode: 'invalid_rows' \}\)/);
});
