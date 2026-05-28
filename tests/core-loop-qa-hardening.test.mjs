import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { calculateLeaderboardFromShotLogs } from '../src/lib/leaderboardService.js';
import { createShotLogService } from '../src/lib/shotLogService.js';

const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const compactSource = fs.readFileSync(new URL('../src/components/CompactLeaderboardPreviewCard.jsx', import.meta.url), 'utf8');
const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');
const leaderboardRouteSource = fs.readFileSync(new URL('../functions/v1/leaderboards/home-shots.js', import.meta.url), 'utf8');

test('core loop smoke: coach and player home surfaces mount without separate leaderboard pages', () => {
  assert.match(appSource, /PageHeader title="COACH HOME"/);
  assert.match(appSource, /tab==="home"[\s\S]*TODAY'S MISSION/);
  assert.match(appSource, /title="Home Shot Leaders"[\s\S]*mode="coach"[\s\S]*onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(appSource, /title="Team Leaders"[\s\S]*mode="player"[\s\S]*onViewAll=\{\(\)=>switchTab\("leaderboards"\)\}/);
  assert.match(appSource, /tab==="leaderboards"[\s\S]*<PremiumLeaderboardsHub viewerRole="coach"/);
  assert.match(appSource, /tab==="leaderboards"[\s\S]*<PremiumLeaderboardsHub viewerRole="player"/);
  assert.doesNotMatch(appSource, /coach-home-shots-leaderboard|player-home-shots-leaderboard|CoachLeaderboardPage/);
});

test('core loop smoke: player shot logging uses the durable API then refreshes the shared team leaderboard', () => {
  assert.match(appSource, /const addShotLog=async\(made,date\)=>\{[\s\S]*fetch\("\/v1\/home-shots\/log"/);
  assert.match(appSource, /body:JSON\.stringify\(\{id:localLog\.id,team_id:user\.teamId,player_id:user\.email/);
  assert.match(appSource, /if\(!res\.ok\)throw new Error\(String\(body\?\.error\|\|"home_shot_log_failed"\)\)/);
  assert.match(appSource, /setShotLogs\(prev=>\[\.\.\.prev,\{id:saved\.id\|\|localLog\.id/);
  assert.match(appSource, /await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\)/);
});

test('core loop smoke: at-home leaderboard totals are derived from real shot logs and visible to coach/player cards', () => {
  const shotLogs = [
    { team_id: 'team-core', player_id: 'player-a@example.com', email: 'player-a@example.com', name: 'Player A', made: 25 },
    { team_id: 'team-core', player_id: 'player-a@example.com', email: 'player-a@example.com', name: 'Player A', made: 15 },
    { team_id: 'team-core', player_id: 'player-b@example.com', email: 'player-b@example.com', name: 'Player B', made: 30 },
    { team_id: 'other-team', player_id: 'player-c@example.com', email: 'player-c@example.com', name: 'Player C', made: 999 },
  ];

  const rows = calculateLeaderboardFromShotLogs({ shotLogs, teamId: 'team-core' });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].player_id, 'player-a@example.com');
  assert.equal(rows[0].total_home_shots, 40);
  assert.equal(rows[1].player_id, 'player-b@example.com');
  assert.equal(rows[1].total_home_shots, 30);
  assert.doesNotMatch(JSON.stringify(rows), /player-c@example\.com|999/);

  assert.match(compactSource, /rows\s*=\s*\[\]/);
  assert.match(compactSource, /previewRows = safeRows\.slice\(0, Math\.max\(1, limit\)\)/);
  assert.match(appSource, /title="Home Shot Leaders"[\s\S]*rows=\{homeShotsLeaderboard\?\.rows\|\|\[\]\}/);
  assert.match(appSource, /title="Team Leaders"[\s\S]*rows=\{homeShotsLeaderboard\?\.rows\|\|\[\]\}/);
});

test('core loop smoke: refresh reloads persisted Supabase data instead of clearing leaderboard rows', async () => {
  const persistedLogs = [
    { team_id: 'team-persist', player_id: 'persist-player@example.com', email: 'persist-player@example.com', made: 12 },
    { team_id: 'team-persist', player_id: 'persist-player@example.com', email: 'persist-player@example.com', made: 8 },
  ];
  const supabaseClient = {
    isConfigured: true,
    from(table) {
      assert.equal(table, 'shot_logs');
      return { async select() { return { data: persistedLogs, error: null }; } };
    },
  };
  const service = createShotLogService({ supabaseClient });
  const beforeRefresh = await service.loadTeamShotLogs({ teamId: 'team-persist' });
  const afterRefresh = await service.loadTeamShotLogs({ teamId: 'team-persist' });
  assert.equal(beforeRefresh.mode, 'supabase');
  assert.equal(afterRefresh.mode, 'supabase');
  assert.deepEqual(afterRefresh.data, beforeRefresh.data);
  assert.equal(afterRefresh.data.reduce((sum, row) => sum + Number(row.made || 0), 0), 20);
});

test('core loop smoke: shared leaderboards hub uses no fake leaderboard rows', () => {
  assert.match(hubSource, /At-Home Shots/);
  assert.match(hubSource, /Events Attended/);
  assert.match(hubSource, /Strength & Conditioning/);
  assert.match(hubSource, /Coach Custom Drills/);
  assert.match(leaderboardRouteSource, /callRpc\(env, rpcName, rpcArgs\)/);
  assert.doesNotMatch(hubSource, /\[\s*\{\s*rank\s*:\s*1|fake|mock/i);
  assert.doesNotMatch(appSource, /\[\s*\{\s*rank\s*:\s*1\s*,\s*player_display_name/);
});
