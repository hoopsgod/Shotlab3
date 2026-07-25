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

test('premium hub contains stable shell, real categories, empty states, and safe defaults', () => {
  assert.match(hubSource, /data-testid=\{testId\}/);
  assert.match(hubSource, /COMPETITION HUB/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Program Drills/);
  assert.match(hubSource, /const \[activeLeaderboardCategory, setActiveLeaderboardCategory\] = useState\('home_shots'\);/);
  assert.match(hubSource, /No rankings yet\. Log shots to activate the Home Shots leaderboard\./);
  assert.match(hubSource, /Event leaders will appear after attendance is confirmed\./);
  assert.match(hubSource, /Strength leaders will appear after players log completed S&C sessions\./);
  assert.doesNotMatch(hubSource, /leaderboardCategory/);
  assert.doesNotMatch(hubSource, /renderPremiumLeaderboardsHub/);
});

test('old coach leaderboard wrapper and participation placeholders are not used in the active render path', () => {
  assert.equal(appSource.includes('coach-home-shots-leaderboard'), false);
  assert.equal(appSource.includes('COACH VIEW — FULL ACCESS'), false);
  assert.equal(hubSource.includes('Event leaders will appear after players check into team events.'), false);
  assert.equal(hubSource.includes('Strength leaders will appear after players complete assigned S&C work.'), false);
});
