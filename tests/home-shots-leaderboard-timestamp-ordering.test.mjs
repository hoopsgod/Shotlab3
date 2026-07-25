import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(
  new URL('../migrations/038_fix_home_shots_leaderboard_timestamp_ordering.sql', import.meta.url),
  'utf8',
);

test('Home Shots leaderboard latest-name ordering uses one timestamp type', () => {
  assert.match(migration, /sl\.date::date::timestamptz/);
  assert.match(migration, /sl\.created_at/);
  assert.match(migration, /to_timestamp\(0\)/);
  assert.doesNotMatch(migration, /extract\(epoch from sl\.date::date\)::bigint \* 1000/);
});

test('Home Shots leaderboard keeps team authorization and supported scopes', () => {
  assert.match(migration, /resolve_app_user_uuid/);
  assert.match(migration, /NOT_AUTHORIZED_FOR_TEAM/);
  assert.match(migration, /v_scope not in \('players', 'coaches', 'all'\)/);
  assert.match(migration, /team_player_home_shot_totals/);
});
