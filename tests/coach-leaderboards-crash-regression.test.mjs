import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('coach and player leaderboards use shared premium hub and avoid undefined legacy vars', () => {
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.equal(appSource.includes('leaderboardCategory'), false);
  assert.equal(appSource.includes('renderPremiumLeaderboardsHub'), false);
  assert.match(hubSource, /const \[activeLeaderboardCategory, setActiveLeaderboardCategory\] = useState\('home_shots'\);/);
  assert.match(hubSource, /onClick=\{\(\) => setActiveLeaderboardCategory\(item.key\)\}/);
  assert.match(hubSource, /activeLeaderboardCategory === 'home_shots'/);
});

test('leaderboards categories and content states are stable for coach and player', () => {
  assert.match(hubSource, /home_shots/);
  assert.match(hubSource, /event_participation/);
  assert.match(hubSource, /strength_conditioning_participation/);
  assert.match(hubSource, /drill_shots/);
  assert.match(hubSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(hubSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
  assert.match(hubSource, /No rankings yet/);
});
