import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../migrations/032_program_scores_table.sql', import.meta.url), 'utf8');

test('program scores migration creates dedicated program_scores table with required columns and indexes', () => {
  assert.match(migration, /create table if not exists public\.program_scores/i);
  for (const column of ['id text primary key', 'team_id text not null', 'player_id text not null', 'player_email text not null', 'player_name text', 'drill_id text not null', 'drill_name text not null', 'score numeric not null', 'session_date text', "src text default 'program'"]) {
    assert.match(migration, new RegExp(column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.match(migration, /program_scores_team_drill_idx/i);
  assert.match(migration, /on public\.program_scores \(team_id, drill_id\)/i);
  assert.match(migration, /program_scores_team_player_idx/i);
  assert.match(migration, /program_scores_logged_at_idx/i);
});

test('program scores migration enables RLS and requires complete program rows', () => {
  assert.match(migration, /alter table public\.program_scores enable row level security/i);
  assert.match(migration, /grant select, insert, update on table public\.program_scores to anon, authenticated/i);
  assert.match(migration, /program_scores_client_select/i);
  assert.match(migration, /program_scores_client_insert/i);
  assert.match(migration, /program_scores_client_update/i);
  for (const required of ['id', 'team_id', 'player_id', 'player_email', 'drill_id', 'drill_name']) {
    assert.match(migration, new RegExp(`coalesce\\(trim\\(${required}\\), ''\\) <> ''`, 'i'));
  }
  assert.match(migration, /score is not null/i);
  assert.match(migration, /score >= 0/i);
  assert.match(migration, /src = 'program'/i);
  assert.match(migration, /notify pgrst, 'reload schema'/i);
});
