import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildConsumeInFlightKey,
  clearConsumeGuard,
  evaluateConsumeGuard,
  markConsumeGuardStarted,
} from '../src/lib/joinConsumeGuard.js';

function createState() {
  return { active: false, key: '', startedAt: 0, lastClearedAt: 0, lastClearedReason: '' };
}

test('single consume attempt would trigger exactly one fetch execution', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  let fetchCalls = 0;
  markConsumeGuardStarted(state, key, 100);
  fetchCalls += 1;
  const status = evaluateConsumeGuard(state, key, 101);
  assert.equal(status.blocked, true);
  assert.equal(fetchCalls, 1);
  clearConsumeGuard(state, 110, 'done');
  const next = evaluateConsumeGuard(state, key, 111);
  assert.equal(next.blocked, false);
});

test('rapid duplicate attempt is blocked while first request is active', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  let fetchCalls = 0;
  markConsumeGuardStarted(state, key, 100);
  fetchCalls += 1;
  const duplicate = evaluateConsumeGuard(state, key, 101);
  assert.equal(duplicate.blocked, true);
  assert.equal(duplicate.reason, 'active_request');
  assert.equal(fetchCalls, 1);
});

test('failed consume can retry after guard is cleared', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  markConsumeGuardStarted(state, key, 100);
  clearConsumeGuard(state, 120, 'failed_response');
  const retry = evaluateConsumeGuard(state, key, 121);
  assert.equal(retry.blocked, false);
});

test('thrown consume can retry after guard is cleared', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  markConsumeGuardStarted(state, key, 100);
  clearConsumeGuard(state, 125, 'exception');
  const retry = evaluateConsumeGuard(state, key, 126);
  assert.equal(retry.blocked, false);
});

test('stale lock older than 10 seconds is auto-cleared', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  markConsumeGuardStarted(state, key, 100);
  const status = evaluateConsumeGuard(state, key, 10_500);
  assert.equal(status.blocked, false);
  assert.equal(status.staleCleared, true);
  assert.equal(state.active, false);
});
