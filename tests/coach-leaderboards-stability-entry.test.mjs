import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

function componentBlock(source, title) {
  const start = source.indexOf(`title="${title}"`);
  assert.notEqual(start, -1, `${title} card should be present`);
  const end = source.indexOf('/>', start);
  assert.notEqual(end, -1, `${title} card should close`);
  return source.slice(start, end + 2);
}

test('coach leaderboard CTA uses in-scope coach tab navigation and player leaderboards stay enabled', () => {
  const coachCard = componentBlock(appSource, 'Home Shot Leaders');
  const playerCard = componentBlock(appSource, 'Team Leaders');

  assert.match(appSource, /function Coach\([\s\S]*const\[tab,setTab\]=useState\("feed"\)/);
  assert.match(coachCard, /mode="coach"/);
  assert.match(coachCard, /onViewAll=\{\(\)=>setTab\("leaderboards"\)\}/);
  assert.doesNotMatch(coachCard, /switchTab\("leaderboards"\)/);

  assert.match(playerCard, /mode="player"/);
  assert.match(playerCard, /onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(appSource, /tab==="leaderboards"[\s\S]*PremiumLeaderboardsHub viewerRole="coach"/);

  assert.match(hubSource, /COMPETITION HUB/);
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Coach Custom Drills/);

  assert.equal(appSource.includes('leaderboardCategory'), false);
});
