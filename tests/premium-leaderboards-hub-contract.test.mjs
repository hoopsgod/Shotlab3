import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('premium leaderboards hub includes required categories and competition header', () => {
  assert.match(hubSource, /COMPETITION HUB/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Coach Custom Drills/);
  assert.match(hubSource, /activeLeaderboardCategory==="home_shots"/);
});

