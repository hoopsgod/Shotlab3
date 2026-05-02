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

test('pending confirmation still creates app profile before returning', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const setPlayersIdx = src.indexOf('P("sl:players",np,setPlayers)');
  const pendingIdx = src.indexOf('if(isPendingConfirmation(authRes.data))return{ok:true,pendingConfirmation:true');
  assert.ok(setPlayersIdx > -1 && pendingIdx > -1 && setPlayersIdx < pendingIdx);
});
test('pending confirmation branch returns before setUser', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const pendingIdx = src.indexOf('if(isPendingConfirmation(authRes.data))return{ok:true,pendingConfirmation:true');
  const setUserIdx = src.indexOf('setUser({email:normalizedEmail,role,isCoach:role==="coach",name,teamId:null,hideFromLeaderboards:false})');
  assert.ok(pendingIdx > -1 && setUserIdx > -1 && pendingIdx < setUserIdx);
});

test('durable session data includes refresh token and refresh flow', async () => {
  const src = await readFile(new URL('../src/lib/supabase.js', import.meta.url), 'utf8');
  assert.match(src, /sl:supabase-session/);
  assert.match(src, /refresh_token/);
  assert.match(src, /grant_type=refresh_token/);
});

test('session restore retries refresh when user endpoint 401s', async () => {
  const src = await readFile(new URL('../src/lib/supabase.js', import.meta.url), 'utf8');
  assert.match(src, /response\.status === 401 && refreshToken/);
});

test('missing profile after successful auth is not invalid login', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /Login succeeded, but profile was not found\./);
});

test('login after confirmation can find normalized profile email', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /players\.find\(p=>normalizeEmail\(p\.email\)===normalizedEmail\)/);
});

test('login handler awaits async auth result', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /const doLogin=async\(\)=>/);
  assert.match(src, /const r=await onLogin\(id,password\)/);
});
