import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('coach leaderboard entry is stabilized (no clickable crashing route) and player leaderboards stay enabled', () => {
  assert.match(appSource, /title="Home Shot Leaders"[\s\S]*mode="coach"/);
  assert.match(appSource, /title="Home Shot Leaders"[\s\S]*onViewAll=\{\(\)=>setTab\("leaderboards"\)\}/);

  assert.match(appSource, /title="Team Leaders"[\s\S]*mode="player"[\s\S]*onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(appSource, /tab==="leaderboards"&&!active&&<PremiumLeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /tab==="leaderboards"&&<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Coach Custom Drills/);

  assert.equal(appSource.includes('leaderboardCategory'), false);
});
