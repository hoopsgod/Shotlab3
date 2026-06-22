import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_SHOT_SYNC_ERROR_MESSAGE,
  HOME_SHOT_VALIDATION_MESSAGE,
  buildLocalHomeShotLog,
  normalizeSavedHomeShotLog,
  resolveHomeShotRetryFailure,
  resolveHomeShotSaveFailure,
  shouldUseQuietHomeShotFallback,
  upsertHomeShotsLeaderboardRow,
  validateHomeShotLogInput,
} from '../src/lib/homeShotLogging.js';
import { isDemoAccount, isDemoPlayerSessionShotLog } from '../src/lib/demoMode.js';
import { onRequestPost } from '../functions/v1/home-shots/log.js';
import { readFile } from 'node:fs/promises';

const APP_PATH = new URL('../src/App.jsx', import.meta.url);
const ENV = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-role-key' };
const ctx = (body, headers = {}) => ({
  request: new Request('https://shotlab.test/v1/home-shots/log', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body ?? {}),
  }),
  env: ENV,
});

async function simulateHomeShotAdd({ made = 25, remoteSave, leaderboardRefresh = async () => {}, quietContext = {} } = {}) {
  const user = { email: 'player@team.com', teamId: 'team-a', name: 'Player One' };
  const validation = validateHomeShotLogInput({ made, date: '2026-05-30' });
  if (!validation.ok) return { result: { ok: false, error: validation.error, validation: true }, shotLogs: [], statSyncError: validation.error };

  const localLog = buildLocalHomeShotLog({ id: 'shotlog-local', user, made: validation.made, date: validation.date, ts: 1000 });
  let shotLogs = [localLog];
  let statSyncError = '';

  try {
    const savedLog = await remoteSave(localLog);
    shotLogs = shotLogs.map((log) => (log.id === localLog.id ? savedLog : log));
    let refreshPromise = null;
    try {
      refreshPromise = Promise.resolve(leaderboardRefresh()).catch(() => {});
    } catch (_error) {
      refreshPromise = Promise.resolve();
    }
    return { result: { ok: true, mode: 'remote_saved', syncState: 'remote_saved' }, shotLogs, statSyncError, refreshPromise };
  } catch (error) {
    const saveFailure = resolveHomeShotSaveFailure({ error, quietContext });
    shotLogs = shotLogs.map((log) => (log.id === localLog.id ? { ...log, syncState: saveFailure.syncState, syncSource: 'local', syncError: saveFailure.errorCode } : log));
    statSyncError = saveFailure.statSyncError;
    return { result: saveFailure, shotLogs, statSyncError };
  }
}

async function simulateRetrySync({ shotLogs, remoteSave, leaderboardRefresh = async () => {} }) {
  const [target] = shotLogs.filter((log) => log.syncState === 'local_pending' || log.syncState === 'failed_sync');
  let nextLogs = shotLogs.map((log) => (log.id === target.id ? { ...log, syncState: 'syncing', syncSource: 'local', syncError: '' } : log));
  const savedLog = await remoteSave({ ...target, syncState: 'local_pending' });
  nextLogs = nextLogs.map((log) => (log.id === target.id ? savedLog : log));
  let refreshPromise = null;
  try {
    refreshPromise = Promise.resolve(leaderboardRefresh()).catch(() => {});
  } catch (_error) {
    refreshPromise = Promise.resolve();
  }
  return { result: { ok: true, mode: 'remote_saved', syncState: 'remote_saved' }, shotLogs: nextLogs, refreshPromise };
}

test('player can log valid home shots through the team-dashboard route without using the red fallback path', async () => {
  const originalFetch = global.fetch;
  let insertedRow;
  global.fetch = async (url, init) => {
    if (String(url).includes('/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify('uuid-player'), { status: 200 });
    if (String(url).includes('/team_memberships') && String(url).includes('user_id=eq.uuid-player')) return new Response(JSON.stringify([{ id: 'm-uuid', status: 'active' }]), { status: 200 });
    if (String(url).includes('/players')) return new Response(JSON.stringify([]), { status: 200 });
    if (String(url).includes('/shot_logs')) {
      insertedRow = JSON.parse(init.body)[0];
      return new Response(JSON.stringify([insertedRow]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ id: 'shotlog-1', team_id: 'team-a', player_id: 'p@x.com', email: 'p@x.com', made: 42, date: '2026-05-29' }, { 'x-user-id': 'p@x.com' }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.diagnostic.authorized_by, 'uuid');
    assert.equal(insertedRow.made, 42);
    assert.equal(insertedRow.team_id, 'team-a');
    assert.equal(insertedRow.player_id, 'p@x.com');
    assert.equal(insertedRow.email, 'p@x.com');
  } finally {
    global.fetch = originalFetch;
  }
});

test('leaderboard row helper ranks a remote-saved home shot row', () => {
  const rows = upsertHomeShotsLeaderboardRow(
    [{ rank: 1, player_display_name: 'Ava', total_home_shots: 75, email: 'ava@team.com' }],
    { user: { email: 'demo@shotlab.app', name: 'Demo Player' }, made: 50 },
  );
  assert.deepEqual(rows.map((row) => [row.rank, row.player_display_name, row.total_home_shots]), [
    [1, 'Ava', 75],
    [2, 'Demo Player', 50],
  ]);

  const updated = upsertHomeShotsLeaderboardRow(rows, { user: { email: 'demo@shotlab.app', name: 'Demo Player' }, made: 40 });
  assert.equal(updated[0].player_display_name, 'Demo Player');
  assert.equal(updated[0].total_home_shots, 90);
});

test('Demo Player or missing durable membership uses quiet local fallback instead of a scary red failure', () => {
  assert.equal(shouldUseQuietHomeShotFallback({ status: 403, errorCode: 'forbidden', message: 'No active membership found.', isExplicitDemoOrLocal: true }), true);
  assert.equal(shouldUseQuietHomeShotFallback({ status: 403, errorCode: 'identity_mismatch', message: 'Submitted identity did not match requester.' }), false);
  const local = buildLocalHomeShotLog({ id: 'shotlog-demo', user: { email: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player' }, made: 25, date: '2026-05-29', ts: 123 });
  assert.deepEqual(local, { id: 'shotlog-demo', email: 'demo@shotlab.app', playerId: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player', made: 25, date: '2026-05-29', ts: 123, syncState: 'syncing', syncSource: 'local' });
});

test('home-shots Pages Function keeps positive-integer parser backend-local for Cloudflare deploy safety', async () => {
  const routeSource = await readFile(new URL('../functions/v1/home-shots/log.js', import.meta.url), 'utf8');
  assert.doesNotMatch(routeSource, /\.\.\/\.\.\/\.\.\/src\/lib\/homeShotLogging\.js/);
  assert.match(routeSource, /function parsePositiveInteger\(value\) \{/);
  assert.match(routeSource, /Number\.isInteger\(numericValue\)/);
  assert.match(routeSource, /Number\.isSafeInteger\(numericValue\)/);
});


test('blank, zero, negative, decimal, malformed, scientific notation, and unsafe integer submissions are rejected before remote save', async () => {
  const unsafeInteger = '9007199254740993';
  const overMax = '10001';
  for (const made of ['', '   ', 0, '0', -1, '-1', '1.5', 1.5, '1abc', '1e2', unsafeInteger, overMax]) {
    assert.deepEqual(validateHomeShotLogInput({ made, date: '2026-05-29' }), { ok: false, error: HOME_SHOT_VALIDATION_MESSAGE });
  }

  const originalFetch = global.fetch;
  let remoteCalled = false;
  global.fetch = async () => {
    remoteCalled = true;
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    for (const made of ['', '0', '-1', '1.5', '1abc', '1e2', unsafeInteger, overMax]) {
      const res = await onRequestPost(ctx({ team_id: 'team-a', player_id: 'p@x.com', made, date: '2026-05-29' }, { 'x-user-id': 'p@x.com' }));
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.error, 'invalid_made');
    }
    assert.equal(remoteCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});


test('home shot sync behavior handles success, network fallback, server failure, retry, and coach visibility', async () => {
  const remoteSave = async (log) => normalizeSavedHomeShotLog({ ...log, player_id: log.playerId, team_id: log.teamId, ts: 1001 }, log);

  const successful = await simulateHomeShotAdd({ remoteSave });
  assert.equal(successful.result.syncState, 'remote_saved');
  assert.deepEqual(successful.shotLogs.map((log) => [log.syncState, log.syncSource]), [['remote_saved', 'remote']]);

  let slowRefreshResolved = false;
  let resolveSlowRefresh;
  const slowRefresh = new Promise((resolve) => {
    resolveSlowRefresh = () => { slowRefreshResolved = true; resolve(); };
  });
  const leaderboardRefreshSlow = await simulateHomeShotAdd({
    remoteSave,
    leaderboardRefresh: () => slowRefresh,
  });
  assert.equal(leaderboardRefreshSlow.result.syncState, 'remote_saved');
  assert.deepEqual(leaderboardRefreshSlow.shotLogs.map((log) => [log.syncState, log.syncSource, log.syncError || '']), [['remote_saved', 'remote', '']]);
  assert.deepEqual(leaderboardRefreshSlow.shotLogs.filter((log) => log.syncState === 'local_pending' || log.syncState === 'failed_sync'), []);
  assert.equal(leaderboardRefreshSlow.statSyncError, '');
  assert.equal(slowRefreshResolved, false);
  resolveSlowRefresh();
  await leaderboardRefreshSlow.refreshPromise;
  assert.equal(slowRefreshResolved, true);

  const leaderboardRefreshFailed = await simulateHomeShotAdd({
    remoteSave,
    leaderboardRefresh: async () => { throw new Error('leaderboard_refresh_failed'); },
  });
  await leaderboardRefreshFailed.refreshPromise;
  assert.equal(leaderboardRefreshFailed.result.syncState, 'remote_saved');
  assert.deepEqual(leaderboardRefreshFailed.shotLogs.map((log) => [log.syncState, log.syncSource, log.syncError || '']), [['remote_saved', 'remote', '']]);
  assert.deepEqual(leaderboardRefreshFailed.shotLogs.filter((log) => log.syncState === 'local_pending' || log.syncState === 'failed_sync'), []);
  assert.equal(leaderboardRefreshFailed.statSyncError, '');

  const network = await simulateHomeShotAdd({
    remoteSave: async () => { throw new TypeError('Failed to fetch'); },
  });
  assert.deepEqual(network.shotLogs.map((log) => [log.syncState, log.syncSource, log.syncError]), [['local_pending', 'local', 'network_error']]);
  assert.equal(network.statSyncError, '');

  const rejectionError = new Error('identity_mismatch');
  rejectionError.status = 403;
  rejectionError.body = { error: 'identity_mismatch', diagnostic: { message: 'Submitted identity did not match requester.' } };
  const rejected = await simulateHomeShotAdd({
    remoteSave: async () => { throw rejectionError; },
  });
  assert.deepEqual(rejected.shotLogs.map((log) => [log.syncState, log.syncSource, log.syncError]), [['failed_sync', 'local', 'identity_mismatch']]);
  assert.equal(rejected.statSyncError, HOME_SHOT_SYNC_ERROR_MESSAGE);

  let retryRefreshResolved = false;
  let resolveRetryRefresh;
  const retryRefresh = new Promise((resolve) => {
    resolveRetryRefresh = () => { retryRefreshResolved = true; resolve(); };
  });
  const retried = await simulateRetrySync({
    shotLogs: network.shotLogs,
    remoteSave,
    leaderboardRefresh: () => retryRefresh,
  });
  assert.equal(retried.result.syncState, 'remote_saved');
  assert.deepEqual(retried.shotLogs.map((log) => [log.syncState, log.syncSource]), [['remote_saved', 'remote']]);
  assert.equal(retryRefreshResolved, false);
  resolveRetryRefresh();
  await retried.refreshPromise;
  assert.equal(retryRefreshResolved, true);

  const retryRefreshFailed = await simulateRetrySync({
    shotLogs: network.shotLogs,
    remoteSave,
    leaderboardRefresh: async () => { throw new Error('retry_leaderboard_refresh_failed'); },
  });
  await retryRefreshFailed.refreshPromise;
  assert.equal(retryRefreshFailed.result.syncState, 'remote_saved');
  assert.deepEqual(retryRefreshFailed.shotLogs.map((log) => [log.syncState, log.syncSource, log.syncError || '']), [['remote_saved', 'remote', '']]);

  const coachVisible = [...successful.shotLogs, ...network.shotLogs, ...rejected.shotLogs, ...retried.shotLogs]
    .filter((log) => log.syncState === 'remote_saved' && log.syncSource === 'remote');
  assert.deepEqual(coachVisible.map((log) => log.id), ['shotlog-local', 'shotlog-local']);
});

test('coach leaderboard stability path remains wired to PremiumLeaderboardsHub for coaches', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /<PremiumLeaderboardsHub viewerRole="coach" leaderboardRows=\{activeLeaderboardRows\} leaderboardStatus=\{homeShotsLeaderboard\?\.status\|\|"idle"\}[\s\S]*programScores=\{safeProgramScores\}/);
});

test('saved route payload normalizes back to app shot log shape for local state', () => {
  const normalized = normalizeSavedHomeShotLog(
    { id: 'remote-id', email: 'P@X.COM', player_id: 'P@X.COM', team_id: 'team-a', name: 'Player', made: '12', date: '2026-05-29', ts: '55' },
    { id: 'local-id', email: 'p@x.com', playerId: 'p@x.com', teamId: 'team-a', name: 'Fallback', made: 1, date: '2026-05-28', ts: 44 },
  );
  assert.deepEqual(normalized, { id: 'remote-id', email: 'p@x.com', playerId: 'p@x.com', teamId: 'team-a', name: 'Player', made: 12, date: '2026-05-29', ts: 55, syncState: 'remote_saved', syncSource: 'remote', syncError: '' });
});


test('manual retry flow hides local-only shots from coach until retry saves remotely', () => {
  const user = { email: 'player@team.com', teamId: 'team-a', name: 'Player One' };
  const localPending = buildLocalHomeShotLog({ id: 'shotlog-local', user, made: 18, date: '2026-05-30', ts: 1000 });
  let playerShotLogs = [{ ...localPending, syncState: 'failed_sync', syncError: 'persist_failed' }];

  assert.equal(playerShotLogs.some((log) => log.id === 'shotlog-local' && log.syncState === 'failed_sync'), true);
  const coachVisibleBeforeRetry = playerShotLogs.filter((log) => log.syncState === 'remote_saved' && log.syncSource === 'remote');
  assert.deepEqual(coachVisibleBeforeRetry, []);
  const coachLeaderboardBeforeRetry = coachVisibleBeforeRetry
    .filter((log) => log.teamId === user.teamId)
    .map((log) => upsertHomeShotsLeaderboardRow([], { user: { email: log.email, name: log.name }, made: log.made })[0]);
  assert.deepEqual(coachLeaderboardBeforeRetry, []);

  const remoteSaved = normalizeSavedHomeShotLog(
    { id: 'shotlog-local', email: user.email, player_id: user.email, team_id: user.teamId, name: user.name, made: 18, date: '2026-05-30', ts: 1001 },
    playerShotLogs[0],
  );
  playerShotLogs = playerShotLogs.map((log) => (log.id === remoteSaved.id ? remoteSaved : log));

  assert.equal(playerShotLogs[0].syncState, 'remote_saved');
  const coachVisibleAfterRetry = playerShotLogs.filter((log) => log.syncState === 'remote_saved' && log.syncSource === 'remote');
  assert.equal(coachVisibleAfterRetry.length, 1);
  const coachLeaderboardAfterRetry = upsertHomeShotsLeaderboardRow([], { user: { email: remoteSaved.email, name: remoteSaved.name }, made: remoteSaved.made });
  assert.deepEqual(coachLeaderboardAfterRetry.map((row) => [row.email, row.player_display_name, row.total_home_shots]), [
    [user.email, user.name, 18],
  ]);
});


test('coach shot-log visibility requires explicit remote_saved syncState and remote syncSource', () => {
  const logs = [
    { id: 'remote', syncState: 'remote_saved', syncSource: 'remote', made: 10 },
    { id: 'local-remote', syncState: 'remote_saved', syncSource: 'local', made: 15 },
    { id: 'pending', syncState: 'local_pending', syncSource: 'local', made: 20 },
    { id: 'failed', syncState: 'failed_sync', syncSource: 'local', made: 30 },
    { id: 'legacy-missing', made: 40 },
  ];
  const coachVisible = logs.filter((log) => log.syncState === 'remote_saved' && log.syncSource === 'remote');
  assert.deepEqual(coachVisible.map((log) => log.id), ['remote']);
});


test('coach-facing home-shot leaderboard data is server-confirmed only', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.doesNotMatch(source, /upsertHomeShotsLeaderboardRow/);
  assert.doesNotMatch(source, /setHomeShotsLeaderboard\(prev=>\(\{\.\.\.prev,status:"success",error:"",rows:/);
  assert.match(source, /const rows=Array\.isArray\(body\?\.leaderboard\)\?body\.leaderboard:\[\];/);
  assert.match(source, /setHomeShotsLeaderboard\(\{status:"success",rows,error:""\}\)/);
  assert.match(source, /const refreshHomeShotsLeaderboardAfterSave=async\(\{made,date,mode="remote_saved"\}=\{\}\)=>\{/);
  assert.match(source, /console\.warn\("home_shots_leaderboard_refresh_failed",\{mode,nonBlocking:true/);
  assert.match(source, /const savedLog=await saveHomeShotLogRemote\(localLog\);[\s\S]*void refreshHomeShotsLeaderboardAfterSave\(\{made:validation\.made,date:validation\.date,mode:"remote_saved"\}\);[\s\S]*return\{ok:true,mode:"remote_saved",syncState:"remote_saved"\}/);
  assert.doesNotMatch(source, /await refreshHomeShotsLeaderboardAfterSave\(\{made:validation\.made,date:validation\.date,mode:"remote_saved"\}\)/);
  assert.match(source, /markShotSyncState\(localLog\.id,"local_pending",saveFailure\.errorCode,saveFailure\.diagnostic\);[\s\S]*return\{ok:true,mode:"local_pending",syncState:"local_pending"/);
  assert.match(source, /markShotSyncState\(localLog\.id,"failed_sync",saveFailure\.errorCode,saveFailure\.diagnostic\);[\s\S]*await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\);/);
  assert.match(source, /const savedLog=await saveHomeShotLogRemote\(\{\.\.\.log,syncState:"local_pending"\}\);[\s\S]*void refreshHomeShotsLeaderboardAfterSave\(\{made:savedLog\.made,date:savedLog\.date,mode:"remote_saved"\}\);[\s\S]*return\{ok:true,mode:"remote_saved",syncState:"remote_saved"\}/);
  assert.doesNotMatch(source, /await refreshHomeShotsLeaderboardAfterSave\(\{made:savedLog\.made,date:savedLog\.date,mode:"remote_saved"\}\)/);
});




test('index.html does not use a MutationObserver workaround to hide Team Sync panel', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /MutationObserver/);
  assert.doesNotMatch(html, /TEAM SYNC NEEDS ATTENTION/);
});

test('stale local_pending or background_saved rows do not show the orange retry panel, but failed_sync rows do', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const isDemoHomeShotSession=isDemoMode\(\)\|\|isDemoAccount\(u\)/);
  assert.match(source, /const syncIssueShots=useMemo\(\(\)=>isDemoHomeShotSession\?\[\]:shotLogs\.filter\(s=>s\.email===u\.email&&!isDemoAccount\(s\)&&\(s\.syncState==="failed_sync"\)\),\[isDemoHomeShotSession,shotLogs,u\.email\]\)/);
  assert.match(source, /const syncIssueShots=useMemo\(\(\)=>isDemoHomeShotSession\?\[\]:my\.filter\(s=>!isDemoAccount\(s\)&&s\.syncState==="failed_sync"\),\[isDemoHomeShotSession,my\]\)/);
  assert.doesNotMatch(source, /syncState==="local_pending"\|\|s\.syncState==="failed_sync"/);
  assert.doesNotMatch(source, /syncState==="background_saved"\|\|s\.syncState==="failed_sync"/);
  assert.match(source, /TEAM SYNC NEEDS ATTENTION/);
  assert.match(source, /RETRY SYNC/);
});

test('Player At Home shot logging relies on inline Saved state instead of the large top completion cue', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /shotSaving\?"SAVING…":shotSaved\?"✓ SAVED":"LOG SHOTS"/);
  assert.match(source, /disabled=\{shotSaving\}/);
  assert.match(source, /const result=await addShotLog\(validation\.made,shotDate\)/);
  assert.match(source, /if\(result\?\.ok\)\{if\(result\.mode==="local_pending"\)/);
  assert.match(source, /setShotSaved\(true\);setShotMade\(""\)/);
  assert.match(source, /<input type="number" min="1" value=\{shotMade\}/);
  assert.doesNotMatch(source, /Shot activity logged/);
});


test('home shot save modes are explicit for remote, quiet fallback, and failed sync', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /mode:"remote_saved"/);
  assert.match(source, /mode:"local_pending"/);
  assert.match(source, /Saved locally — team sync pending/);
  assert.match(source, /mode:"failed_sync"/);
  assert.match(source, /console\.error\("home_shots_save_failed",\{mode:"failed_sync"/);
});


test('failed remote persistence is marked failed_sync with retry UI and hidden from coach dashboard local shot logs', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /markShotSyncState\(localLog\.id,"failed_sync",saveFailure\.errorCode,saveFailure\.diagnostic\)/);
  assert.match(source, /await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\)/);
  assert.match(source, /const coachVisibleShotLogs=scopedShotLogs\.filter\(l=>l\.syncState==="remote_saved"&&l\.syncSource==="remote"\)/);
  assert.match(source, /RETRY SYNC/);
  assert.equal((source.match(/<HomeShotSyncRetryPanel syncIssueShots=\{syncIssueShots\}/g)||[]).length, 2);
});


test('retry failure state clears stale visible error when retry falls back to local_pending', () => {
  let statSyncError = '';

  const firstFailure = resolveHomeShotRetryFailure({ quietFallback: false, errorCode: 'persist_failed' });
  assert.equal(firstFailure.syncState, 'failed_sync');
  statSyncError = firstFailure.statSyncError;
  assert.equal(statSyncError, HOME_SHOT_SYNC_ERROR_MESSAGE);

  const retryQuietFallback = resolveHomeShotRetryFailure({ quietFallback: true, errorCode: 'network_error' });
  assert.equal(retryQuietFallback.syncState, 'local_pending');
  statSyncError = retryQuietFallback.statSyncError;
  assert.equal(statSyncError, '');
});


test('home-shot save path dedupes repeated failed rows for the same shot attempt', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const isUnconfirmedHomeShot=\(log\)=>log\?\.syncState==="local_pending"\|\|log\?\.syncState==="failed_sync"\|\|log\?\.syncState==="syncing"\|\|log\?\.syncState==="background_saved"/);
  assert.match(source, /const isSameHomeShotEntry=\(a,b\)=>[\s\S]*Number\(a\?\.made\|\|0\)===Number\(b\?\.made\|\|0\)/);
  assert.match(source, /const appendOptimisticShot=\(log\)=>\{[\s\S]*prev\.filter\(existing=>!\(isUnconfirmedHomeShot\(existing\)&&isSameHomeShotEntry\(existing,log\)\)\),log/);
  assert.match(source, /const replaceShotLog=\(shotId,savedLog\)=>\{[\s\S]*if\(isUnconfirmedHomeShot\(log\)&&isSameHomeShotEntry\(log,savedLog\)\)return\[\]/);
});

test('retry path promotes local_pending or failed_sync shots to remote_saved', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const retryHomeShotLog=async\(log\)=>\{/);
  assert.match(source, /markShotSyncState\(log\.id,"local_pending",""\)/);
  assert.match(source, /replaceShotLog\(log\.id,savedLog\)/);
  assert.match(source, /mode:"remote_saved",syncState:"remote_saved"/);
  assert.match(source, /syncState==="failed_sync"/);
});

test('registered server failures stay failed_sync while offline and demo expected failures stay quiet', () => {
  const missingBinding = new Error('missing_durable_team_binding');
  missingBinding.status = 403;
  missingBinding.body = { error: 'missing_durable_team_binding', diagnostic: { stage: 'team_binding_repair', message: 'No active membership or player record found.' } };
  const registeredBindingFailure = resolveHomeShotSaveFailure({ error: missingBinding, quietContext: { isExplicitDemoOrLocal: false } });
  assert.equal(registeredBindingFailure.quietFallback, false);
  assert.equal(registeredBindingFailure.syncState, 'failed_sync');

  const persistFailure = new Error('persist_failed');
  persistFailure.status = 500;
  persistFailure.body = { error: 'persist_failed', diagnostic: { stage: 'shot_logs_insert', message: 'Failed to persist home shots log.' } };
  const registeredPersistFailure = resolveHomeShotSaveFailure({ error: persistFailure, quietContext: { isExplicitDemoOrLocal: false } });
  assert.equal(registeredPersistFailure.quietFallback, false);
  assert.equal(registeredPersistFailure.syncState, 'failed_sync');

  const offlineFailure = resolveHomeShotSaveFailure({ error: new Error('network_error'), quietContext: { isOffline: true, isExplicitDemoOrLocal: false } });
  assert.equal(offlineFailure.quietFallback, true);
  assert.equal(offlineFailure.syncState, 'local_pending');

  const demoFailure = resolveHomeShotSaveFailure({ error: missingBinding, quietContext: { isExplicitDemoOrLocal: true } });
  assert.equal(demoFailure.quietFallback, true);
  assert.equal(demoFailure.syncState, 'local_pending');

  assert.equal(shouldUseQuietHomeShotFallback({ status: 500, errorCode: 'persist_failed', isExplicitDemoOrLocal: false }), false);
  assert.equal(shouldUseQuietHomeShotFallback({ status: 500, errorCode: 'player_record_query_failed', isExplicitDemoOrLocal: false }), false);
  assert.equal(shouldUseQuietHomeShotFallback({ status: 500, errorCode: 'membership_uuid_query_failed', isExplicitDemoOrLocal: false }), false);
  assert.equal(shouldUseQuietHomeShotFallback({ status: 500, errorCode: 'membership_email_query_failed', isExplicitDemoOrLocal: false }), false);
});


test('Demo Player logs 123 shots locally without Team Sync warning or retry repair', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  const demoUser = { email: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player' };
  const demoLog = buildLocalHomeShotLog({ id: 'shotlog-demo-123', user: demoUser, made: 123, date: '2026-06-07', ts: 123 });
  const demoSavedLog = { ...demoLog, demo: true, syncState: 'local_pending', syncSource: 'local', syncError: '', syncDiagnostic: null };
  const visibleTodayTotal = [demoSavedLog].filter((s) => s.email === demoUser.email && s.date === '2026-06-07').reduce((sum, row) => sum + row.made, 0);
  const syncIssueShots = isDemoAccount(demoUser) ? [] : [demoSavedLog].filter((s) => s.syncState === 'failed_sync');

  assert.equal(visibleTodayTotal, 123);
  assert.equal(`${visibleTodayTotal} makes logged today`, '123 makes logged today');
  assert.equal(syncIssueShots.length, 0);
  assert.match(source, new RegExp('if\\(isDemoMode\\(\\)\\|\\|isDemoAccount\\(user\\)\\)\\{[\\s\\S]*return\\{ok:true,mode:"demo_saved",syncState:"local_pending",demo:true\\};[\\s\\S]*try\\{\\nconst savedLog=await saveHomeShotLogRemote\\(localLog\\);'));
  assert.match(source, /const visibleSyncIssueShots=syncIssueShots\.filter\(log=>!isDemoAccount\(log\)\)/);
  assert.match(source, /isDemoSession\|\|!visibleSyncIssueShots\.length\)return null/);
  assert.match(source, /isDemoHomeShotSession\?\[\]:shotLogs\.filter/);
  assert.match(source, /isDemoHomeShotSession\?\[\]:my\.filter/);
  assert.match(source, /if\(isDemoMode\(\)\|\|isDemoAccount\(user\)\|\|isDemoAccount\(log\)\)\{/);
});

test('registered player with missing durable team link still sees Team Sync warning path', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  const registeredUser = { email: 'player@team.com', teamId: 'team-a', name: 'Registered Player' };
  const failedLog = { id: 'failed-shot', email: registeredUser.email, teamId: registeredUser.teamId, made: 20, date: '2026-06-07', syncState: 'failed_sync', syncError: 'missing_durable_team_binding' };
  const syncIssueShots = isDemoAccount(registeredUser) ? [] : [failedLog].filter((s) => s.syncState === 'failed_sync');

  assert.equal(syncIssueShots.length, 1);
  assert.match(source, /TEAM SYNC NEEDS ATTENTION/);
  assert.match(source, /RETRY SYNC/);
  assert.match(source, /Your player account is not durably linked to this team yet\. Ask your coach to review your team link\./);
});

test('Demo Player session shot logs are removed on logout while registered shots remain', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  const demoUser = { email: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player' };
  const registeredLog = { id: 'registered-shot', email: 'player@team.com', playerId: 'player@team.com', teamId: 'team-a', made: 77, date: '2026-06-07', syncState: 'remote_saved', syncSource: 'remote' };
  const demoLog = { id: 'demo-session-shot', email: demoUser.email, playerId: demoUser.email, teamId: demoUser.teamId, made: 123, date: '2026-06-07', demo: true, syncState: 'local_pending', syncSource: 'local' };
  const duringSession = [registeredLog, demoLog];
  const demoTotal = duringSession.filter((row) => row.email === demoUser.email).reduce((sum, row) => sum + row.made, 0);
  const afterLogout = duringSession.filter((row) => !isDemoPlayerSessionShotLog(row, { teamId: demoUser.teamId }));
  const afterLoginDemoTotal = afterLogout.filter((row) => row.email === demoUser.email).reduce((sum, row) => sum + row.made, 0);

  assert.equal(demoTotal, 123);
  assert.equal(afterLoginDemoTotal, 0);
  assert.deepEqual(afterLogout, [registeredLog]);
  assert.match(source, /const cleanupDemoPlayerSessionData=useCallback\(async\(activeUser=user\)=>\{/);
  assert.match(source, /sourceShotLogs\.filter\(log=>!isDemoPlayerSessionShotLog\(log,\{teamId:demoTeamId\}\)\)/);
  assert.match(source, /if\(isDemoMode\(\)\|\|isDemoAccount\(exitingUser\)\)await cleanupDemoPlayerSessionData\(exitingUser\)/);
  assert.match(source, /const demoSavedLog=\{\.\.\.localLog,demo:true,syncState:"local_pending",syncSource:"local"/);
});


test('registered missing durable team binding is not a quiet fallback and keeps debug diagnostics', () => {
  assert.equal(shouldUseQuietHomeShotFallback({ status: 403, errorCode: 'missing_durable_team_binding', message: 'Your player account is not durably linked to this team yet.', isExplicitDemoOrLocal: false, isMembershipPending: true }), false);
  assert.equal(shouldUseQuietHomeShotFallback({ status: 403, errorCode: 'missing_durable_team_binding', message: 'Your player account is not durably linked to this team yet.', isExplicitDemoOrLocal: true }), true);
  const error = new Error('missing_durable_team_binding');
  error.status = 403;
  error.body = {
    error: 'missing_durable_team_binding',
    diagnostic: {
      stage: 'team_binding_repair',
      message: 'Your player account is not durably linked to this team yet.',
      authorized_by: 'none',
      uuid_membership_query_result: '0',
      email_membership_query_result: '0',
      player_record_query_result: '0',
      team_binding_repair_attempted: 'yes',
      team_binding_repair_result: 'repair_upsert_failed',
    },
  };
  const failure = resolveHomeShotSaveFailure({ error, quietContext: { isExplicitDemoOrLocal: false, isMembershipPending: true }, debug: true });
  assert.equal(failure.quietFallback, false);
  assert.equal(failure.syncState, 'failed_sync');
  assert.equal(failure.issueMessage, 'Your player account is not durably linked to this team yet.');
  assert.deepEqual(
    [failure.diagnostic.status, failure.diagnostic.error, failure.diagnostic.stage, failure.diagnostic.team_binding_repair_attempted, failure.diagnostic.team_binding_repair_result],
    [403, 'missing_durable_team_binding', 'team_binding_repair', 'yes', 'repair_upsert_failed'],
  );
});

test('home-shot retry panel exposes safe retry wording and debug diagnostics in homeShotDebug mode', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /window\.location\.search\.includes\("homeShotDebug=1"\)/);
  assert.match(source, /syncDiagnostic/);
  assert.match(source, /team_binding_repair_account_probe/);
  assert.match(source, /Your player account is not durably linked to this team yet\. Ask your coach to review your team link\./);
  assert.doesNotMatch(source, /REPAIR TEAM LINK & RETRY/);
  assert.doesNotMatch(source, /Repairing team link/);
  assert.match(source, /TEAM SYNC NEEDS ATTENTION/);
  assert.match(source, /RETRY SYNC/);
});
