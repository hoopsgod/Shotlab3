import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('register endpoint includes stage-specific error responses and safe logging', async () => {
  const source = await readFile(new URL('../functions/v1/legacy-auth/register/index.js', import.meta.url), 'utf8');
  for (const stage of [
    'parse_request',
    'validate_request',
    'select_existing_profile',
    'generate_salt',
    'hash_password',
    'insert_legacy_profile',
    'safe_profile_response',
  ]) {
    assert.match(source, new RegExp(`stage: \"${stage}\"`));
  }
  assert.match(source, /Response\.json\(\{ error: safeCode, stage \}, \{ status: 500 \}\)/);
  assert.match(source, /endpoint, stage, code, message/);
  assert.doesNotMatch(source, /console\.error\([^\n]*password/i);
  assert.doesNotMatch(source, /console\.error\([^\n]*SUPABASE_SERVICE_ROLE_KEY/i);
});

test('frontend maps register stage-specific errors to helpful messages and debug fields', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /reg\.errorCode===\"config_error\"\?\"Registration service is not configured correctly\.\"/);
  assert.match(source, /reg\.errorCode===\"table_error\"&&reg\.errorStage===\"select_existing_profile\"\?\"Registration database lookup failed\.\"/);
  assert.match(source, /reg\.errorCode===\"table_error\"&&reg\.errorStage===\"insert_legacy_profile\"\?\"Registration database insert failed\.\"/);
  assert.match(source, /reg\.errorCode===\"internal_error\"&&reg\.errorStage===\"hash_password\"\?\"Registration password setup failed\.\"/);
  assert.match(source, /reg\.errorCode===\"internal_error\"&&reg\.errorStage===\"insert_legacy_profile\"\?\"Registration profile save failed\.\"/);
  assert.match(source, /signupStage/);
  assert.match(source, /signupHttpStatus/);
  assert.match(source, /signupCode/);
  assert.match(source, /registerParseMode/);
});
