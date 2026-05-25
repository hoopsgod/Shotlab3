import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const leaderboardSource = readFileSync(new URL('../src/components/HomeShotsLeaderboardCard.jsx', import.meta.url), 'utf8');

test('smoke: dashboard and required surfaces exist in runtime source', () => {
  ['playerLeaderboardState','CompactLeaderboardPreviewCard','PROGRAM SHOOTING DRILLS','LOAD DEMO DATA','switchTab("program")','switchTab("profile")'].forEach((token)=> assert.equal(appSource.includes(token), true));
});

test('fallback contracts: missing leaderboard/team/progress/demo data are handled defensively', () => {
  ['homeShotsLeaderboard?.status||"idle"','homeShotsLeaderboard?.rows||[]','homeShotsLeaderboard?.error||""','Array.isArray(events)?events:[]','derivePlayerProgressProfile({playerEmail:u.email,shotLogs,scores,rsvps,events,players})'].forEach((token)=> assert.equal(appSource.includes(token), true));
});

test('leaderboard card has empty and error fallbacks', () => {
  assert.match(leaderboardSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(leaderboardSource, /Could not load leaderboard/);
});
