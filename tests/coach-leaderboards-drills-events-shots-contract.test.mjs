import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);

async function appSource() {
  return readFile(APP_PATH, 'utf8');
}

test('player-entered stats require durable ids, strict remote persistence, sync error handling, and coach-data refresh', async () => {
  const source = await appSource();

  assert.match(source, /const addScore=async\(drillId,score,src="home"\)=>\{/);
  assert.match(source, /id:genId\("score"\),email:user\.email,playerId:user\.email,teamId:user\.teamId/);
  assert.match(source, /await P\("sl:scores",nextScores,setScores,\{strictRemote:true\}\)/);
  assert.match(source, /setStatSyncError\("Could not save score to team dashboard\. Please try again\."\)/);
  assert.match(source, /await fetchHomeShotsLeaderboard\(user\.teamId,homeShotsLeaderboardScope\)/);

  assert.match(source, /const addShotLog=async\(made,date\)=>\{/);
  assert.match(source, /id:genId\("shotlog"\),email:user\.email,playerId:user\.email,teamId:user\.teamId/);
  assert.match(source, /await P\("sl:shotlogs",nextLogs,setShotLogs,\{strictRemote:true\}\)/);
  assert.match(source, /setStatSyncError\("Could not save home shots to team dashboard\. Please try again\."\)/);

  assert.match(source, /const \[statSyncError,setStatSyncError\]=useState\(""\)/);
  assert.match(source, /refreshHomeShotsLeaderboard=\{\(\)=>fetchHomeShotsLeaderboard\(user\?\.teamId,homeShotsLeaderboardScope\)\} statSyncError=\{statSyncError\}/);
  assert.match(source, /\{statSyncError&&<div[^>]*>\{statSyncError\}<\/div>\}/);
  assert.match(source, /const toggleRsvp=async\(eid\)=>\{if\(!requirePlayer\(user,user\?\.teamId,user\?\.email\)\)return;/);
});

test('coach roster receives team-scoped persisted score/shot data and maps it by player email', async () => {
  const source = await appSource();

  assert.match(source, /const scopedScores=scores\.filter\(s=>s\.teamId===user\?\.teamId\)/);
  assert.match(source, /const scopedShotLogs=shotLogs\.filter\(l=>l\.teamId===user\?\.teamId\)/);
  assert.match(source, /shotLogs=\{scopedShotLogs\}/);
  assert.match(source, /scores=\{scopedScores\}/);
  assert.match(source, /const playerScores=scores\.filter\(s=>s\.email===p\.email\)/);
  assert.match(source, /const playerShotLogs=shotLogs\.filter\(s=>s\.email===p\.email\)/);
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

test('team code lookup normalizes input and uses shared backend invite source', async () => {
  const source = await appSource();

  assert.match(source, /const normalizedCode=normalizeJoin\(code\)\.replace\(\/\[-\\s\]\+\/g,""\)/);
  assert.match(source, /lookupSource:"backend_invite_context"/);
  assert.match(source, /lookupField:"team_invites\.code_hash"/);
  assert.match(source, /lookupHashSource:"public\.hash_invite_code\(public\.normalize_invite_code\(code\)\)"/);
  assert.match(source, /lookupHashPrefix:""/);
  assert.match(source, /inviteState:""/);
  assert.match(source, /expiresAt:null/);
  assert.match(source, /const resolvedNormalizedCode=String\(body\?\.normalized_code\|\|normalizedCode\|\|""\)/);
  assert.match(source, /const resolvedHashPrefix=String\(body\?\.lookup_hash_prefix\|\|""\)/);
  assert.match(source, /const resolvedLookupCount=Number\.isFinite\(Number\(body\?\.lookup_count\)\)\?Number\(body\?\.lookup_count\):0/);
  assert.match(source, /const resolvedMatchedTeamId=String\(body\?\.matched_team_id\|\|body\?\.team_id\|\|""\)/);
  assert.match(source, /const ctx=\{joinContextToken:body\.join_context_token,token:body\.join_context_token/);
  assert.match(source, /const INVITE_CONTEXT_STORAGE_KEY = "sl:invite-context"/);
  assert.match(source, /const savedInviteContext=normalizeStoredInviteContext\(pendingJoinContext\)\|\|readInviteContextFromStorage\(\)/);
  assert.match(source, /const canUseSavedContext=Boolean\(activeContext\?\.joinContextToken\)/);
  assert.match(source, /const joined=await consumeJoinContext\(user,null,activeContext\)/);
  assert.match(source, /No validated invite context \(checked \$\{INVITE_CONTEXT_STORAGE_KEY\}\)\./);
  assert.match(source, /<div>Invite context saved: \{dataDebug\.join\.inviteContextSaved\|\|"no"\}<\/div>/);
  assert.match(source, /<div>Invite context storage key: \{dataDebug\.join\.inviteContextStorageKey\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Invite context token present: \{dataDebug\.join\.inviteContextTokenPresent\|\|"no"\}<\/div>/);
  assert.match(source, /<div>Invite context teamId: \{dataDebug\.join\.inviteContextTeamId\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Invite context subject: \{dataDebug\.join\.inviteContextSubject\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Current user email: \{dataDebug\.join\.currentUserEmail\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Context subject matches user: \{dataDebug\.join\.contextSubjectMatchesUser\|\|"no"\}<\/div>/);
  assert.match(source, /<div>Lookup hash prefix: \{dataDebug\.join\.lookupHashPrefix\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Invite state: \{dataDebug\.join\.inviteState\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Invite expiresAt: \{dataDebug\.join\.expiresAt\|\|"none"\}<\/div>/);
  assert.match(source, /const ctx=await startJoinContext\(normalizedCode,user\.email\)/);
  assert.match(source, /const joined=await consumeJoinContext\(user,null,activeContext\)/);
});

test('player join persists resolved teamId to player record and player profile', async () => {
  const source = await appSource();

  assert.match(source, /const np=players\.map\(p=>p\.email===user\.email\?\{\.\.\.p,teamId:resolvedTeamId\}:p\)/);
  assert.match(source, /await P\("sl:players",np,setPlayers\)/);
  assert.match(source, /teamId:resolvedTeamId,firstName:parts\[0\]\|\|"Player"/);
  assert.match(source, /setUser\(\{\.\.\.user,teamId:resolvedTeamId\}\)/);
});

test('coach team creation persists backend team_id and invite_code into shared team record fields', async () => {
  const source = await appSource();

  assert.match(source, /const endpoint="\/v1\/coach-signup\/bootstrap"/);
  assert.match(source, /const bootstrapRes=await fetch\(endpoint/);
  assert.match(source, /body:JSON\.stringify\(\{team_name:san\(name\)\|\|"Team"\}\)/);
  assert.match(source, /const code=normalizeJoin\(bootstrapBody\?\.invite_code\|\|""\)/);
  assert.match(source, /const teamId=String\(bootstrapBody\?\.team_id\|\|""\)\.trim\(\)/);
  assert.match(source, /const nt=\{id:teamId,[\s\S]*joinCode:code/);
  assert.match(source, /parseCreateTeamErrorMessage\(bootstrapStatus,errorCode,parseMode\)/);
  assert.match(source, /if\(status===404\)return"Team setup endpoint is missing\.";/);
  assert.match(source, /if\(status===401\|\|status===403\)return"Coach authorization failed\. Please sign in again\.";/);
  assert.match(source, /if\(status>=500&&String\(errorCode\|\|""\)\.toLowerCase\(\)==="env_config_mismatch"\)return"Team setup is not configured on the server\.";/);
  assert.match(source, /case"missing_rpc":/);
  assert.match(source, /case"coach_user_not_found":/);
  assert.match(source, /case"rpc_permission_denied":/);
  assert.match(source, /case"table_missing":/);
  assert.match(source, /normalizedErrorCode\.startsWith\("table_missing_"\)/);
  assert.match(source, /normalizedErrorCode\.startsWith\("missing_function_"\)/);
  assert.match(source, /case"invalid_service_key":/);
  assert.match(source, /case"rpc_argument_mismatch":/);
  assert.match(source, /case"schema_type_mismatch_teams_id":/);
  assert.match(source, /case"unknown_rpc_failure":/);
  assert.match(source, /return\{ok:false,err:"Network error while creating team\."\};/);
  assert.match(source, /createTeam:\{teamName:"",endpoint:"",httpStatus:null,errorCode:"",responseSummary:"",teamId:"",joinCode:"",stateUpdated:false,remotePersisted:false,status:"idle"\}/);
  assert.match(source, /<div>Create team name: \{dataDebug\.createTeam\.teamName\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Create endpoint: \{dataDebug\.createTeam\.endpoint\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Returned teamId: \{dataDebug\.createTeam\.teamId\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Returned joinCode: \{dataDebug\.createTeam\.joinCode\|\|"none"\}<\/div>/);
  assert.match(source, /<div>Remote persisted: \{dataDebug\.createTeam\.remotePersisted\?"yes":"no"\}<\/div>/);
});

test('leaderboard fetch differentiates empty results, endpoint failures, and parse/network failures', async () => {
  const source = await appSource();

  assert.match(source, /if \(parseMode === "non_json"\) return "Leaderboard endpoint unavailable \(invalid response format\)\."/);
  assert.match(source, /if \(status === 404\) return "Leaderboard endpoint missing\."/);
  assert.match(source, /setHomeShotsLeaderboard\(\{status:"success",rows,error:""\}\);/);
  assert.match(source, /isEmpty:rows\.length===0/);
  assert.match(source, /errorCode:"network_error"/);
});

test('coach and player dashboards both consume shared leaderboard state and fetch helper', async () => {
  const source = await appSource();

  assert.match(source, /homeShotsLeaderboard=\{homeShotsLeaderboard\}/);
  assert.match(source, /refreshHomeShotsLeaderboard=\{\(\)=>fetchHomeShotsLeaderboard\(user\?\.teamId,homeShotsLeaderboardScope\)\}/);
});
