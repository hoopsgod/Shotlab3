import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() { return readFile(APP_PATH, 'utf8'); }

test('legacy registration uses backend source of truth and emits required diagnostics', async () => {
  const source = await appSource();
  assert.match(source, /const existing=SUPABASE_AUTH_ENABLED\?players\.find\(p=>normalizeEmail\(p\.email\)===normalizedEmail\):null;/);
  assert.match(source, /const registerEndpoint="\/v1\/legacy-auth\/register";/);
  assert.match(source, /const reg=await legacyAuthFetch\(registerEndpoint,\{email:normalizedEmail,password,name,role\}\);/);
  assert.match(source, /reg\.errorCode==="account_exists"\?"Account already exists\. Please sign in\."/);
  assert.match(source, /reg\.errorCode==="invalid_request"\?"Please enter a valid email, name, role, and an 8\+ character password\."/);
  assert.match(source, /reg\.errorCode==="rate_limited"\?"Too many attempts\. Wait and try again\."/);
  assert.match(source, /\(reg\.status===404\|\|reg\.parseMode!=="json"\)\?"Registration service is not deployed yet\."/);
  assert.match(source, /reg\.errorCode==="config_error"\?"Registration service is not configured correctly\."/);
  assert.match(source, /reg\.errorCode==="table_error"\?"Registration database is not ready\. Please try again shortly\."/);
  assert.match(source, /reg\.errorCode==="internal_error"\?"Registration service error\. Please try again\."/);
  assert.match(source, /console\.error\("\[legacy-auth\] register failed",\{endpoint:registerEndpoint,status:reg\.status,code:reg\.errorCode\|\|"register_failed",parseMode:reg\.parseMode\}\);/);
  assert.match(source, /registerEndpoint:"\/v1\/legacy-auth\/register"/);
  assert.match(source, /registerParseMode:""/);
  assert.match(source, /<div>Register endpoint: \{dataDebug\.auth\.registerEndpoint\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Register parse mode: \{dataDebug\.auth\.registerParseMode\|\|"none"\}<\/div>/);
  assert.match(source, /const text=await res\.text\(\);let body=\{\};let parseMode="non_json";/);
  assert.match(source, /const safeMessage=typeof body\?\.message==="string"\?body\.message:"";/);
});
