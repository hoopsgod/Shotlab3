import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('coach and player leaderboards use safe shared category state and render without undefined vars', () => {
  assert.match(appSource, /const \[activeLeaderboardCategory,setActiveLeaderboardCategory\]=useState\("home_shots"\);/);
  assert.equal(appSource.includes('leaderboardCategory'), false);

  const leaderboardsSections = (appSource.match(/tab==="leaderboards"/g) || []).length;
  assert.equal(leaderboardsSections >= 2, true);

  const buttonBindings = (appSource.match(/onClick=\{\(\)=>setActiveLeaderboardCategory\(item\.key\)\}/g) || []).length;
  assert.equal(buttonBindings >= 2, true);

  const homeCategoryChecks = (appSource.match(/activeLeaderboardCategory==="home_shots"/g) || []).length;
  assert.equal(homeCategoryChecks >= 2, true);
});

test('leaderboards categories and content states are stable for coach and player', () => {
  assert.match(appSource, /\{key:"home_shots",label:"At-Home Shots"\}/);
  assert.match(appSource, /\{key:"event_participation",label:"Events Attended"\}/);
  assert.match(appSource, /\{key:"strength_conditioning_participation",label:"Strength & Conditioning"\}/);
  assert.match(appSource, /\{key:"drill_shots",label:"Coach Custom Drills"\}/);

  assert.match(appSource, /activeLeaderboardCategory==="event_participation"/);
  assert.match(appSource, /activeLeaderboardCategory==="strength_conditioning_participation"/);

  assert.match(appSource, /No leaderboard data yet\. Log shots to enter the rankings\./);
  assert.match(appSource, /No team leaderboard data yet\. Players will appear here after they log shots\./);
  assert.match(appSource, /No rankings yet/);

});
