import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_SHOT_LOCAL_ONLY_MESSAGE,
  HOME_SHOT_SYNC_DIAGNOSTIC_CODES,
  HOME_SHOT_SYNC_ERROR_MESSAGE,
  HOME_SHOT_VALIDATION_MESSAGE,
  buildLocalHomeShotLog,
  isDemoLocalHomeShotUser,
  normalizeSavedHomeShotLog,
  resolveHomeShotRetryFailure,
  resolveHomeShotSaveFailure,
  shouldUseQuietHomeShotFallback,
  upsertHomeShotsLeaderboardRow,
  validateHomeShotLogInput,
} from '../src/lib/homeShotLogging.js';
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

async function simulateHomeShotAdd({ made = 25, remoteSave, quietContext = {} } = {}) {
  const user = { email: 'player@team.com', teamId: 'team-a', name: 'Player One' };
  const validation = validateHomeShotLogInput({ made, date: '2026-05-30' });
  if (!validation.ok) return { result: { ok: false, error: validation.error, validation: true }, shotLogs: [], statSyncError: validation.error };

  const localLog = buildLocalHomeShotLog({ id: 'shotlog-local', user, made: validation.made, date: validation.date, ts: 1000 });
  let shotLogs = [localLog];
  let statSyncError = '';

  try {
    const savedLog = await remoteSave(localLog);
    shotLogs = shotLogs.map((log) => (log.id === localLog.id ? savedLog : log));
    return { result: { ok: true, mode: 'remote_saved', syncState: 'remote_saved' }, shotLogs, statSyncError };
  } catch (error) {
    const saveFailure = resolveHomeShotSaveFailure({ error, quietContext });
    shotLogs = shotLogs.map((log) => (log.id === localLog.id ? { ...log, syncState: saveFailure.syncState, syncSource: 'local', syncError: saveFailure.syncState === 'local_only' ? '' : saveFailure.errorCode } : log));
    statSyncError = saveFailure.statSyncError;
    return { result: saveFailure, shotLogs, statSyncError };
  }
}

async function simulateRetrySync({ shotLogs, remoteSave }) {
  const [target] = shotLogs.filter((log) => log.syncState === 'local_pending' || log.syncState === 'failed_sync');
  let nextLogs = shotLogs.map((log) => (log.id === target.id ? { ...log, syncState: 'local_pending', syncSource: 'local', syncError: '' } : log));
  const savedLog = await remoteSave({ ...target, syncState: 'local_pending' });
  nextLogs = nextLogs.map((log) => (log.id === target.id ? savedLog : log));
  return nextLogs;
}

test('player can log valid home shots through the team-dashboard route without using the red fallback path', async () => {
  const originalFetch = global.fetch;
  let insertedRow;
  global.fetch = async (url, init) => {
    if (String(url).includes('/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify('uuid-player'), { status: 200 });
    if (String(url).includes('/team_memberships') && String(url).includes('user_id=eq.uuid-player')) return new Response(JSON.stringify([{ id: 'm-uuid', status: 'active' }]), { status: 200 });
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
  assert.equal(shouldUseQuietHomeShotFallback({ status: 403, errorCode: 'forbidden', message: 'No active membership found.', isMembershipPending: true }), true);
  assert.equal(shouldUseQuietHomeShotFallback({ status: 403, errorCode: 'identity_mismatch', message: 'Submitted identity did not match requester.' }), false);
  const local = buildLocalHomeShotLog({ id: 'shotlog-demo', user: { email: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player' }, made: 25, date: '2026-05-29', ts: 123 });
  assert.deepEqual(local, { id: 'shotlog-demo', email: 'demo@shotlab.app', playerId: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player', made: 25, date: '2026-05-29', ts: 123, syncState: 'local_pending', syncSource: 'local' });
});


test('demo/local player logs shots locally without retry warning', async () => {
  const user = { email: 'demo@shotlab.app', teamId: 'team-demo-titans', name: 'Demo Player' };
  assert.equal(isDemoLocalHomeShotUser(user), true);

  const localLog = {
    ...buildLocalHomeShotLog({ id: 'shotlog-demo-local', user, made: 25, date: '2026-06-02', ts: 123 }),
    syncState: 'local_only',
    syncSource: 'local',
    syncError: '',
  };
  const shotLogs = [localLog];
  const syncIssueShots = shotLogs.filter((log) => log.syncState === 'local_pending' || log.syncState === 'failed_sync');
  const coachVisible = shotLogs.filter((log) => log.syncState === 'remote_saved' && log.syncSource === 'remote');

  assert.deepEqual(syncIssueShots, []);
  assert.deepEqual(coachVisible, []);
  assert.equal(HOME_SHOT_LOCAL_ONLY_MESSAGE, 'Demo shots are saved locally only.');

  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /localOnlyHomeShotSave=isDemoMode\(\)\|\|isDemoLocalHomeShotUser\(user\)/);
  assert.match(source, /return\{ok:true,mode:"local_only",syncState:"local_only",message:HOME_SHOT_LOCAL_ONLY_MESSAGE\}/);
  assert.match(source, /result\.mode==="local_only"/);
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
  assert.equal(rejected.statSyncError, `${HOME_SHOT_SYNC_ERROR_MESSAGE} Sync error: identity_mismatch`);

  const retried = await simulateRetrySync({ shotLogs: network.shotLogs, remoteSave });
  assert.deepEqual(retried.map((log) => [log.syncState, log.syncSource]), [['remote_saved', 'remote']]);

  const coachVisible = [...successful.shotLogs, ...network.shotLogs, ...rejected.shotLogs, ...retried]
    .filter((log) => log.syncState === 'remote_saved' && log.syncSource === 'remote');
  assert.deepEqual(coachVisible.map((log) => log.id), ['shotlog-local', 'shotlog-local']);
});

test('coach leaderboard stability path remains wired to PremiumLeaderboardsHub for coaches', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /<PremiumLeaderboardsHub viewerRole="coach" leaderboardRows=\{homeShotsLeaderboard\?\.rows\|\|\[\]\} leaderboardStatus=\{homeShotsLeaderboard\?\.status\|\|"idle"\} \/>/);
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



test('home shot failed sync diagnostics expose safe backend error codes in state, UI source, and console source', async () => {
  assert.deepEqual([...HOME_SHOT_SYNC_DIAGNOSTIC_CODES], [
    'missing_user_identity',
    'identity_mismatch',
    'forbidden',
    'membership_uuid_query_failed',
    'persist_failed',
    'network_error',
  ]);

  const forbiddenError = new Error('forbidden');
  forbiddenError.status = 403;
  forbiddenError.body = { error: 'forbidden', diagnostic: { message: 'No active membership found.' } };
  const forbidden = resolveHomeShotSaveFailure({ error: forbiddenError });
  assert.equal(forbidden.syncState, 'failed_sync');
  assert.equal(forbidden.errorCode, 'forbidden');
  assert.equal(forbidden.statSyncError, `${HOME_SHOT_SYNC_ERROR_MESSAGE} Sync error: forbidden`);

  const persistError = new Error('persist_failed');
  persistError.status = 500;
  persistError.body = { error: 'persist_failed', diagnostic: { message: 'Failed to persist home shots log.' } };
  const persist = resolveHomeShotSaveFailure({ error: persistError });
  assert.equal(persist.syncState, 'failed_sync');
  assert.equal(persist.errorCode, 'persist_failed');
  assert.equal(persist.statSyncError, `${HOME_SHOT_SYNC_ERROR_MESSAGE} Sync error: persist_failed`);

  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /Sync error: \{log\.syncError\}/);
  assert.match(source, /console\.error\("home_shots_save_failed",\{[\s\S]*errorCode:saveFailure\.errorCode/);
  assert.match(source, /console\.error\("home_shots_retry_failed",\{[\s\S]*errorCode:backendErrorCode/);
});

test('coach-facing home-shot leaderboard data is server-confirmed only', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.doesNotMatch(source, /upsertHomeShotsLeaderboardRow/);
  assert.doesNotMatch(source, /setHomeShotsLeaderboard\(prev=>\(\{\.\.\.prev,status:"success",error:"",rows:/);
  assert.match(source, /const rows=Array\.isArray\(body\?\.leaderboard\)\?body\.leaderboard:\[\];/);
  assert.match(source, /setHomeShotsLeaderboard\(\{status:"success",rows,error:""\}\)/);
  assert.match(source, /const savedLog=await saveHomeShotLogRemote\(localLog\);[\s\S]*await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\);[\s\S]*return\{ok:true,mode:"remote_saved",syncState:"remote_saved"\}/);
  assert.match(source, /markShotSyncState\(localLog\.id,saveFailure\.syncState,saveFailure\.syncState==="local_only"\?"":saveFailure\.errorCode\);[\s\S]*return\{ok:true,mode:saveFailure\.mode,syncState:saveFailure\.syncState/);
  assert.match(source, /markShotSyncState\(localLog\.id,"failed_sync",saveFailure\.errorCode\);[\s\S]*await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\);/);
  assert.match(source, /const savedLog=await saveHomeShotLogRemote\(\{\.\.\.log,syncState:"local_pending"\}\);[\s\S]*return\{ok:true,mode:"remote_saved",syncState:"remote_saved"\}/);
});


test('Player At Home shot logging relies on inline Saved state instead of the large top completion cue', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /shotSaving\?"SAVING…":shotSaved\?"✓ SAVED":"LOG SHOTS"/);
  assert.match(source, /disabled=\{shotSaving\}/);
  assert.match(source, /const result=await addShotLog\(validation\.made,shotDate\)/);
  assert.match(source, /if\(result\?\.ok\)\{if\(result\.mode==="local_only"\)/);
  assert.match(source, /setShotSaved\(true\);setShotMade\(""\)/);
  assert.match(source, /<input type="number" min="1" value=\{shotMade\}/);
  assert.doesNotMatch(source, /Shot activity logged/);
});


test('home shot save modes are explicit for remote, quiet fallback, and failed sync', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /mode:"remote_saved"/);
  assert.match(source, /mode:saveFailure\.mode/);
  assert.match(source, /mode:"local_only"/);
  assert.match(source, /Saved locally — team sync pending/);
  assert.match(source, /HOME_SHOT_LOCAL_ONLY_MESSAGE/);
  assert.match(source, /mode:"failed_sync"/);
  assert.match(source, /console\.error\("home_shots_save_failed",\{mode:"failed_sync"/);
});


test('failed remote persistence is marked failed_sync with retry UI and hidden from coach dashboard local shot logs', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /markShotSyncState\(localLog\.id,"failed_sync",saveFailure\.errorCode\)/);
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
  assert.equal(statSyncError, `${HOME_SHOT_SYNC_ERROR_MESSAGE} Sync error: persist_failed`);

  const retryQuietFallback = resolveHomeShotRetryFailure({ quietFallback: true, errorCode: 'network_error' });
  assert.equal(retryQuietFallback.syncState, 'local_pending');
  statSyncError = retryQuietFallback.statSyncError;
  assert.equal(statSyncError, '');
});


test('valid live-style player/team save via player record fallback becomes remote_saved and clears retry panel state', async () => {
  const originalFetch = global.fetch;
  const user = { email: 'player@team.com', teamId: 'team-live', name: 'Live Player' };
  const localLog = {
    ...buildLocalHomeShotLog({ id: 'shotlog-live', user, made: 21, date: '2026-06-02', ts: 1777777777777 }),
    syncState: 'failed_sync',
    syncError: 'forbidden',
  };
  let shotLogs = [localLog];

  global.fetch = async (url, init) => {
    const href = String(url);
    if (href.includes('/rpc/resolve_app_user_uuid')) return new Response(JSON.stringify(''), { status: 200 });
    if (href.includes('/team_memberships')) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes('/players') && href.includes('teamId=eq.team-live') && href.includes('email=eq.player%40team.com')) {
      return new Response(JSON.stringify([{ id: 'player-live', teamId: 'team-live', email: 'player@team.com', role: 'player', status: 'active' }]), { status: 200 });
    }
    if (href.includes('/players')) return new Response(JSON.stringify([]), { status: 200 });
    if (href.includes('/shot_logs')) {
      const [row] = JSON.parse(init.body);
      return new Response(JSON.stringify([{ ...row, id: 'remote-live' }]), { status: 201 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };

  try {
    const res = await onRequestPost(ctx({ id: localLog.id, ts: localLog.ts, teamId: localLog.teamId, playerId: localLog.playerId, email: localLog.email, name: localLog.name, made: localLog.made, date: localLog.date }, { 'x-user-id': user.email }));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.diagnostic.authorized_by, 'player_record');

    const savedLog = normalizeSavedHomeShotLog(body.shot_log, localLog);
    shotLogs = shotLogs.map((log) => (log.id === localLog.id ? savedLog : log));

    assert.equal(savedLog.syncState, 'remote_saved');
    assert.equal(savedLog.syncSource, 'remote');
    assert.equal(savedLog.syncError, '');
    assert.deepEqual(shotLogs.filter((log) => log.syncState === 'local_pending' || log.syncState === 'failed_sync'), []);
  } finally {
    global.fetch = originalFetch;
  }
});

test('retry path promotes local_pending or failed_sync shots to remote_saved', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const retryHomeShotLog=async\(log\)=>\{/);
  assert.match(source, /markShotSyncState\(log\.id,"local_pending",""\)/);
  assert.match(source, /replaceShotLog\(log\.id,savedLog\)/);
  assert.match(source, /mode:"remote_saved",syncState:"remote_saved"/);
  assert.match(source, /syncState==="local_pending"\|\|s\.syncState==="failed_sync"/);
});
