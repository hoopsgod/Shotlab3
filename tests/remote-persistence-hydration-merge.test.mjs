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

test('sl:events app hydration keeps Supabase-style description row visible without owner_coach_id', () => {
  const [event] = buildAppRows('sl:events', [{
    id: 'e-supa-1',
    team_id: 't1',
    title: 'Open Gym',
    description: 'Team run',
  }]);

  assert.equal(event.id, 'e-supa-1');
  assert.equal(event.teamId, 't1');
  assert.equal(event.desc, 'Team run');
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

test('sl:shotlogs remote hydration marks missing syncState rows remote_saved for coach visibility', () => {
  const [remote] = buildAppRows('sl:shotlogs', [{
    id: 'shot-remote-1',
    email: 'Player@One.com',
    player_id: 'Player@One.com',
    team_id: 'team-1',
    name: 'Player One',
    made: '22',
    date: '2026-05-30',
    ts: 123,
  }], { source: 'remote' });

  assert.equal(remote.email, 'player@one.com');
  assert.equal(remote.playerId, 'player@one.com');
  assert.equal(remote.teamId, 'team-1');
  assert.equal(remote.syncState, 'remote_saved');
  assert.equal(remote.syncSource, 'remote');
});


test('sl:shotlogs local storage remote_saved rows become background_saved until remote hydration confirms them', () => {
  const [localStale] = buildAppRows('sl:shotlogs', [{
    id: 'shot-local-stale',
    email: 'player@one.com',
    playerId: 'player@one.com',
    teamId: 'team-1',
    made: 18,
    syncState: 'remote_saved',
  }], { source: 'local' });

  assert.equal(localStale.syncState, 'background_saved');
  assert.equal(localStale.syncSource, 'local');
  assert.equal(localStale.syncError || '', '');
  assert.equal(localStale.syncState === 'remote_saved' && localStale.syncSource === 'remote', false);
  assert.equal(localStale.syncState === 'failed_sync', false);
});


test('sl:shotlogs local remote_saved row with matching remote row becomes remote_saved remote', () => {
  const merged = mergeHydratedRows('sl:shotlogs', [
    { id: 'confirmed', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 10, syncState: 'remote_saved' },
  ], [
    { id: 'confirmed', email: 'p@x.com', player_id: 'p@x.com', team_id: 't1', made: 10 },
  ]);

  assert.deepEqual(merged.map((row) => [row.id, row.syncState, row.syncSource, row.syncError || '']), [
    ['confirmed', 'remote_saved', 'remote', ''],
  ]);
});

test('sl:shotlogs stale local_pending rows hydrate to background_saved while failed_sync survives', () => {
  const rows = buildAppRows('sl:shotlogs', [
    { id: 'pending', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 7, syncState: 'local_pending', syncError: 'offline' },
    { id: 'failed', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 9, syncState: 'failed_sync', syncError: 'persist_failed' },
    { id: 'legacy', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 11 },
  ], { source: 'local' });

  assert.deepEqual(rows.map((row) => [row.id, row.syncState, row.syncSource]), [
    ['pending', 'background_saved', 'local'],
    ['failed', 'failed_sync', 'local'],
    ['legacy', 'background_saved', 'local'],
  ]);
  assert.equal(rows.find((row) => row.id === 'legacy').syncError || '', '');
});

test('sl:shotlogs hydration merge keeps local retry rows and lets remote rows become coach-visible', () => {
  const local = [
    { id: 'pending', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 7, syncState: 'local_pending' },
    { id: 'same-id', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 1, syncState: 'failed_sync' },
  ];
  const remote = [
    { id: 'same-id', email: 'p@x.com', player_id: 'p@x.com', team_id: 't1', made: 15 },
    { id: 'remote-only', email: 'p@x.com', player_id: 'p@x.com', team_id: 't1', made: 20 },
  ];
  const merged = mergeHydratedRows('sl:shotlogs', local, remote);

  assert.deepEqual(merged.map((row) => [row.id, row.syncState, row.syncSource, row.made]), [
    ['pending', 'background_saved', 'local', 7],
    ['same-id', 'remote_saved', 'remote', 15],
    ['remote-only', 'remote_saved', 'remote', 20],
  ]);
  assert.deepEqual(merged.filter((row) => row.syncState === 'remote_saved' && row.syncSource === 'remote').map((row) => row.id), ['same-id', 'remote-only']);
});


test('sl:shotlogs legacy missing syncState only becomes coach-visible with remote confirmation', () => {
  const localLegacy = [
    { id: 'legacy-confirmed', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 8 },
    { id: 'legacy-local-only', email: 'p@x.com', playerId: 'p@x.com', teamId: 't1', made: 6 },
  ];
  const remoteLegacy = [
    { id: 'legacy-confirmed', email: 'p@x.com', player_id: 'p@x.com', team_id: 't1', made: 8 },
  ];

  const merged = mergeHydratedRows('sl:shotlogs', localLegacy, remoteLegacy);
  const coachVisible = merged.filter((row) => row.syncState === 'remote_saved' && row.syncSource === 'remote');
  const retryVisible = merged.filter((row) => row.syncState === 'failed_sync');

  assert.deepEqual(coachVisible.map((row) => row.id), ['legacy-confirmed']);
  assert.deepEqual(retryVisible.map((row) => [row.id, row.syncError]), []);
  assert.equal(merged.find((row) => row.id === 'legacy-local-only').syncState, 'background_saved');
});
