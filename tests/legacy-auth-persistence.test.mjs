import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('legacy register/login endpoints used when Supabase Auth flag is off', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /legacy-auth\/register/);
  assert.match(src, /legacy-auth\/login/);
  assert.doesNotMatch(src, /pLocal\.password!==hashPw\(password\)/);
});

test('legacy auth response never uses password_hash/salt on frontend', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /password_hash|password_salt/);
});

test('refresh restore uses sl:session email against backend profile endpoint', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /DB\.get\("sl:session"\)/);
  assert.match(src, /legacy-auth\/update-profile",\{email:authEmail\}/);
});

test('team updates persist to legacy auth profile', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /legacy-auth\/update-profile",\{email:user\.email,team_id:nt\.id\}/);
  assert.match(src, /legacy-auth\/update-profile",\{email:user\.email,team_id:resolvedTeamId\}/);
});

test('legacy auth backend never returns password fields', async () => {
  const register = await readFile(new URL('../functions/v1/legacy-auth/register.js', import.meta.url), 'utf8');
  const login = await readFile(new URL('../functions/v1/legacy-auth/login.js', import.meta.url), 'utf8');
  assert.match(register, /safeProfile/);
  assert.match(login, /safeProfile/);
  assert.doesNotMatch(register, /return Response\.json\([^)]*password_hash/);
});
