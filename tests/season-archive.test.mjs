import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeasonArchive, getSeasonArchiveDetailModel } from '../src/lib/seasonArchive.js';

const frozenJson = (v) => JSON.stringify(v);
const base = () => ({
  teamId: 'team-a',
  coach: { email: 'coach@a.test', name: 'Coach A', role: 'coach', teamId: 'team-a', branding: { primary: 'lime' } },
  seasonName: '2026 Summer',
  seasonStartDate: '2026-05-01',
  seasonEndDate: '2026-07-01',
  players: [{ id: 'p1', email: 'p1@a.test', role: 'player', teamId: 'team-a' }, { id: 'p2', email: 'p2@b.test', role: 'player', teamId: 'team-b' }],
  activeRosterPlayers: [{ id: 'p1', email: 'p1@a.test', role: 'player', teamId: 'team-a' }],
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
    playerProfileCount: 0,
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
  for (const key of ['rosterSnapshot','homeScoresSnapshot','programScoresSnapshot','shotLogsSnapshot','eventSnapshot','eventRsvpSnapshot','scSessionSnapshot','scRsvpSnapshot','scLogSnapshot','challengeSnapshot']) {
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


test('archive includes team-scoped frozen player season summaries with individual totals', () => {
  const data = {
    ...base(),
    players: [
      { id: 'p1', playerId: 'p1', name: 'Player One', email: 'one@a.test', role: 'player', teamId: 'team-a', source: 'registered' },
      { id: 'p2', playerId: 'p2', name: 'Other Team', email: 'two@b.test', role: 'player', teamId: 'team-b' },
    ],
    activeRosterPlayers: [
      { id: 'p1', playerId: 'p1', name: 'Player One', email: 'one@a.test', role: 'player', teamId: 'team-a', source: 'registered' },
    ],
    playerProfiles: [
      { id: 'profile-1', userId: 'one@a.test', teamId: 'team-a', firstName: 'Player', lastName: 'One' },
      { id: 'profile-other', teamId: 'team-b', firstName: 'Other', lastName: 'Profile' },
    ],
    scores: [
      { id: 'home-1', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', score: 12, date: '2026-06-01' },
      { id: 'home-2', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', makes: 8, date: '2026-06-03' },
      { id: 'home-other', teamId: 'team-b', playerId: 'p2', score: 99, date: '2026-06-04' },
    ],
    programScores: [
      { id: 'prog-1', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', score: 20, date: '2026-06-02' },
      { id: 'prog-2', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', score: 15, date: '2026-06-05' },
      { id: 'prog-other', teamId: 'team-b', playerId: 'p2', score: 88, date: '2026-06-06' },
    ],
    shotLogs: [
      { id: 'shot-1', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', made: 30, date: '2026-06-07' },
      { id: 'shot-other', teamId: 'team-b', playerId: 'p2', made: 70, date: '2026-06-08' },
    ],
    rsvps: [
      { id: 'rsvp-1', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', date: '2026-06-09' },
      { id: 'rsvp-other', teamId: 'team-b', playerId: 'p2', date: '2026-06-10' },
    ],
    scRsvps: [
      { id: 'scr-1', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', date: '2026-06-11' },
      { id: 'scr-other', teamId: 'team-b', playerId: 'p2', date: '2026-06-12' },
    ],
    scLogs: [
      { id: 'scl-1', teamId: 'team-a', playerId: 'p1', email: 'one@a.test', date: '2026-06-13' },
      { id: 'scl-other', teamId: 'team-b', playerId: 'p2', date: '2026-06-14' },
    ],
  };
  const { archive } = createSeasonArchive(data);
  assert.equal(archive.playerSeasonSummaries.length, 1);
  const [summary] = archive.playerSeasonSummaries;
  assert.equal(summary.name, 'Player One');
  assert.equal(summary.email, 'one@a.test');
  assert.equal(summary.playerId, 'p1');
  assert.equal(summary.rosterSource, 'registered');
  assert.equal(summary.totalHomeMakes, 20);
  assert.equal(summary.homeScoreCount, 2);
  assert.equal(summary.totalProgramScore, 35);
  assert.equal(summary.programScoreCount, 2);
  assert.equal(summary.totalShotLogMakes, 30);
  assert.equal(summary.shotLogCount, 1);
  assert.equal(summary.eventRsvpCount, 1);
  assert.equal(summary.scRsvpCount, 1);
  assert.equal(summary.scLogCount, 1);
  assert.equal(summary.programDrillAttemptCount, 2);
  assert.equal(summary.bestProgramScore, 20);
  assert.equal(summary.lastActivityDate, '2026-06-13');
  assert.ok(!archive.playerSeasonSummaries.some((row) => row.email === 'two@b.test'));

  data.scores[0].score = 999;
  data.players[0].name = 'Changed Live';
  assert.equal(archive.playerSeasonSummaries[0].totalHomeMakes, 20);
  assert.equal(archive.playerSeasonSummaries[0].name, 'Player One');
});

test('profile-only active team players receive season summaries without other team profiles', () => {
  const { archive } = createSeasonArchive({
    ...base(),
    players: [],
    activeRosterPlayers: [{ id: 'profile-a', profileId: 'profile-a', teamId: 'team-a', firstName: 'Manual', lastName: 'Player', source: 'profile' }],
    playerProfiles: [
      { id: 'profile-a', profileId: 'profile-a', teamId: 'team-a', firstName: 'Manual', lastName: 'Player' },
      { id: 'profile-b', profileId: 'profile-b', teamId: 'team-b', firstName: 'Wrong', lastName: 'Team' },
    ],
    scores: [{ id: 's-profile', teamId: 'team-a', profileId: 'profile-a', score: 11 }],
  });
  assert.deepEqual(archive.playerSeasonSummaries.map((row) => row.name), ['Manual Player']);
  assert.equal(archive.playerSeasonSummaries[0].profileId, 'profile-a');
  assert.equal(archive.playerSeasonSummaries[0].totalHomeMakes, 11);
});

import fs from 'node:fs';
const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');



test('season archive uses active roster only and excludes inactive lifecycle rows', () => {
  const data = {
    ...base(),
    players: [
      { id: 'active', playerId: 'active', teamId: 'team-a', name: 'Active Player', email: 'active@a.test', role: 'player' },
      { id: 'coach', teamId: 'team-a', name: 'Coach Row', email: 'AQ@gmail.com', role: 'coach' },
      { id: 'is-coach', teamId: 'team-a', name: 'Is Coach', email: 'iscoach@a.test', isCoach: true },
      { id: 'removed', teamId: 'team-a', name: 'Removed Player', email: 'removed@a.test', removedFromTeam: true },
      { id: 'archived', teamId: 'team-a', name: 'Archived Player', email: 'archived@a.test', archived: true },
      { id: 'hidden', teamId: 'team-a', name: 'Hidden Player', email: 'hidden@a.test', hideFromLeaderboards: true },
      { id: 'inactive', teamId: 'team-a', name: 'Inactive Player', email: 'inactive@a.test', rosterStatus: 'inactive' },
      { id: 'local-deleted', teamId: 'team-a', name: 'Local Deleted', email: 'local-deleted@a.test', rosterStatus: 'team_local_data_deleted', teamLocalDataDeleted: true },
    ],
    activeRosterPlayers: [
      { id: 'active', playerId: 'active', teamId: 'team-a', name: 'Active Player', email: 'active@a.test', role: 'player' },
      { id: 'coach', teamId: 'team-a', name: 'Coach Row', email: 'AQ@gmail.com', role: 'coach' },
      { id: 'is-coach', teamId: 'team-a', name: 'Is Coach', email: 'iscoach@a.test', isCoach: true },
      { id: 'removed', teamId: 'team-a', name: 'Removed Player', email: 'removed@a.test', removedFromTeam: true },
      { id: 'archived', teamId: 'team-a', name: 'Archived Player', email: 'archived@a.test', archived: true },
      { id: 'hidden', teamId: 'team-a', name: 'Hidden Player', email: 'hidden@a.test', hideFromLeaderboards: true },
      { id: 'inactive', teamId: 'team-a', name: 'Inactive Player', email: 'inactive@a.test', rosterStatus: 'inactive' },
      { id: 'local-deleted', teamId: 'team-a', name: 'Local Deleted', email: 'local-deleted@a.test', rosterStatus: 'team_local_data_deleted', teamLocalDataDeleted: true },
    ],
    playerProfiles: [
      { id: 'active-profile', userId: 'active@a.test', teamId: 'team-a', firstName: 'Active', lastName: 'Profile' },
      { id: 'stale-profile', userId: 'stale@a.test', teamId: 'team-a', firstName: 'Stale', lastName: 'Profile' },
      { id: 'removed-profile', userId: 'removed@a.test', teamId: 'team-a', firstName: 'Removed', lastName: 'Profile' },
    ],
    scores: [
      { id: 'active-score', teamId: 'team-a', playerId: 'active', email: 'active@a.test', score: 5 },
      { id: 'removed-score', teamId: 'team-a', playerId: 'removed', email: 'removed@a.test', score: 500 },
    ],
  };
  const before = frozenJson(data);
  const { archive } = createSeasonArchive(data);
  assert.deepEqual(archive.rosterSnapshot.map((row) => row.email), ['active@a.test']);
  assert.deepEqual(archive.playerProfileSnapshot.map((row) => row.id), ['active-profile']);
  assert.deepEqual(archive.playerSeasonSummaries.map((row) => row.email), ['active@a.test']);
  assert.equal(archive.playerSeasonSummaries[0].totalHomeMakes, 5);
  assert.equal(frozenJson(data), before);
  assert.ok(data.players.some((row) => row.email === 'AQ@gmail.com' && row.role === 'coach'));
});


test('removed deleted and archived players do not appear in archive detail', () => {
  const { archive } = createSeasonArchive({
    ...base(),
    activeRosterPlayers: [
      { id: 'active', teamId: 'team-a', name: 'Active Player', email: 'active@a.test' },
      { id: 'removed', teamId: 'team-a', name: 'Removed Player', email: 'removed@a.test', removed: true },
      { id: 'deleted', teamId: 'team-a', name: 'Deleted Player', email: 'deleted@a.test', rosterStatus: 'team_local_data_deleted' },
      { id: 'archived', teamId: 'team-a', name: 'Archived Player', email: 'archived@a.test', archived: true },
    ],
    playerProfiles: [
      { id: 'removed-profile', teamId: 'team-a', email: 'removed@a.test', firstName: 'Removed', lastName: 'Player' },
    ],
  });
  const model = getSeasonArchiveDetailModel(archive);
  const detailText = JSON.stringify(model.sections);
  assert.match(detailText, /Active Player/);
  assert.doesNotMatch(detailText, /Removed Player|Deleted Player|Archived Player|removed@a\.test|deleted@a\.test|archived@a\.test/);
});

test('coach archived season rows expose a clear view affordance', () => {
  assert.match(appSource, /data-testid="season-archive-view-button"/);
  assert.match(appSource, /VIEW ARCHIVE/);
});

test('selecting an archive opens a read-only detail view with back navigation', () => {
  assert.match(appSource, /data-testid="season-archive-detail"/);
  assert.match(appSource, /season-archive-player-summaries/);
  assert.match(appSource, /<SeasonArchiveDetail archive=\{selectedSeasonArchive\} onBack=\{\(\)=>setSelectedSeasonArchiveId\(null\)\}/);
  assert.match(appSource, /BACK TO ARCHIVED SEASONS/);
});

test('archive detail model displays summary counts and frozen snapshot sections', () => {
  const { archive } = createSeasonArchive({
    ...base(),
    players: [{ id: 'p1', name: 'A Player', email: 'player@a.test', teamId: 'team-a' }],
    activeRosterPlayers: [{ id: 'p1', name: 'A Player', email: 'player@a.test', teamId: 'team-a' }],
    scores: [{ id: 's1', teamId: 'team-a', playerId: 'p1', email: 'player@a.test', score: 10 }],
    programScores: [{ id: 'ps1', teamId: 'team-a', playerId: 'p1', email: 'player@a.test', score: 7 }],
    rsvps: [{ id: 'r1', teamId: 'team-a', playerId: 'p1', email: 'player@a.test' }],
    scLogs: [{ id: 'scl1', teamId: 'team-a', playerId: 'p1', email: 'player@a.test' }],
    events: [{ id: 'e1', title: 'Open Gym', date: '2026-06-01', teamId: 'team-a' }],
    scSessions: [{ id: 'sc1', title: 'Lift Day', date: '2026-06-02', teamId: 'team-a' }],
    programDrills: [{ id: 'pd1', name: 'Form Shooting' }],
  });
  const model = getSeasonArchiveDetailModel(archive);
  assert.deepEqual(model.summaryStats.map((stat) => stat.label), ['Roster', 'Home Scores', 'Program Scores', 'Shot Logs', 'Events', 'Event RSVPs', 'S&C Sessions', 'S&C RSVPs', 'S&C Logs', 'Home Makes', 'Program Score', 'Shot Log Makes']);
  assert.equal(model.summaryStats.find((stat) => stat.label === 'Roster').value, 1);
  assert.deepEqual(model.sections.map((section) => section.title), ['ROSTER SNAPSHOT', 'EVENT SNAPSHOT', 'S&C SNAPSHOT', 'PROGRAM DRILL SNAPSHOT', 'PLAYER SEASON SUMMARIES']);
  assert.equal(model.sections[0].rows[0], 'A Player (player@a.test)');
  assert.equal(model.sections[1].rows[0], 'Open Gym · 2026-06-01');
  assert.equal(model.sections[2].rows[0], 'Lift Day · 2026-06-02');
  assert.equal(model.sections[3].rows[0], 'Form Shooting');
  assert.match(model.sections[4].rows[0], /A Player.*Home 10.*Program 7.*Event RSVPs 1.*S&C Logs 1/);
});

test('archive detail uses selected archive snapshots instead of live app arrays', () => {
  assert.match(appSource, /getSeasonArchiveDetailModel\(archive\)/);
  assert.match(appSource, /<SeasonArchiveDetail archive=\{selectedSeasonArchive\}/);
  assert.doesNotMatch(appSource, /setPlayers\([^)]*selectedSeasonArchive|setScores\([^)]*selectedSeasonArchive|setEvents\([^)]*selectedSeasonArchive|setScSessions\([^)]*selectedSeasonArchive/);
});

test('players do not receive archive management or archive detail controls', () => {
  const playerInvocationStart = appSource.indexOf('{view==="player"');
  const playerInvocationEnd = appSource.indexOf('{view==="coach"', playerInvocationStart);
  const playerInvocation = appSource.slice(playerInvocationStart, playerInvocationEnd);
  assert.notEqual(playerInvocationStart, -1);
  assert.notEqual(playerInvocationEnd, -1);
  assert.doesNotMatch(playerInvocation, /seasonArchives=\{/);
  assert.doesNotMatch(playerInvocation, /archiveSeason=\{/);
  assert.doesNotMatch(playerInvocation, /SeasonArchiveDetail|season-archive-view-button|season-archive-detail/);
});
