import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppRows, mergeHydratedRows } from '../src/lib/remotePersistence.js';

test('sl:events hydration preserves local event when remote is incomplete', () => {
  const merged = mergeHydratedRows('sl:events', [{ id: 'bad', team_id: '', owner_coach_id: '' }], [{ id: 'e1', teamId: 't1', ownerCoachId: 'c@x.com', title: 'Local' }]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'e1');
});

test('sl:players hydration preserves local player when remote is incomplete', () => {
  const merged = mergeHydratedRows('sl:players', [{ id: 'pbad', email: '', team_id: '' }], [{ id: 'p1', email: 'a@x.com', teamId: 't1', role: 'player', name: 'A' }]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'p1');
});

test('sl:player-profiles preserves userId null shell with fallback id', () => {
  const rows = buildAppRows('sl:player-profiles', [{ teamId: 't1', email: 'SHELL@X.com', userId: null, firstName: 'Shell' }]);
  assert.equal(rows[0].id, 'pp-shell:t1:shell@x.com');
  assert.equal(rows[0].userId, null);
});

test('sl:players normalizes teamId/team_id and email', () => {
  const [row] = buildAppRows('sl:players', [{ id: 'p2', email: 'UP@X.COM', team_id: 't2', role: 'player', name: 'Up' }]);
  assert.equal(row.teamId, 't2');
  assert.equal(row.email, 'up@x.com');
});

test('player row without id uses fallback id player:{teamId}:{email}', () => {
  const [row] = buildAppRows('sl:players', [{ email: 'NoId@X.com', teamId: 'team-fallback', role: 'player', name: 'No Id' }]);
  assert.equal(row.id, 'player:team-fallback:noid@x.com');
});

test('sl:events normalizes teamId/team_id and ownerCoachId/owner_coach_id', () => {
  const [row] = buildAppRows('sl:events', [{ id: 'e2', team_id: 't2', owner_coach_id: 'coach@x.com' }]);
  assert.equal(row.teamId, 't2');
  assert.equal(row.ownerCoachId, 'coach@x.com');
});

test('remote wins on exact id conflict and email/team fallback conflict', () => {
  const byId = mergeHydratedRows('sl:events', [{ id: 'e3', team_id: 't3', owner_coach_id: 'remote@x.com', title: 'Remote' }], [{ id: 'e3', teamId: 't3', ownerCoachId: 'local@x.com', title: 'Local' }]);
  assert.equal(byId.find((r) => r.id === 'e3').ownerCoachId, 'remote@x.com');

  const players = mergeHydratedRows('sl:players', [{ id: 'remote-id', email: 'p@x.com', team_id: 't3', role: 'player', name: 'Remote' }], [{ id: 'local-id', email: 'P@X.COM', teamId: 't3', role: 'coach', name: 'Local' }]);
  assert.equal(players.length, 1);
  assert.equal(players[0].id, 'remote-id');
});

test('local profile rows are preserved when remote is incomplete', () => {
  const merged = mergeHydratedRows('sl:player-profiles', [{ id: 'bad', team_id: '', email: '' }], [{ teamId: 't9', email: 'shell@x.com', userId: null }]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'pp-shell:t9:shell@x.com');
});
