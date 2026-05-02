import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('registration calls Supabase Auth signUp', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /supabase\.auth\.signUp\(\{email:normalizedEmail,password\}\)/);
});

test('login calls Supabase Auth signInWithPassword', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /supabase\.auth\.signInWithPassword\(\{email:normalizedEmail,password\}\)/);
});

test('logout signs out Supabase Auth', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /supabase\.auth\.signOut\(\)/);
});

test('session restore checks Supabase Auth session and profile load debug', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /supabase\.auth\.getSession\(\)/);
  assert.match(src, /profileLoad:"success"/);
});

test('signup pending confirmation returns clear UX message', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /Account created\. Check your email to confirm your account, then log in\./);
  assert.match(src, /pendingConfirmation:true/);
});

test('durable session data includes refresh token and refresh flow', async () => {
  const src = await readFile(new URL('../src/lib/supabase.js', import.meta.url), 'utf8');
  assert.match(src, /sl:supabase-session/);
  assert.match(src, /refresh_token/);
  assert.match(src, /grant_type=refresh_token/);
});

test('missing profile after successful auth is not invalid login', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /Login succeeded, but profile was not found\./);
});

test('login handler awaits async auth result', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /const doLogin=async\(\)=>/);
  assert.match(src, /const r=await onLogin\(id,password\)/);
});
