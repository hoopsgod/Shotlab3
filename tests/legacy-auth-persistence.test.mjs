import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('legacy register/login endpoints used when Supabase Auth flag is off', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /legacy-auth\/register/);
  assert.match(src, /legacy-auth\/login/);
});

test('login remoteProfile is declared outside legacy branch scope', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /let remoteProfile=null/);
  assert.match(src, /remoteProfile=normalizeLegacyProfile/);
});

test('refresh restore uses dedicated restore endpoint', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /legacy-auth\/restore",\{email:authEmail\}/);
});

test('team updates persist to legacy auth profile with password proof', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /legacy-auth\/update-profile",\{email:user\.email,password:legacyAuthSecretRef\.current\?\.password\|\|"",team_id:nt\.id\}/);
  assert.match(src, /legacy-auth\/update-profile",\{email:user\.email,password:legacyAuthSecretRef\.current\?\.password\|\|"",team_id:resolvedTeamId\}/);
});

test('update-profile endpoint requires password and restore endpoint is read-only', async () => {
  const update = await readFile(new URL('../functions/v1/legacy-auth/update-profile.js', import.meta.url), 'utf8');
  const restore = await readFile(new URL('../functions/v1/legacy-auth/restore.js', import.meta.url), 'utf8');
  assert.match(update, /if\(!email\|\|!password\)return Response\.json\(\{error:"unauthorized"\},\{status:401\}\)/);
  assert.match(update, /password_hash,password_salt/);
  assert.match(restore, /select=email,name,role,team_id,hide_from_leaderboards/);
  assert.doesNotMatch(restore, /updateRows\(/);
});

test('update-profile and restore return safe fields only', async () => {
  const update = await readFile(new URL('../functions/v1/legacy-auth/update-profile.js', import.meta.url), 'utf8');
  const restore = await readFile(new URL('../functions/v1/legacy-auth/restore.js', import.meta.url), 'utf8');
  assert.match(update, /safeProfile/);
  assert.match(restore, /safeProfile/);
  assert.doesNotMatch(update, /Response\.json\([^)]*password_hash/);
  assert.doesNotMatch(restore, /Response\.json\([^)]*password_hash/);
});


test('migration locks down legacy_auth_profiles with RLS, revokes frontend roles, and grants service_role', async () => {
  const migration = await readFile(new URL('../migrations/025_persistent_legacy_auth_profiles.sql', import.meta.url), 'utf8');
  assert.match(migration, /alter table public\.legacy_auth_profiles enable row level security;/i);
  assert.match(migration, /revoke all on table public\.legacy_auth_profiles from anon;/i);
  assert.match(migration, /revoke all on table public\.legacy_auth_profiles from authenticated;/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.legacy_auth_profiles to service_role;/i);
});

test('all legacy auth endpoints avoid returning password_hash/password_salt in responses', async () => {
  const register = await readFile(new URL('../functions/v1/legacy-auth/register.js', import.meta.url), 'utf8');
  const login = await readFile(new URL('../functions/v1/legacy-auth/login.js', import.meta.url), 'utf8');
  const restore = await readFile(new URL('../functions/v1/legacy-auth/restore.js', import.meta.url), 'utf8');
  const update = await readFile(new URL('../functions/v1/legacy-auth/update-profile.js', import.meta.url), 'utf8');
  const joined = `${register}
${login}
${restore}
${update}`;
  assert.match(joined, /safeProfile/);
  assert.doesNotMatch(joined, /Response\.json\([^)]*password_hash/);
  assert.doesNotMatch(joined, /Response\.json\([^)]*password_salt/);
});
