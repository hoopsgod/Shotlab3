import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildProgramDrillLeaderboardRows, buildProgramScoreRow, getAllProgramScoreRows, getProgramDrillBreakdownRows, getProgramLeaderboardRows, getProgramScoresForDrill, getProgramScoresForPlayer, validateProgramDrillScore } from '../src/lib/programDrillScoring.js';
import { normalizeProgramScoreRowForDb } from '../src/lib/remotePersistence.js';
import { resolvePlayerDisplayName } from '../src/lib/playerDataManagement.js';

const players = [
  { email: 'active@team.test', id: 'player:team_active', player_id: 'player:team_active', teamId: 'team-a', role: 'player', name: 'Active Player' },
  { email: 'other@team.test', id: 'player:team_other', player_id: 'player:team_other', teamId: 'team-a', role: 'player', name: 'Other Player' },
  { email: 'archived@team.test', id: 'player:team_archived', player_id: 'player:team_archived', teamId: 'team-a', role: 'player', name: 'Archived Player', archived: true, hideFromLeaderboards: true },
];

test('player can type a numeric score into a Program Log drill score input and save is disabled only when invalid', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /type="number" inputMode="decimal" pattern="\[0-9\]\*"/);
  assert.match(source, /disabled=\{submitting\|\|activeScoreInvalid\}/);
  assert.equal(validateProgramDrillScore('', { id: 'drill-a' }).ok, false);
  assert.equal(validateProgramDrillScore('12', { id: 'drill-a' }).ok, true);
  assert.equal(validateProgramDrillScore('0', { id: 'drill-a' }).ok, false);
  assert.equal(validateProgramDrillScore('0', { id: 'drill-a', allowZeroScore: true }).ok, true);
});

test('saving creates a normalized program score row with roster player_id and stable drill identity', () => {
  const appRow = buildProgramScoreRow({
    drill: { id: 'demo-program-warm-up-shooting-4-minute', name: '4 MINUTE WARM UP SHOOTING' },
    score: 17,
    user: { email: 'active@team.test', teamId: 'team-a', name: 'Active Player' },
    players,
    id: 'score-fixed',
    now: 123456,
    date: '2026-06-16',
  });
  assert.equal(appRow.player_id, 'player:team_active');
  assert.notEqual(appRow.player_id, 'active@team.test');
  const dbRow = normalizeProgramScoreRowForDb(appRow);
  assert.deepEqual({
    id: dbRow.id,
    player_email: dbRow.player_email,
    player_id: dbRow.player_id,
    team_id: dbRow.team_id,
    drill_id: dbRow.drill_id,
    score: dbRow.score,
    session_date: dbRow.session_date,
    src: dbRow.src,
  }, {
    id: 'score-fixed',
    player_email: 'active@team.test',
    player_id: 'player:team_active',
    team_id: 'team-a',
    drill_id: 'demo-program-warm-up-shooting-4-minute',
    score: 17,
    session_date: '2026-06-16',
    src: 'program',
  });
});

test('program drill leaderboard is drill-specific, filters inactive players, and ranks without gaps', () => {
  const warmup = { id: 'demo-program-warm-up-shooting-4-minute', name: '4 MINUTE WARM UP SHOOTING' };
  const calipari = { id: 'demo-program-calipari-shooting', name: 'CALIPARI SHOOTING' };
  const scores = [
    { src: 'program', drillId: warmup.id, email: 'active@team.test', player_id: 'player:team_active', name: 'Active Player', score: 4 },
    { src: 'program', drillId: warmup.id, email: 'other@team.test', player_id: 'player:team_other', name: 'Other Player', score: 9 },
    { src: 'program', drillId: calipari.id, email: 'active@team.test', player_id: 'player:team_active', name: 'Active Player', score: 99 },
    { src: 'program', drillId: warmup.id, email: 'archived@team.test', player_id: 'player:team_archived', name: 'Archived Player', score: 1000 },
  ];
  const warmupRows = buildProgramDrillLeaderboardRows({ scores, drill: warmup, players });
  assert.deepEqual(warmupRows.map((r) => [r.rank, r.player_id, r.total]), [[1, 'player:team_other', 9], [2, 'player:team_active', 4]]);
  assert.equal(warmupRows.some((r) => r.total === 99 || r.email === 'archived@team.test'), false);
  const calipariRows = buildProgramDrillLeaderboardRows({ scores, drill: calipari, players });
  assert.deepEqual(calipariRows.map((r) => [r.rank, r.player_id, r.total]), [[1, 'player:team_active', 99]]);
});

test('program score DB normalization strips app-only fields while preserving stable string drill_id', () => {
  const appRow = buildProgramScoreRow({
    drill: { id: 'demo-program-calipari-shooting', name: 'CALIPARI SHOOTING' },
    score: 22,
    user: { email: 'active@team.test', teamId: 'team-a', name: 'Active Player' },
    players,
    id: 'score-program-safe',
    now: 987,
    date: '2026-06-17',
  });
  const dbRow = normalizeProgramScoreRowForDb({ ...appRow, drillName: 'CALIPARI SHOOTING', hideFromLeaderboards: true });
  assert.deepEqual(Object.keys(dbRow).sort(), ['drill_id', 'drill_name', 'id', 'player_email', 'player_id', 'player_name', 'score', 'session_date', 'src', 'team_id'].sort());
  assert.equal(dbRow.drill_id, 'demo-program-calipari-shooting');
  assert.equal(Object.hasOwn(dbRow, 'drillId'), false);
  assert.equal(Object.hasOwn(dbRow, 'drillName'), false);
  assert.equal(Object.hasOwn(dbRow, 'email'), false);
});

test('program score of 25 appears in Program stats, Program leaderboard, and profile Program drill breakdown without changing home breakdown', () => {
  const drill = { id: 'demo-program-calipari-shooting', name: 'CALIPARI SHOOTING', src: 'program' };
  const homeDrill = { id: 'demo-home-calipari-shooting', name: 'CALIPARI SHOOTING', src: 'home' };
  const programScores = [{ src: 'program', drillId: drill.id, email: 'active@team.test', player_id: 'player:team_active', name: 'Active Player', score: 25, date: '2026-06-22', ts: 25, teamId: 'team-a' }];
  const homeScores = [];

  const playerProgramScores = getProgramScoresForPlayer(programScores, 'active@team.test', 'team-a');
  const todayProgramTotal = playerProgramScores.filter((score) => score.date === '2026-06-22').reduce((sum, score) => sum + score.score, 0);
  assert.equal(todayProgramTotal, 25);

  const leaderboardRows = getProgramLeaderboardRows(programScores, drill.id, players);
  assert.deepEqual(leaderboardRows.map((row) => [row.rank, row.player_id, row.name, row.score, row.total]), [[1, 'player:team_active', 'Active Player', 25, 25]]);

  const profileProgramBreakdown = getProgramDrillBreakdownRows([drill], programScores, 'active@team.test', 'team-a');
  assert.deepEqual(profileProgramBreakdown.map((row) => [row.id, row.pb, row.avg, row.count]), [[drill.id, 25, 25, 1]]);

  const homeBreakdown = [homeDrill].map((d) => homeScores.filter((score) => score.drillId === d.id));
  assert.deepEqual(homeBreakdown, [[]]);
});

test('program drills support repeated optional attempts and leaderboards rank by best score', () => {
  const drillA = { id: 'program-drill-a', name: 'PROGRAM DRILL A', src: 'program' };
  const drillB = { id: 'program-drill-b', name: 'PROGRAM DRILL B', src: 'program' };
  const user = { email: 'active@team.test', name: 'Active Player', teamId: 'team-a' };
  const firstAttempt = buildProgramScoreRow({ drill: drillA, score: 20, user, players, now: 1000, date: '2026-06-22' });
  const secondAttempt = buildProgramScoreRow({ drill: drillA, score: 25, user, players, now: 1000, date: '2026-06-22' });
  const thirdAttempt = buildProgramScoreRow({ drill: drillA, score: 22, user, players, now: 1000, date: '2026-06-22' });
  const repeatedAttempts = [firstAttempt, secondAttempt];

  assert.notEqual(firstAttempt.id, secondAttempt.id);
  assert.notEqual(secondAttempt.id, thirdAttempt.id);
  assert.equal(getAllProgramScoreRows(repeatedAttempts).length, 2);
  assert.deepEqual(getProgramScoresForDrill(repeatedAttempts, drillA).map((row) => row.score), [20, 25]);
  assert.deepEqual(getProgramScoresForDrill(repeatedAttempts, drillB).map((row) => row.score), []);

  const breakdown = getProgramDrillBreakdownRows([drillA, drillB], repeatedAttempts, 'active@team.test', 'team-a');
  assert.deepEqual(breakdown.map((row) => [row.id, row.pb, row.avg, row.count]), [[drillA.id, 25, 22.5, 2], [drillB.id, 0, 0, 0]]);

  const playerLeaderboard = getProgramLeaderboardRows(repeatedAttempts, drillA, players);
  const coachLeaderboard = getProgramLeaderboardRows(repeatedAttempts, drillA, [{ userId: 'player:team_active', email: 'active@team.test', name: 'Active Player', teamId: 'team-a' }]);
  assert.deepEqual(playerLeaderboard.map((row) => [row.rank, row.name, row.score, row.total, row.attempts]), [[1, 'Active Player', 25, 25, 2]]);
  assert.deepEqual(coachLeaderboard.map((row) => [row.rank, row.name, row.score, row.total, row.attempts]), [[1, 'Active Player', 25, 25, 2]]);

  const afterThirdAttempt = [...repeatedAttempts, thirdAttempt];
  assert.equal(getAllProgramScoreRows(afterThirdAttempt).length, 3);
  assert.deepEqual(getProgramDrillBreakdownRows([drillA], afterThirdAttempt, 'active@team.test', 'team-a').map((row) => [row.pb, row.avg, row.count]), [[25, 22.3, 3]]);
  assert.deepEqual(getProgramLeaderboardRows(afterThirdAttempt, drillA, players).map((row) => [row.score, row.attempts]), [[25, 3]]);

  const homeLeaderboardRows = [];
  assert.deepEqual(homeLeaderboardRows, []);
});

test('program score selectors normalize drill_id and player_email aliases', () => {
  const drill = { id: 'demo-program-calipari-shooting', name: 'CALIPARI SHOOTING', src: 'program' };
  const aliasRows = [{ drill_id: drill.id, player_email: 'active@team.test', player_id: 'player:team_active', team_id: 'team-a', score: '25', session_date: '2026-06-22' }];

  assert.deepEqual(getAllProgramScoreRows(aliasRows).map((row) => [row.drillId, row.email, row.teamId, row.score, row.src]), [[drill.id, 'active@team.test', 'team-a', 25, 'program']]);
  assert.deepEqual(getProgramScoresForPlayer(aliasRows, 'active@team.test', 'team-a').map((row) => row.score), [25]);
  assert.deepEqual(getProgramLeaderboardRows(aliasRows, drill, players).map((row) => [row.rank, row.player_id, row.name, row.score, row.total]), [[1, 'player:team_active', 'Active Player', 25, 25]]);
  assert.deepEqual(getProgramDrillBreakdownRows([drill], aliasRows, 'active@team.test', 'team-a').map((row) => [row.pb, row.avg, row.count]), [[25, 25, 1]]);
});

test('program leaderboard and breakdown tolerate missing roster match and drill_name fallback', () => {
  const drill = { id: 'coach-selected-program-drill', name: 'COACH SELECTED DRILL', src: 'program' };
  const savedRows = [{ drill_id: 'legacy-program-key', drill_name: drill.name, player_email: 'active@team.test', team_id: 'team-a', score: 25, session_date: '2026-06-22' }];

  assert.deepEqual(getProgramLeaderboardRows(savedRows, drill, []).map((row) => [row.rank, row.email, row.name, row.score, row.total]), [[1, 'active@team.test', 'active', 25, 25]]);
  assert.deepEqual(getProgramDrillBreakdownRows([drill], savedRows, 'active@team.test', 'team-a').map((row) => [row.id, row.pb, row.avg, row.count]), [[drill.id, 25, 25, 1]]);
});

test('coach Program Drills leaderboard resolves player profile names and score fields', () => {
  const drill = { id: 'coach-selected-program-drill', name: 'COACH SELECTED DRILL', src: 'program' };
  const programScores = [{ drill_id: drill.id, player_email: 'active@team.test', player_id: 'profile-user-1', team_id: 'team-a', score: '25', session_date: '2026-06-22' }];
  const playerProfiles = [{ userId: 'profile-user-1', email: 'active@team.test', name: 'Active Player', teamId: 'team-a' }];

  const rows = getProgramLeaderboardRows(programScores, drill, playerProfiles);
  assert.deepEqual(rows.map((row) => [row.rank, row.name, row.score, row.total, row.player_display_name]), [[1, 'Active Player', 25, 25, 'Active Player']]);
  assert.notEqual(rows[0].name, 'Player');
});


test('coach roster display names prefer real player/profile data over generic fallbacks', () => {
  const profiles = [
    { email: 'active@team.test', name: 'Active Player', displayName: 'Active Display', teamId: 'team-a' },
    { userId: 'player:team_other', displayName: 'Other Profile', teamId: 'team-a' },
  ];

  assert.equal(resolvePlayerDisplayName({ email: 'active@team.test', name: 'Player' }, profiles), 'Active Player');
  assert.equal(resolvePlayerDisplayName({ id: 'player:team_other', email: '', name: '' }, profiles), 'Other Profile');
  assert.equal(resolvePlayerDisplayName({ email: 'fallback.name@team.test', name: '' }, []), 'fallback.name');
  assert.equal(resolvePlayerDisplayName({}, []), 'Unknown Player');
});

test('program drill completion waits for successful save result', () => {
  const source = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(source, /const handleLog=async\(\)=>/);
  assert.match(source, /const saveResult=await addScore\(active\.id,v,activeMode\);/);
  assert.match(source, /await P\("sl:program-scores",nextProgramScores,setProgramScores,\{strictRemote:true,remoteRows:\[scoreRow\]\}\)/);
  assert.match(source, /if\(!saveResult\?\.ok\)\{setSubmitting\(false\);return;\}/);
  assert.match(source, /setSaved\(true\)/);
  assert.equal(source.includes('return <button key={d.id} className="ch" onClick={()=>setActive(d)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:"#131821"'), true);
  assert.equal(source.includes('return <button key={d.id} className="ch" onClick={()=>!done&&setActive(d)} style={{width:"100%",display:"flex",alignItems:"center",gap:14,background:"#131821"'), false);
});

test('leaderboards hub Program Drills path uses program score selectors while At Home stays on home leaderboard rows', () => {
  const appSource = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const hubSource = fs.readFileSync(new URL('../src/components/PremiumLeaderboardsHub.jsx', import.meta.url), 'utf8');
  const compactCardSource = fs.readFileSync(new URL('../src/components/CompactLeaderboardPreviewCard.jsx', import.meta.url), 'utf8');

  assert.match(appSource, /programScores=\{teamProgramScores\}/);
  assert.match(appSource, /programScores=\{safeProgramScores\}/);
  assert.match(appSource, /const safeProgramScores=useMemo\(\(\)=>filterActiveTeamPlayerRows\(getAllProgramScoreRows\(programScores\)\.filter\(score=>!u\?\.teamId\|\|score\.teamId===u\.teamId\),activeTeamPlayerEmailSet,activeTeamPlayerKeySet\)/);
  assert.match(appSource, /const leaderboardPlayers=useMemo\(\(\)=>\[\.\.\.\(Array\.isArray\(players\)\?players:\[\]\),\.\.\.\(Array\.isArray\(playerProfiles\)\?playerProfiles:\[\]\)\]/);
  assert.match(appSource, /viewerRole="coach"[\s\S]*players=\{leaderboardPlayers\}/);
  assert.match(appSource, /const coachRosterPlayers=useMemo\(\(\)=>getCoachRosterPlayers\(\{players,playerProfiles,teamId:u\?\.teamId\}\)/);
  assert.match(appSource, /<CoachRoster players=\{filteredCoachRosterPlayers\}[\s\S]*onSelectPlayer=\{openPlayerIntelligence\}/);
  assert.match(appSource, /function CoachRoster\(\{players,scores,shotLogs,drills,nudged,setNudged,onRemovePlayer,onSelectPlayer\}\)/);
  assert.match(appSource, /onClick=\{\(\)=>onSelectPlayer\?\.\(p\)\}/);
  assert.match(appSource, /function CoachPlayerProgramAttemptDetails/);
  assert.match(appSource, /data-testid="coach-player-program-attempts"/);
  assert.match(appSource, /PROGRAM DRILL ATTEMPTS/);
  assert.match(appSource, /getProgramDrillBreakdownRows\(programDrills,programScores,playerBreakdownKey,teamId\)/);
  assert.match(appSource, /getProgramScoresForDrill\(programScores,row\)\.filter\(matchesPlayer\)/);
  assert.match(appSource, /\{l:"LOGGED",v:row\.count\}/);
  assert.match(appSource, /\{l:"PB",v:row\.pb\}/);
  assert.match(appSource, /\{l:"AVG",v:row\.avg\}/);
  assert.match(appSource, /Score \{attempt\.score\}/);
  assert.match(hubSource, /const normalizedProgramScores = useMemo\([\s\S]*?getAllProgramScoreRows\(programScores\)\.filter\(\(score\) => !teamId \|\| score\.teamId === teamId\)/);
  assert.match(hubSource, /buildCurrentOffseasonProgramLeaderboardRows\(\{[\s\S]*programScores: normalizedProgramScores,[\s\S]*drill: selectedProgramDrill/);
  assert.match(hubSource, /filterActiveTeamLeaderboardRows\(rawCurrentProgramRows, activeRosterKeySet, activeRosterEmailSet, activeRosterNameSet\)/);
  assert.match(hubSource, /activeLeaderboardCategory === 'home_shots'[\s\S]*rows=\{atHomeLeaderboardRows\}/);
  assert.match(hubSource, /buildAtHomeLeaderboardRows\(\{ scores: homeScores, shotLogs, programDrills, players, limit: 10 \}\)/);
  assert.match(hubSource, /filterActiveTeamLeaderboardRows\(currentHomeSourceRows, activeRosterKeySet, activeRosterEmailSet, activeRosterNameSet\)/);
  assert.match(hubSource, /Program Drill leaderboard has no rows/);
  assert.match(hubSource, /selectedLeaderboardDrillName: selectedProgramDrill\.name/);
  assert.match(hubSource, /availablePlayerIdentities:/);
  assert.match(compactCardSource, /const displayName = entry\.player_display_name \|\| entry\.displayName \|\| entry\.name/);
  assert.match(compactCardSource, /const scoreValue = entry\.metricValue \?\? entry\.total_home_shots \?\? entry\.score \?\? entry\.total/);
});
