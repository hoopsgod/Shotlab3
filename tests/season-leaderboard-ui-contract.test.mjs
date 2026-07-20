import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');
const analyticsSource = fs.readFileSync(new URL('../src/lib/seasonLeaderboardAnalytics.js', import.meta.url), 'utf8');

test('player and coach leaderboard hubs receive team season archives and team score rows', () => {
  assert.match(appSource, /function Player\([\s\S]*seasonArchives=\[\]/);
  assert.match(appSource, /<Player[\s\S]*seasonArchives=\{seasonArchives\.filter/);
  assert.equal((appSource.match(/PremiumLeaderboardsHub viewerRole=/g) || []).length, 2);
  assert.equal((appSource.match(/seasonArchives=\{seasonArchives\} \/>/g) || []).length, 2);
  assert.equal((appSource.match(/homeScores=\{scores\} shotLogs=\{shotLogs\} seasonArchives=\{seasonArchives\}/g) || []).length, 2);
});

test('shared leaderboard hub exposes current and all-time controls', () => {
  assert.match(hubSource, /seasonArchives = \[\]/);
  assert.match(hubSource, /Current \/ Offseason/);
  assert.match(hubSource, /All-Time/);
  assert.match(hubSource, /leaderboard-time-scope-\$\{item\.key\}/);
  assert.match(hubSource, /LEADERBOARD_TIME_SCOPES\.CURRENT/);
  assert.match(hubSource, /LEADERBOARD_TIME_SCOPES\.ALL_TIME/);
  assert.match(hubSource, /all-time-coverage-note/);
  assert.match(hubSource, /Archived seasons are never counted twice\./);
});

test('archive-aware analytics keep live and frozen data separated before aggregation', () => {
  assert.match(analyticsSource, /filterLiveRowsOutsideArchivedSeasons/);
  assert.match(analyticsSource, /buildCurrentOffseasonHomeLeaderboardRows/);
  assert.match(analyticsSource, /buildAllTimeHomeLeaderboardRows/);
  assert.match(analyticsSource, /buildCurrentOffseasonProgramLeaderboardRows/);
  assert.match(analyticsSource, /buildAllTimeProgramLeaderboardRows/);
  assert.match(analyticsSource, /getAllTimeLeaderboardPlayers/);
});
