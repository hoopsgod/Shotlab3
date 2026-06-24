import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/031_scores_rls_player_write_policy.sql', import.meta.url), 'utf8');


test('scores RLS migration ensures every app-sent score column exists before policies reference it', () => {
  for (const column of ['id', 'email', 'player_id', 'team_id', 'drill_id', 'src', 'score', 'date', 'ts', 'name']) {
    assert.match(migration, new RegExp(`add column if not exists ${column}\\b`, 'i'));
  }
  assert.match(migration, /alter column src set default 'home'/i);
  assert.match(migration, /update public\.scores set src = 'home' where src is null/i);
});

test('scores RLS migration grants public client score writes and reloads PostgREST schema', () => {
  assert.match(migration, /grant select, insert, update on table public\.scores to anon, authenticated/i);
  assert.match(migration, /alter table public\.scores enable row level security/i);
  assert.match(migration, /notify pgrst, 'reload schema'/i);
});

test('scores RLS migration allows only complete home or program score rows through write policy', () => {
  assert.match(migration, /scores_client_insert_player_rows/i);
  assert.match(migration, /coalesce\(trim\(id\), ''\) <> ''/i);
  assert.match(migration, /coalesce\(trim\(email\), ''\) <> ''/i);
  assert.match(migration, /coalesce\(trim\(player_id\), ''\) <> ''/i);
  assert.match(migration, /coalesce\(trim\(team_id\), ''\) <> ''/i);
  assert.match(migration, /coalesce\(nullif\(trim\(src\), ''\), 'home'\) in \('home', 'program'\)/i);
  assert.match(migration, /scores_client_update_player_rows/i);
  assert.match(migration, /scores_client_select_team_rows/i);
});
