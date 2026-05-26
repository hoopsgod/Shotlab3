import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');

test('coach and player leaderboards use safe shared category state and render without undefined vars', () => {
  assert.match(appSource, /const \[activeLeaderboardCategory,setActiveLeaderboardCategory\]=useState\("home_shots"\);/);
  assert.equal(appSource.includes('leaderboardCategory'), false);

  const leaderboardsSections = (appSource.match(/tab==="leaderboards"/g) || []).length;
  assert.equal(leaderboardsSections >= 2, true);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="player"/);
  assert.match(appSource, /<PremiumLeaderboardsHub viewerRole="coach"/);

  const buttonBindings = (hubSource.match(/onClick=\{\(\)=>setActiveLeaderboardCategory\(item\.key\)\}/g) || []).length;
  assert.equal(buttonBindings >= 1, true);

  const homeCategoryChecks = (hubSource.match(/activeLeaderboardCategory==="home_shots"/g) || []).length;
  assert.equal(homeCategoryChecks >= 1, true);
});

test('leaderboards categories and content states are stable for coach and player', () => {
  assert.match(hubSource, /\{key:"home_shots",label:"At-Home Shots"\}/);
  assert.match(hubSource, /\{key:"event_participation",label:"Events Attended"\}/);
  assert.match(hubSource, /\{key:"strength_conditioning_participation",label:"Strength & Conditioning"\}/);
  assert.match(hubSource, /\{key:"drill_shots",label:"Coach Custom Drills"\}/);

  assert.match(hubSource, /activeLeaderboardCategory==="event_participation"/);
  assert.match(hubSource, /activeLeaderboardCategory==="strength_conditioning_participation"/);

  assert.match(hubSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(hubSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
  assert.match(hubSource, /No rankings yet/);
  assert.match(hubSource, /rows=\{homeShotsLeaderboard\?\.rows\|\|\[\]\}/);
  assert.doesNotMatch(hubSource, /<CompactLeaderboardPreviewCard[^>]*rows=\{\[/);

});
