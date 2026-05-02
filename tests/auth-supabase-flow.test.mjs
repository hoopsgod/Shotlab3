import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('registration calls Supabase Auth signUp', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /supabase\.auth\.signUp\(\{email,password\}\)/);
});

test('login calls Supabase Auth signInWithPassword', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /supabase\.auth\.signInWithPassword\(\{email,password\}\)/);
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
