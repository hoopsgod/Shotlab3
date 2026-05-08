import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAppRows, buildRemoteRows, mergeHydratedRows } from '../src/lib/remotePersistence.js';

test('sl:events hydration preserves local event when remote is incomplete', () => {
  const local = [{ id: 'e1', teamId: 't1', ownerCoachId: 'c@x.com', title: 'Local' }];
  const remote = [{ id: '', team_id: 't1', owner_coach_id: 'c@x.com', title: 'Broken' }];
  const merged = mergeHydratedRows('sl:events', local, remote);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'e1');
});

test('sl:players hydration preserves local player when remote is incomplete', () => {
  const local = [{ id: 'p1', teamId: 't1', email: 'a@b.com', name: 'A', role: 'player' }];
  const remote = [{ id: 'p1', team_id: '', email: 'a@b.com' }];
  const merged = mergeHydratedRows('sl:players', local, remote);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].name, 'A');
});

test('sl:player-profiles preserves userId null shell and fallback id', () => {
  const [profile] = buildAppRows('sl:player-profiles', [{ teamId: 't1', email: 'Shell@X.com', userId: null }]);
  assert.equal(profile.userId, null);
  assert.equal(profile.id, 'pp-shell:t1:shell@x.com');
});

test('sl:players DB write converts teamId/hideFromLeaderboards and fallback id', () => {
  const [player] = buildRemoteRows('sl:players', [{ teamId: 't1', email: 'UP@X.COM', hideFromLeaderboards: true, name: 'Up', role: 'player' }]);
  assert.equal(player.team_id, 't1');
  assert.equal(player.hide_from_leaderboards, true);
  assert.equal(player.id, 'player:t1:up@x.com');
});

test('sl:player-profiles DB write converts teamId/userId fields', () => {
  const [profile] = buildRemoteRows('sl:player-profiles', [{ id: 'pp1', teamId: 't1', userId: 'U@X.COM', firstName: 'U', lastName: 'X' }]);
  assert.equal(profile.team_id, 't1');
  assert.equal(profile.user_id, 'u@x.com');
});

test('remote wins on exact id/email conflict for players/profiles', () => {
  const playerMerged = mergeHydratedRows('sl:players', [{ id: 'p1', teamId: 't1', email: 'a@x.com', name: 'Local' }], [{ id: 'p1', team_id: 't1', email: 'a@x.com', name: 'Remote' }]);
  assert.equal(playerMerged[0].name, 'Remote');
  const profileMerged = mergeHydratedRows('sl:player-profiles', [{ id: 'pp1', teamId: 't1', email: 'a@x.com', firstName: 'Local' }], [{ id: 'pp1', team_id: 't1', email: 'a@x.com', first_name: 'Remote' }]);
  assert.equal(profileMerged[0].firstName, 'Remote');
});
