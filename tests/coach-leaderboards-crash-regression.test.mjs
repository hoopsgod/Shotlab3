import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('coach and player leaderboards use shared premium hub component and avoid undefined legacy vars', () => {
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.equal(appSource.includes('leaderboardCategory'), false);
  assert.equal(appSource.includes('renderPremiumLeaderboardsHub'), false);
});

test('leaderboards categories and content states are stable in shared premium hub', () => {
  assert.match(hubSource, /\{ key: "home_shots", label: "At-Home Shots" \}/);
  assert.match(hubSource, /\{ key: "event_participation", label: "Events Attended" \}/);
  assert.match(hubSource, /\{ key: "strength_conditioning_participation", label: "Strength & Conditioning" \}/);
  assert.match(hubSource, /\{ key: "drill_shots", label: "Coach Custom Drills" \}/);
  assert.match(hubSource, /activeLeaderboardCategory===\"event_participation\"/);
  assert.match(hubSource, /activeLeaderboardCategory===\"strength_conditioning_participation\"/);
  assert.match(hubSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(hubSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
  assert.match(hubSource, /No rankings yet/);
});
