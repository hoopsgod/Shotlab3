import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

test('player at-home shots save uses backend endpoint and updates local state only after success', () => {
  assert.match(source, /const addShotLog=async\(made,date\)=>\{[\s\S]*fetch\("\/v1\/home-shots\/log"/);
  assert.match(source, /if\(!res\.ok\)throw new Error/);
  assert.match(source, /setShotLogs\(prev=>\[\.\.\.prev,localLog\]\)/);
});

test('coach/team scoped data path filters shot logs by active team id', () => {
  assert.match(source, /const scopedShotLogs=shotLogs\.filter\(l=>l\.teamId===user\?\.teamId\);/);
  assert.match(source, /shotLogs=\{scopedShotLogs\}/);
});

test('coach dashboard pulls home shots leaderboard for the same team id', () => {
  assert.match(source, /const fetchHomeShotsLeaderboard=useCallback\(async\(teamId,scope=homeShotsLeaderboardScope\)=>\{/);
  assert.match(source, /\/v1\/leaderboards\/home-shots\?team_id=\$\{encodeURIComponent\(teamId\)\}/);
  assert.match(source, /refreshHomeShotsLeaderboard=\{\(\)=>fetchHomeShotsLeaderboard\(user\?\.teamId,homeShotsLeaderboardScope\)\}/);
});

test('coach/player home shots cards handle empty stats without crashing', () => {
  assert.match(source, /const rows=Array\.isArray\(body\?\.leaderboard\)\?body\.leaderboard:\[\];/);
  assert.match(source, /setHomeShotsLeaderboard\(\{status:"success",rows,error:""\}\);/);

  const leaderboardCardSource = fs.readFileSync(
    new URL('../src/components/HomeShotsLeaderboardCard.jsx', import.meta.url),
    'utf8',
  );
  assert.match(leaderboardCardSource, /rows\.length === 0/);
  assert.match(leaderboardCardSource, /No shots logged yet — once players log At Home Shots, leaders will appear here\./);
});
