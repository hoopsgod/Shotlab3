import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('player and coach dashboards both route full leaderboards to shared PremiumLeaderboardsHub', () => {
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.equal((appSource.match(/<PremiumLeaderboardsHub/g) || []).length, 2);
});

test('premium hub shell and categories are present and stable', () => {
  assert.match(hubSource, /data-testid="premium-leaderboards-hub"/);
  assert.match(hubSource, /COMPETITION HUB/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Coach Custom Drills/);
  assert.match(hubSource, /const \[activeLeaderboardCategory, setActiveLeaderboardCategory\] = useState\("home_shots"\);/);
});

test('shared hub contains polished empty states and does not render fake rankings', () => {
  assert.match(hubSource, /No rankings yet/);
  assert.match(hubSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(hubSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
  assert.equal(hubSource.includes('TOP 10 PLAYER HOME SHOTS'), false);
  assert.equal(hubSource.includes('COACH VIEW — FULL ACCESS'), false);
});

test('coach full leaderboard no longer uses legacy plain wrapper', () => {
  assert.equal(appSource.includes('coach-home-shots-leaderboard'), false);
  assert.equal(appSource.includes('player-home-shots-leaderboard'), false);
});
