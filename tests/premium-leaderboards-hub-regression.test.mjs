import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('player and coach dashboards both render the shared premium leaderboards hub', () => {
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.equal((appSource.match(/PremiumLeaderboardsHub viewerRole=/g) || []).length, 2);
});

test('premium hub contains stable shell, categories, empty states, and safe defaults', () => {
  assert.match(hubSource, /data-testid=\{testId\}/);
  assert.match(hubSource, /COMPETITION HUB/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Program Drills/);
  assert.match(hubSource, /const \[activeLeaderboardCategory, setActiveLeaderboardCategory\] = useState\('home_shots'\);/);
  assert.match(hubSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(hubSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
  assert.match(hubSource, /No rankings yet/);
  assert.doesNotMatch(hubSource, /leaderboardCategory/);
  assert.doesNotMatch(hubSource, /renderPremiumLeaderboardsHub/);
});

test('old coach leaderboard wrapper is not used in the active render path', () => {
  assert.equal(appSource.includes('coach-home-shots-leaderboard'), false);
  assert.equal(appSource.includes('COACH VIEW — FULL ACCESS'), false);
});
