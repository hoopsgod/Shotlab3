import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

test('player-entered drill, event, and shot data is persisted with team scope for coach leaderboards', async () => {
  const source = await appSource();

  assert.match(source, /const addScore=async\(drillId,score,src="home"\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;await P\("sl:scores",\[\.\.\.scores,\{email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name,drillId,score,date:todayStr\(\),ts:Date\.now\(\),src\}\],setScores\)/);
  assert.match(source, /const addShotLog=async\(made,date\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;await P\("sl:shotlogs",\[\.\.\.shotLogs,\{email:user\.email,playerId:user\.email,teamId:user\.teamId,name:user\.name,made,date,ts:Date\.now\(\)\}\],setShotLogs\)/);
  assert.match(source, /const toggleRsvp=async\(eid\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;/);
});

test('coach dashboard leaderboard supports drills, events, and shots leader categories', async () => {
  const source = await appSource();

  assert.match(source, /function DashboardLeaderboard\(\{scores,drills,programDrills,user,scRsvps,rsvps,shotLogs,players\}\)\{/);
  assert.match(source, /if\(sub==="shots"\)\{/);
  assert.match(source, /if\(sub==="events"\)\{/);
  assert.match(source, /\{k:"total",l:"ALL"\},\{k:"shots",l:"SHOTS"\},\.\.\.drills\.map\(d=>\(\{k:String\(d\.id\),l:d\.name\}\)\)/);
  assert.match(source, /\{k:"events",l:"ATTENDANCE"\},\{k:"sc",l:"S&C"\},\{k:"prog-total",l:"DRILL SCORES"\}/);
});

test('coach leaderboard output is restricted to eligible team players', async () => {
  const source = await appSource();

  assert.match(source, /const leaderboardEligible=useMemo\(\(\)=>new Set\(players\.filter\(p=>p\.role!=="coach"&&isLeaderboardEligible\(players,p\.email\)\)\.map\(p=>p\.email\)\),\[players\]\)/);
  assert.match(source, /\.filter\(entry=>leaderboardEligible\.has\(entry\.email\)\)\.sort\(\(a,b\)=>b\.total-a\.total\)/);
});
