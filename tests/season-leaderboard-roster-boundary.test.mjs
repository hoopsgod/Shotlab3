import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAllTimeHomeLeaderboardRows,
  buildAllTimeProgramLeaderboardRows,
  buildCurrentOffseasonHomeLeaderboardRows,
  getAllTimeLeaderboardPlayers,
} from '../src/lib/seasonLeaderboardAnalytics.js';

const teamId = 'team-boundary';
const activePlayers = [
  { id: 'active-1', playerId: 'active-1', email: 'active@example.com', name: 'Active Player', role: 'player', teamId },
];

const archivedSeason = {
  id: 'archive-boundary',
  teamId,
  seasonName: 'Past Season',
  seasonStartDate: '2025-11-01',
  seasonEndDate: '2026-03-01',
  rosterSnapshot: [
    { email: 'alumni@example.com', name: 'Alumni Player', role: 'player', teamId },
  ],
  playerSeasonSummaries: [
    { playerId: 'alumni-uuid', email: 'alumni@example.com', name: 'Alumni Player', totalHomeMakes: 75, totalShotLogMakes: 25 },
  ],
  programDrillSnapshot: [
    { id: 'historic-drill', name: 'Historic Drill' },
  ],
  programScoresSnapshot: [
    { id: 'historic-score', playerId: 'alumni-uuid', email: 'alumni@example.com', name: 'Alumni Player', teamId, drillId: 'historic-drill', drillName: 'Historic Drill', score: 47, date: '2026-01-10', src: 'program' },
  ],
};

test('current/offseason home rankings reject non-roster live rows before limiting', () => {
  const rows = buildCurrentOffseasonHomeLeaderboardRows({
    seasonArchives: [archivedSeason],
    teamId,
    players: activePlayers,
    homeScores: [
      { id: 'removed-high', playerId: 'removed-1', email: 'removed@example.com', name: 'Removed Player', teamId, score: 900, date: '2026-06-01', src: 'home' },
      { id: 'active-low', playerId: 'active-1', email: 'active@example.com', name: 'Active Player', teamId, score: 20, date: '2026-06-01', src: 'home' },
    ],
    limit: 1,
  });

  assert.deepEqual(rows.map((row) => [row.name, row.total]), [['Active Player', 20]]);
});

test('all-time home rankings preserve frozen alumni but reject removed live contributions', () => {
  const rows = buildAllTimeHomeLeaderboardRows({
    seasonArchives: [archivedSeason],
    teamId,
    players: activePlayers,
    homeScores: [
      { id: 'removed-live', playerId: 'removed-1', email: 'removed@example.com', name: 'Removed Player', teamId, score: 800, date: '2026-06-01', src: 'home' },
      { id: 'active-live', playerId: 'active-1', email: 'active@example.com', name: 'Active Player', teamId, score: 30, date: '2026-06-01', src: 'home' },
    ],
  });

  assert.deepEqual(rows.map((row) => [row.name, row.total]), [
    ['Alumni Player', 100],
    ['Active Player', 30],
  ]);
  assert.equal(rows.some((row) => row.name === 'Removed Player'), false);
});

test('archived identity aliases bridge email-only rosters to immutable player ids', () => {
  const historicalPlayers = getAllTimeLeaderboardPlayers({ seasonArchives: [archivedSeason], teamId, players: activePlayers });
  const alumni = historicalPlayers.find((player) => player.email === 'alumni@example.com');
  assert.equal(alumni?.playerId, 'alumni-uuid');
  assert.equal(alumni?.archivedLeaderboardIdentity, true);
  assert.equal(alumni?.rosterStatus, 'active');

  const rows = buildAllTimeProgramLeaderboardRows({
    seasonArchives: [archivedSeason],
    teamId,
    players: activePlayers,
    programScores: [],
    drill: { id: 'historic-drill', name: 'Historic Drill', teamId },
  });
  assert.deepEqual(rows.map((row) => [row.name, row.total]), [['Alumni Player', 47]]);
});
