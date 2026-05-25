import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('coach leaderboard entry is stabilized (no clickable crashing route) and player leaderboards stay enabled', () => {
  assert.match(appSource, /title="Home Shot Leaders"[\s\S]*mode="coach"/);
  assert.doesNotMatch(appSource, /title="Home Shot Leaders"[\s\S]*onViewAll=\{\(\)=>setTab\("leaderboards"\)\}/);

  assert.match(appSource, /title="Team Leaders"[\s\S]*mode="player"[\s\S]*onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(appSource, /renderPremiumLeaderboardsHub[\s\S]*COMPETITION HUB/);
  assert.match(appSource, /At-Home Shots/);
  assert.match(appSource, /Events Attended/);
  assert.match(appSource, /Strength & Conditioning/);
  assert.match(appSource, /Coach Custom Drills/);

  assert.equal(appSource.includes('leaderboardCategory'), false);
});
