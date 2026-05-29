import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration = fs.readFileSync(
  new URL('../migrations/029_durable_shot_logs_schema_repair.sql', import.meta.url),
  'utf8',
)

test('shot_logs schema repair migration preserves required live leaderboard columns and defaults', () => {
  assert.match(migration, /create extension if not exists pgcrypto;/i)
  assert.match(migration, /create table if not exists public\.shot_logs \(/i)
  assert.match(migration, /id text primary key default gen_random_uuid\(\)::text/i)
  assert.match(migration, /email text/i)
  assert.match(migration, /name text/i)
  assert.match(migration, /player_id text/i)
  assert.match(migration, /team_id text/i)
  assert.match(migration, /drill_id text/i)
  assert.match(migration, /session_id text/i)
  assert.match(migration, /made numeric default 0/i)
  assert.match(migration, /attempted_shots integer/i)
  assert.match(migration, /date text/i)
  assert.match(migration, /created_at timestamptz default now\(\)/i)
  assert.match(migration, /ts timestamptz default now\(\)/i)
  assert.match(migration, /alter column id drop identity if exists/i)
  assert.match(migration, /alter column id type text using id::text/i)
  assert.match(migration, /alter column id set default gen_random_uuid\(\)::text/i)
})

test('shot_logs schema repair migration keeps indexes and PostgREST reload', () => {
  assert.match(migration, /create index if not exists idx_shot_logs_team_id\s+on public\.shot_logs\(team_id\);/i)
  assert.match(migration, /create index if not exists idx_shot_logs_player_id\s+on public\.shot_logs\(player_id\);/i)
  assert.match(migration, /create index if not exists idx_shot_logs_session_id\s+on public\.shot_logs\(session_id\);/i)
  assert.match(migration, /create index if not exists idx_shot_logs_team_player\s+on public\.shot_logs\(team_id, player_id\);/i)
  assert.match(migration, /select pg_notify\('pgrst', 'reload schema'\);/i)
})
