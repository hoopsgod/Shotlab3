import test from 'node:test';
import assert from 'node:assert/strict';

import {
  acquireConsumeSingleFlight,
  buildConsumeInFlightKey,
  clearConsumeGuard,
  CONSUME_GUARD_STALE_MS,
} from '../src/lib/joinConsumeGuard.js';

function createState() {
  return { active: false, key: '', startedAt: 0, lastClearedAt: 0, lastClearedReason: '', promise: null, abortController: null };
}

test('first click starts one fetch (single-flight started mode)', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  let fetchCalls = 0;
  const acquired = acquireConsumeSingleFlight(state, {
    key,
    now: 100,
    start: () => {
      fetchCalls += 1;
      return { promise: Promise.resolve('ok') };
    },
  });
  assert.equal(acquired.mode, 'started');
  assert.equal(fetchCalls, 1);
});

test('rapid duplicate click joins existing promise and does not trigger second call', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  let fetchCalls = 0;
  const first = acquireConsumeSingleFlight(state, {
    key,
    now: 100,
    start: () => {
      fetchCalls += 1;
      return { promise: new Promise((resolve) => setTimeout(() => resolve('done'), 5)) };
    },
  });
  const second = acquireConsumeSingleFlight(state, {
    key,
    now: 101,
    start: () => {
      fetchCalls += 1;
      return { promise: Promise.resolve('should-not-run') };
    },
  });
  assert.equal(first.mode, 'started');
  assert.equal(second.mode, 'joined');
  assert.equal(fetchCalls, 1);
  assert.equal(await second.promise, 'done');
});

test('failed fetch path can clear guard and retry', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  acquireConsumeSingleFlight(state, { key, now: 100, start: () => ({ promise: Promise.resolve('fail') }) });
  clearConsumeGuard(state, 120, 'failed_response');
  const retry = acquireConsumeSingleFlight(state, { key, now: 121, start: () => ({ promise: Promise.resolve('retry') }) });
  assert.equal(retry.mode, 'started');
});

test('thrown exception path can clear guard and retry', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  acquireConsumeSingleFlight(state, { key, now: 100, start: () => ({ promise: Promise.resolve('boom') }) });
  clearConsumeGuard(state, 125, 'exception');
  const retry = acquireConsumeSingleFlight(state, { key, now: 126, start: () => ({ promise: Promise.resolve('retry') }) });
  assert.equal(retry.mode, 'started');
});

test('timeout path can clear guard and retry', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  acquireConsumeSingleFlight(state, { key, now: 100, start: () => ({ promise: Promise.resolve('timeout') }) });
  clearConsumeGuard(state, 130, 'consume_fetch_timeout');
  const retry = acquireConsumeSingleFlight(state, { key, now: 131, start: () => ({ promise: Promise.resolve('retry') }) });
  assert.equal(retry.mode, 'started');
});

test('stale lock older than 15 seconds is cleared and retry starts', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  let fetchCalls = 0;
  acquireConsumeSingleFlight(state, { key, now: 100, start: () => ({ promise: Promise.resolve('first') }) });
  const retry = acquireConsumeSingleFlight(state, {
    key,
    now: 100 + CONSUME_GUARD_STALE_MS + 1,
    start: () => {
      fetchCalls += 1;
      return { promise: Promise.resolve('retry') };
    },
  });
  assert.equal(retry.mode, 'started');
  assert.equal(fetchCalls, 1);
});

test('clearConsumeGuard resets promise/abort controller state for retries', async () => {
  const state = createState();
  const key = buildConsumeInFlightKey({ email: 'jenn@gmail.com', inviteCode: 'ABCD1234', joinContextToken: 'ctx-1', teamId: 'team-1' });
  const abortController = { aborted: false, abort() { this.aborted = true; } };
  acquireConsumeSingleFlight(state, {
    key,
    now: 100,
    start: () => ({ promise: Promise.resolve('ok'), abortController }),
  });
  clearConsumeGuard(state, 120, 'consume_request_complete');
  assert.equal(state.active, false);
  assert.equal(state.key, '');
  assert.equal(state.promise, null);
  assert.equal(state.abortController, null);
});
