import test from 'node:test';
import assert from 'node:assert/strict';
import { isPendingConfirmation, normalizeEmail, resolveExpiresAt, upsertPlayerProfile } from '../src/lib/authFlow.js';

test('normalizeEmail trims and lowercases', () => {
  assert.equal(normalizeEmail('  TeSt@Example.com  '), 'test@example.com');
});

test('pending confirmation true when no access token', () => {
  assert.equal(isPendingConfirmation({}), true);
  assert.equal(isPendingConfirmation({ access_token: '' }), true);
  assert.equal(isPendingConfirmation({ access_token: 'tok' }), false);
});

test('upsertPlayerProfile creates and updates normalized profile row', () => {
  const initial = [];
  const created = upsertPlayerProfile(initial, { email: 'User@Mail.com', name: 'A', role: 'player', teamId: null, hideFromLeaderboards: false, password: 'h' });
  assert.equal(created.length, 1);
  assert.equal(created[0].email, 'user@mail.com');

  const updated = upsertPlayerProfile(created, { email: ' USER@mail.com ', name: 'B', role: 'coach', teamId: null, hideFromLeaderboards: false, password: 'h2' });
  assert.equal(updated.length, 1);
  assert.equal(updated[0].name, 'B');
  assert.equal(updated[0].role, 'coach');
});

test('resolveExpiresAt computes from expires_in when expires_at is missing', () => {
  assert.equal(resolveExpiresAt({ expires_in: 120 }, 1000), 1120);
  assert.equal(resolveExpiresAt({ expires_at: 555, expires_in: 120 }, 1000), 555);
  assert.equal(resolveExpiresAt({}, 1000), null);
});
