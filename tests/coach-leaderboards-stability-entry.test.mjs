import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('coach and player leaderboard entries open the shared hub without a separate coach page', () => {
  assert.match(appSource, /title="Home Shot Leaders"[\s\S]*mode="coach"/);
  assert.match(appSource, /title="Home Shot Leaders"[\s\S]*mode="coach"[\s\S]*onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);

  assert.match(appSource, /title="Team Leaders"[\s\S]*mode="player"[\s\S]*onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(appSource, /tab==="leaderboards"[\s\S]*<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Coach Custom Drills/);

  assert.equal(appSource.includes('leaderboardCategory'), false);
});
