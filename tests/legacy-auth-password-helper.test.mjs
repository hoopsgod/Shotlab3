import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { hashLegacyPassword, verifyLegacyPassword } from '../functions/v1/legacy-auth/_password.js';

test('hashLegacyPassword returns stable hash for same password/salt', async () => {
  const salt = '00112233445566778899aabbccddeeff';
  const a = await hashLegacyPassword('Password123!', salt);
  const b = await hashLegacyPassword('Password123!', salt);
  assert.equal(a, b);
});

test('hashLegacyPassword returns different hashes for different salts', async () => {
  const a = await hashLegacyPassword('Password123!', '00112233445566778899aabbccddeeff');
  const b = await hashLegacyPassword('Password123!', 'ffeeddccbbaa99887766554433221100');
  assert.notEqual(a, b);
});

test('verifyLegacyPassword succeeds for correct password and fails for wrong password', async () => {
  const salt = '00112233445566778899aabbccddeeff';
  const hash = await hashLegacyPassword('Password123!', salt);
  assert.equal(await verifyLegacyPassword('Password123!', salt, hash), true);
  assert.equal(await verifyLegacyPassword('wrong', salt, hash), false);
});

test('register, login, and update-profile use shared password helper', async () => {
  const register = await readFile(new URL('../functions/v1/legacy-auth/register/index.js', import.meta.url), 'utf8');
  const login = await readFile(new URL('../functions/v1/legacy-auth/login/index.js', import.meta.url), 'utf8');
  const update = await readFile(new URL('../functions/v1/legacy-auth/update-profile/index.js', import.meta.url), 'utf8');
  assert.match(register, /import \{ hashLegacyPassword \} from "\.\.\/_password\.js";/);
  assert.match(register, /hashLegacyPassword\(password, saltHex\)/);
  assert.match(login, /import \{ verifyLegacyPassword \} from "\.\.\/_password\.js";/);
  assert.match(login, /verifyLegacyPassword\(password,row\.password_salt\|\|"",row\.password_hash\|\|""\)/);
  assert.match(update, /import \{ verifyLegacyPassword \} from "\.\.\/_password\.js";/);
  assert.match(update, /verifyLegacyPassword\(password,row\.password_salt\|\|"",row\.password_hash\|\|""\)/);
});

test('register keeps hash_password stage on hashing failures and avoids sensitive logging/returns', async () => {
  const register = await readFile(new URL('../functions/v1/legacy-auth/register/index.js', import.meta.url), 'utf8');
  const login = await readFile(new URL('../functions/v1/legacy-auth/login/index.js', import.meta.url), 'utf8');
  const update = await readFile(new URL('../functions/v1/legacy-auth/update-profile/index.js', import.meta.url), 'utf8');
  assert.match(register, /stage: "hash_password"/);
  assert.match(register, /Response\.json\(\{ error: safeCode, stage \}, \{ status: 500 \}\)/);
  const joined = `${register}\n${login}\n${update}`;
  assert.doesNotMatch(joined, /Response\.json\([^)]*password_hash/);
  assert.doesNotMatch(joined, /Response\.json\([^)]*password_salt/);
  assert.doesNotMatch(joined, /console\.log\([^\n]*password/i);
  assert.doesNotMatch(joined, /console\.log\([^\n]*service[_-]?role/i);
});
