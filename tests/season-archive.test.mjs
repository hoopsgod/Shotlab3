import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeasonArchive } from '../src/lib/seasonArchive.js';

const frozenJson = (v) => JSON.stringify(v);
const base = () => ({
  teamId: 'team-a',
  coach: { email: 'coach@a.test', name: 'Coach A', role: 'coach', teamId: 'team-a', branding: { primary: 'lime' } },
  seasonName: '2026 Summer',
  seasonStartDate: '2026-05-01',
  seasonEndDate: '2026-07-01',
  players: [{ id: 'p1', email: 'p1@a.test', role: 'player', teamId: 'team-a' }, { id: 'p2', email: 'p2@b.test', role: 'player', teamId: 'team-b' }],
  playerProfiles: [{ id: 'pp1', teamId: 'team-a', firstName: 'A' }, { id: 'pp2', teamId: 'team-b', firstName: 'B' }],
  scores: [{ id: 's1', teamId: 'team-a', score: 10 }, { id: 's2', teamId: 'team-b', score: 99 }],
  programScores: [{ id: 'ps1', teamId: 'team-a', score: 7 }, { id: 'ps2', teamId: 'team-b', score: 88 }],
  shotLogs: [{ id: 'sl1', teamId: 'team-a', makes: 4 }, { id: 'sl2', teamId: 'team-b', makes: 77 }],
  events: [{ id: 'e1', teamId: 'team-a' }, { id: 'e2', teamId: 'team-b' }],
  rsvps: [{ id: 'r1', teamId: 'team-a' }, { id: 'r2', teamId: 'team-b' }],
  scSessions: [{ id: 'scs1', teamId: 'team-a' }, { id: 'scs2', teamId: 'team-b' }],
  scRsvps: [{ id: 'scr1', teamId: 'team-a' }, { id: 'scr2', teamId: 'team-b' }],
  scLogs: [{ id: 'scl1', teamId: 'team-a' }, { id: 'scl2', teamId: 'team-b' }],
  programDrills: [{ id: 'pd1', name: 'Program' }],
  drills: [{ id: 'd1', name: 'Home' }],
  challenges: [{ id: 'c1', teamId: 'team-a' }, { id: 'c2', teamId: 'team-b' }],
  existingArchives: [{ id: 'old', teamId: 'team-a' }],
  now: () => '2026-07-04T00:00:00.000Z',
});

test('coach can create a season archive with accurate summary', () => {
  const result = createSeasonArchive(base());
  assert.equal(result.ok, true);
  assert.equal(result.archive.seasonName, '2026 Summer');
  assert.equal(result.seasonArchives.length, 2);
  assert.deepEqual(result.archive.summary, {
    rosterCount: 1,
    playerProfileCount: 1,
    homeScoreCount: 1,
    programScoreCount: 1,
    shotLogCount: 1,
    eventCount: 1,
    eventRsvpCount: 1,
    scSessionCount: 1,
    scRsvpCount: 1,
    scLogCount: 1,
    totalHomeMakes: 10,
    totalProgramScore: 7,
    totalShotLogMakes: 4,
  });
});

test('player cannot create a season archive and season name is required', () => {
  assert.equal(createSeasonArchive({ ...base(), coach: { role: 'player', teamId: 'team-a' } }).ok, false);
  assert.equal(createSeasonArchive({ ...base(), seasonName: '  ' }).error, 'Season name is required.');
});

test('archive is scoped to active team and excludes another team data', () => {
  const { archive } = createSeasonArchive(base());
  for (const key of ['rosterSnapshot','playerProfileSnapshot','homeScoresSnapshot','programScoresSnapshot','shotLogsSnapshot','eventSnapshot','eventRsvpSnapshot','scSessionSnapshot','scRsvpSnapshot','scLogSnapshot','challengeSnapshot']) {
    assert.equal(archive[key].length, 1, key);
    assert.equal(archive[key][0].teamId, 'team-a');
  }
});

test('live data and protected account/branding objects remain unchanged', () => {
  const data = base();
  const before = frozenJson(data);
  createSeasonArchive(data);
  assert.equal(frozenJson(data), before);
  assert.deepEqual(data.coach, { email: 'coach@a.test', name: 'Coach A', role: 'coach', teamId: 'team-a', branding: { primary: 'lime' } });
});

test('all live arrays remain unchanged including drills and program drills', () => {
  const data = base();
  const keys = ['players','playerProfiles','scores','programScores','shotLogs','events','rsvps','scSessions','scRsvps','scLogs','drills','programDrills'];
  const before = Object.fromEntries(keys.map((key) => [key, frozenJson(data[key])]));
  createSeasonArchive(data);
  for (const key of keys) assert.equal(frozenJson(data[key]), before[key], key);
});

test('archive snapshot is stable after live arrays are changed', () => {
  const data = base();
  const { archive } = createSeasonArchive(data);
  data.players[0].email = 'changed@test';
  data.scores.push({ id: 'new', teamId: 'team-a', score: 1000 });
  assert.equal(archive.rosterSnapshot[0].email, 'p1@a.test');
  assert.equal(archive.homeScoresSnapshot.length, 1);
  assert.equal(archive.summary.homeScoreCount, 1);
});
