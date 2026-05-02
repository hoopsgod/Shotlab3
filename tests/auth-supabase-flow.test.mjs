import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('supabase-enabled registration calls Supabase Auth signUp', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /supabase\.auth\.signUp\(\{email:normalizedEmail,password\}\)/);
});

test('supabase-enabled login calls Supabase Auth signInWithPassword', async () => {
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
  const pendingIdx = src.indexOf('if(SUPABASE_AUTH_ENABLED&&isPendingConfirmation(authRes.data))return{ok:true,pendingConfirmation:true');
  assert.ok(setPlayersIdx > -1 && pendingIdx > -1 && setPlayersIdx < pendingIdx);
});
test('pending confirmation branch returns before setUser', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const pendingIdx = src.indexOf('if(SUPABASE_AUTH_ENABLED&&isPendingConfirmation(authRes.data))return{ok:true,pendingConfirmation:true');
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

test('signup/login auth error payloads are parsed with safe allowlist fields', async () => {
  const src = await readFile(new URL('../src/lib/supabase.js', import.meta.url), 'utf8');
  assert.match(src, /AUTH_SAFE_FIELDS = \["status", "code", "message", "error", "error_description", "msg"\]/);
  assert.match(src, /sanitizeAuthError\(payload, "auth_signup_failed", "Signup failed", response\.status\)/);
  assert.match(src, /sanitizeAuthError\(payload, "auth_login_failed", "Login failed", response\.status\)/);
});

test('register maps weak password, signup disabled, and user exists messages', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /Email signup is disabled in Supabase Auth settings\./);
  assert.match(src, /Password does not meet the required policy\./);
  assert.match(src, /Account already exists\. Please sign in\./);
});

test('login maps invalid credentials and email-not-confirmed messages', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /Invalid email or password\./);
  assert.match(src, /Please confirm your email before signing in\./);
  assert.match(src, /No Supabase Auth account found for this email\./);
});

test('auth diagnostics expose signup/login status and messages in data debug panel', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /signupHttpStatus/);
  assert.match(src, /signupCode/);
  assert.match(src, /signupMessage/);
  assert.match(src, /loginHttpStatus/);
  assert.match(src, /loginCode/);
  assert.match(src, /loginMessage/);
  assert.match(src, /providerHint/);
});

test('auth failure logs are safe and do not include password/token/header fields', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const signupLog = src.match(/console\.error\("\[auth\] signup failed",\{([^}]+)\}\)/);
  const loginLog = src.match(/console\.error\("\[auth\] login failed",\{([^}]+)\}\)/);
  assert.ok(signupLog && loginLog, 'expected auth console.error diagnostics');
  const combined = `${signupLog[1]} ${loginLog[1]}`.toLowerCase();
  assert.doesNotMatch(combined, /password|token|header|apikey|authorization|anon|service_role/);
});


test('feature flag defaults Supabase auth off unless exactly true', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /VITE_ENABLE_SUPABASE_AUTH/);
  assert.match(src, /trim\(\) === "true"/);
});

test('legacy mode bypasses Supabase signUp and signIn flows', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /if\(SUPABASE_AUTH_ENABLED\)\{\nconst authRes=await supabase\.auth\.signUp/);
  assert.match(src, /if\(SUPABASE_AUTH_ENABLED\)\{\nconst authRes=await supabase\.auth\.signInWithPassword/);
  assert.match(src, /pLocal\.password!==hashPw\(password\)/);
});

test('auth debug includes mode and supabaseEnabled state fields', async () => {
  const src = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(src, /auth:\{mode:SUPABASE_AUTH_ENABLED\?"supabase":"legacy",supabaseEnabled:SUPABASE_AUTH_ENABLED\?"yes":"no"/);
  assert.match(src, /Auth mode:/);
  assert.match(src, /Supabase auth enabled:/);
});
