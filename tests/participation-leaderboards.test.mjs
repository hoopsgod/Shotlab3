import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAllTimeEventParticipationRows,
  buildAllTimeStrengthParticipationRows,
  buildCurrentEventParticipationRows,
  buildCurrentStrengthParticipationRows,
} from '../src/lib/participationLeaderboardRows.js';

const players = [
  { id: 'player-a', email: 'a@example.com', name: 'A', teamId: 'team-a', role: 'player' },
  { id: 'player-b', email: 'b@example.com', name: 'B', teamId: 'team-a', role: 'player' },
  { id: 'removed', email: 'removed@example.com', name: 'Removed', teamId: 'team-a', role: 'player', rosterStatus: 'removed' },
  { id: 'coach', email: 'coach@example.com', name: 'Coach', teamId: 'team-a', role: 'coach' },
];

const archives = [{
  teamId: 'team-a',
  seasonStartDate: '2026-01-01',
  seasonEndDate: '2026-06-30',
  eventRsvpSnapshot: [
    { email: 'a@example.com', teamId: 'team-a', attended: true, date: '2026-02-01' },
    { email: 'b@example.com', teamId: 'team-a', attended: true, date: '2026-02-02' },
  ],
  scLogSnapshot: [
    { email: 'a@example.com', teamId: 'team-a', date: '2026-03-01' },
    { email: 'a@example.com', teamId: 'team-a', date: '2026-03-02' },
  ],
}];

test('current event rankings count attended events only and exclude archived date ranges', () => {
  const rows = buildCurrentEventParticipationRows({
    players,
    teamId: 'team-a',
    seasonArchives: archives,
    rsvps: [
      { email: 'a@example.com', teamId: 'team-a', attended: true, date: '2026-02-01' },
      { email: 'a@example.com', teamId: 'team-a', attended: true, date: '2026-07-01' },
      { email: 'b@example.com', teamId: 'team-a', attended: false, date: '2026-07-02' },
      { email: 'removed@example.com', teamId: 'team-a', attended: true, date: '2026-07-03' },
      { email: 'a@example.com', teamId: 'team-b', attended: true, date: '2026-07-04' },
    ],
  });
  assert.deepEqual(rows.map((row) => [row.email, row.total]), [['a@example.com', 1]]);
});

test('all-time event rankings combine archive snapshots with post-archive live rows once', () => {
  const rows = buildAllTimeEventParticipationRows({
    players,
    teamId: 'team-a',
    seasonArchives: archives,
    rsvps: [
      { email: 'a@example.com', teamId: 'team-a', attended: true, date: '2026-02-01' },
      { email: 'a@example.com', teamId: 'team-a', attended: true, date: '2026-07-01' },
      { email: 'b@example.com', teamId: 'team-a', attended: true, date: '2026-07-02' },
    ],
  });
  assert.deepEqual(rows.map((row) => [row.email, row.total]), [
    ['a@example.com', 2],
    ['b@example.com', 2],
  ]);
});

test('strength rankings count completed logs and enforce active-roster boundaries', () => {
  const current = buildCurrentStrengthParticipationRows({
    players,
    teamId: 'team-a',
    seasonArchives: archives,
    scLogs: [
      { email: 'a@example.com', teamId: 'team-a', date: '2026-07-01' },
      { email: 'b@example.com', teamId: 'team-a', date: '2026-07-02' },
      { email: 'removed@example.com', teamId: 'team-a', date: '2026-07-03' },
      { email: 'coach@example.com', teamId: 'team-a', date: '2026-07-04' },
    ],
  });
  assert.deepEqual(current.map((row) => [row.email, row.total]), [
    ['a@example.com', 1],
    ['b@example.com', 1],
  ]);

  const allTime = buildAllTimeStrengthParticipationRows({
    players,
    teamId: 'team-a',
    seasonArchives: archives,
    scLogs: [{ email: 'a@example.com', teamId: 'team-a', date: '2026-07-01' }],
  });
  assert.deepEqual(allTime.map((row) => [row.email, row.total]), [['a@example.com', 3]]);
});
