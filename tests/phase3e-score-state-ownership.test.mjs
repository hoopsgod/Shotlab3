import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  createScorePersistenceService,
  hasPendingScoreRows,
  reconcilePendingScoreRows,
} from '../src/lib/scorePersistenceService.js';
import { hydrateAuthenticatedCollectionsToStorage } from '../src/lib/legacySignedCollectionPersistence.js';

const EMAIL = 'player@example.com';
const TEAM = 'team-a';
const SCORE = { id: 'score-pending', email: EMAIL, playerId: EMAIL, teamId: TEAM, drillId: 'drill-1', score: 42, date: '2026-09-04', ts: 1 };

class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const session = (email = EMAIL, teamId = TEAM) => JSON.stringify({ email, rp: `${email}\t${teamId}` });
const response = (body, ok = true, status = ok ? 200 : 503) => ({ ok, status, json: async () => body });

async function leavePending(storage, score = SCORE) {
  const service = createScorePersistenceService({
    storage,
    fetchImpl: async () => response({ error: 'score_write_failed' }, false),
  });
  await assert.rejects(service.upsertScores([score]), /score_write_failed/);
}

test('failed signed score write leaves exact identity/team/id pending truth', async () => {
  const storage = new MemoryStorage({ 'sl:session': session() });
  await leavePending(storage);
  assert.equal(storage.getItem('sl:sp'), `${EMAIL}\t${TEAM}\t${SCORE.id}`);
  assert.equal(hasPendingScoreRows(storage, EMAIL), true);
});

test('successful signed score write clears the pending id only after server confirmation', async () => {
  const storage = new MemoryStorage({ 'sl:session': session() });
  let markerDuringRequest = '';
  const service = createScorePersistenceService({
    storage,
    fetchImpl: async () => {
      markerDuringRequest = storage.getItem('sl:sp');
      return response({ ok: true, scores: [SCORE], storage_mode: 'signed_api' });
    },
  });
  await service.upsertScores([SCORE]);
  assert.equal(markerDuringRequest, `${EMAIL}\t${TEAM}\t${SCORE.id}`);
  assert.equal(storage.getItem('sl:sp'), null);
});

test('score reconciliation preserves only pending local rows while remote truth owns everything else', async () => {
  const stale = { ...SCORE, id: 'score-stale', score: 7 };
  const remote = { ...SCORE, id: 'score-remote', score: 99 };
  const storage = new MemoryStorage({
    'sl:session': session(),
    'sl:scores': JSON.stringify([SCORE, stale]),
  });
  await leavePending(storage);

  const rows = reconcilePendingScoreRows({ storage, requester: EMAIL, localRows: [SCORE, stale], remoteRows: [remote] });
  assert.deepEqual(rows.map((row) => row.id), [remote.id, SCORE.id]);
  assert.equal(rows.some((row) => row.id === stale.id), false);
  assert.equal(storage.getItem('sl:sp'), `${EMAIL}\t${TEAM}\t${SCORE.id}`);
});

test('matching remote score becomes authoritative and clears stale pending state', async () => {
  const storage = new MemoryStorage({
    'sl:session': session(),
    'sl:scores': JSON.stringify([SCORE]),
  });
  await leavePending(storage);
  const remote = { ...SCORE, score: 51, team_id: TEAM, player_id: EMAIL };

  const rows = reconcilePendingScoreRows({ storage, requester: EMAIL, localRows: [SCORE], remoteRows: [remote] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].score, 51);
  assert.equal(storage.getItem('sl:sp'), null);
});

test('pending score scope cannot cross identity/team boundaries', async () => {
  const storage = new MemoryStorage({ 'sl:session': session() });
  await leavePending(storage);
  storage.setItem('sl:session', session(EMAIL, 'team-b'));
  const remote = [{ ...SCORE, id: 'team-b-score', teamId: 'team-b', score: 33 }];

  assert.equal(hasPendingScoreRows(storage, EMAIL), false);
  assert.deepEqual(reconcilePendingScoreRows({ storage, requester: EMAIL, localRows: [SCORE], remoteRows: remote }), remote);
});

test('successful own-score deletion clears stale pending ownership for that player/team', async () => {
  const storage = new MemoryStorage({ 'sl:session': session() });
  await leavePending(storage);
  const service = createScorePersistenceService({
    storage,
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, 'DELETE');
      return response({ ok: true, deleted_count: 1, storage_mode: 'signed_api' });
    },
  });
  await service.deletePlayerScores({ teamId: TEAM, playerIdentity: EMAIL });
  assert.equal(storage.getItem('sl:sp'), null);
});

test('registered post-auth hydration keeps a failed local score without preserving unrelated stale scores', async () => {
  const stale = { ...SCORE, id: 'score-stale', score: 8 };
  const remote = { ...SCORE, id: 'score-remote', score: 90 };
  const storage = new MemoryStorage({
    'sl:session': session(),
    'sl:players': JSON.stringify([{ id: 'player-a', email: EMAIL, role: 'player', teamId: TEAM }]),
    'sl:scores': JSON.stringify([SCORE, stale]),
  });
  await leavePending(storage);

  const payloads = {
    '/v1/teams': { teams: [{ id: TEAM, name: 'A' }] },
    '/v1/players': { players: [{ id: 'player-a', email: EMAIL, role: 'player', teamId: TEAM }] },
    '/v1/player-profiles': { profiles: [] },
    '/v1/scores': { scores: [remote] },
    '/v1/program-scores': { program_scores: [] },
    '/v1/shot-logs': { shot_logs: [] },
    '/v1/events': { events: [] },
    '/v1/rsvps': { rsvps: [] },
    '/v1/strength-conditioning': { sessions: [], rsvps: [], logs: [] },
  };
  const result = await hydrateAuthenticatedCollectionsToStorage({
    storage,
    expectedIdentity: EMAIL,
    groupAttempts: 1,
    fetchImpl: async (url) => response({ ok: true, storage_mode: 'signed_api', ...payloads[url] }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.pending, ['sl:scores']);
  assert.deepEqual(JSON.parse(storage.getItem('sl:scores')).map((row) => row.id), [remote.id, SCORE.id]);
});

test('Phase 3E keeps score ownership out of App.jsx and centralizes score-only pending state after Phase 3D', () => {
  const enhancer = fs.readFileSync(new URL('../scripts/apply-phase3e-score-state-ownership.mjs', import.meta.url), 'utf8');
  const routes = fs.readFileSync(new URL('../scripts/run-route-enhancers.mjs', import.meta.url), 'utf8');
  const hydration = fs.readFileSync(new URL('../src/lib/legacySignedCollectionPersistence.js', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.match(enhancer, /hasPendingScoreRows/);
  assert.match(enhancer, /reconcilePendingScoreRows/);
  assert.match(enhancer, /App\.jsx remains uninjected/);
  assert.doesNotMatch(app, /hasPendingScoreRows|reconcilePendingScoreRows/);
  assert.doesNotMatch(enhancer, /sl:program-scores/);
  assert.ok(routes.indexOf('apply-phase3e-score-state-ownership.mjs') > routes.indexOf('apply-phase3d-rsvp-state-ownership.mjs'));
  assert.match(hydration, /storageKey\s*===\s*\"sl:scores\"[\s\S]*reconcilePendingScoreRows/);
  assert.doesNotMatch(hydration, /storageKey\s*===\s*\"sl:program-scores\"\s*\?\s*reconcilePendingScoreRows/);
});
