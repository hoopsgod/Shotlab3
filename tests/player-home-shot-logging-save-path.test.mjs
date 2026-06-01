import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_SHOT_VALIDATION_MESSAGE,
  buildLocalHomeShotLog,
  normalizeSavedHomeShotLog,
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
  assert.deepEqual(local, { id: 'shotlog-demo', email: 'demo@shotlab.app', playerId: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player', made: 25, date: '2026-05-29', ts: 123, syncState: 'local_pending' });
});

test('home-shots Pages Function keeps positive-integer parser backend-local for Cloudflare deploy safety', async () => {
  const routeSource = await readFile(new URL('../functions/v1/home-shots/log.js', import.meta.url), 'utf8');
  assert.doesNotMatch(routeSource, /\.\.\/\.\.\/\.\.\/src\/lib\/homeShotLogging\.js/);
  assert.match(routeSource, /function parsePositiveInteger\(value\) \{/);
  assert.match(routeSource, /Number\.isInteger\(numericValue\)/);
});


test('blank, zero, negative, decimal, malformed, and scientific notation submissions are rejected before remote save', async () => {
  for (const made of ['', '   ', 0, '0', -1, '-1', '1.5', 1.5, '1abc', '1e2']) {
    assert.deepEqual(validateHomeShotLogInput({ made, date: '2026-05-29' }), { ok: false, error: HOME_SHOT_VALIDATION_MESSAGE });
  }

  const originalFetch = global.fetch;
  let remoteCalled = false;
  global.fetch = async () => {
    remoteCalled = true;
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    for (const made of ['', '0', '-1', '1.5', '1abc', '1e2']) {
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

test('coach leaderboard stability path remains wired to PremiumLeaderboardsHub for coaches', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /<PremiumLeaderboardsHub viewerRole="coach" leaderboardRows=\{homeShotsLeaderboard\?\.rows\|\|\[\]\} leaderboardStatus=\{homeShotsLeaderboard\?\.status\|\|"idle"\} \/>/);
});

test('saved route payload normalizes back to app shot log shape for local state', () => {
  const normalized = normalizeSavedHomeShotLog(
    { id: 'remote-id', email: 'P@X.COM', player_id: 'P@X.COM', team_id: 'team-a', name: 'Player', made: '12', date: '2026-05-29', ts: '55' },
    { id: 'local-id', email: 'p@x.com', playerId: 'p@x.com', teamId: 'team-a', name: 'Fallback', made: 1, date: '2026-05-28', ts: 44 },
  );
  assert.deepEqual(normalized, { id: 'remote-id', email: 'p@x.com', playerId: 'p@x.com', teamId: 'team-a', name: 'Player', made: 12, date: '2026-05-29', ts: 55, syncState: 'remote_saved', syncError: '' });
});


test('manual retry flow hides local-only shots from coach until retry saves remotely', () => {
  const user = { email: 'player@team.com', teamId: 'team-a', name: 'Player One' };
  const localPending = buildLocalHomeShotLog({ id: 'shotlog-local', user, made: 18, date: '2026-05-30', ts: 1000 });
  let playerShotLogs = [{ ...localPending, syncState: 'failed_sync', syncError: 'persist_failed' }];

  assert.equal(playerShotLogs.some((log) => log.id === 'shotlog-local' && log.syncState === 'failed_sync'), true);
  const coachVisibleBeforeRetry = playerShotLogs.filter((log) => log.syncState === 'remote_saved');
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
  const coachVisibleAfterRetry = playerShotLogs.filter((log) => log.syncState === 'remote_saved');
  assert.equal(coachVisibleAfterRetry.length, 1);
  const coachLeaderboardAfterRetry = upsertHomeShotsLeaderboardRow([], { user: { email: remoteSaved.email, name: remoteSaved.name }, made: remoteSaved.made });
  assert.deepEqual(coachLeaderboardAfterRetry.map((row) => [row.email, row.player_display_name, row.total_home_shots]), [
    [user.email, user.name, 18],
  ]);
});


test('coach shot-log visibility requires explicit remote_saved syncState', () => {
  const logs = [
    { id: 'remote', syncState: 'remote_saved', made: 10 },
    { id: 'pending', syncState: 'local_pending', made: 20 },
    { id: 'failed', syncState: 'failed_sync', made: 30 },
    { id: 'legacy-missing', made: 40 },
  ];
  const coachVisible = logs.filter((log) => log.syncState === 'remote_saved');
  assert.deepEqual(coachVisible.map((log) => log.id), ['remote']);
});


test('coach-facing home-shot leaderboard data is server-confirmed only', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.doesNotMatch(source, /upsertHomeShotsLeaderboardRow/);
  assert.doesNotMatch(source, /setHomeShotsLeaderboard\(prev=>\(\{\.\.\.prev,status:"success",error:"",rows:/);
  assert.match(source, /const rows=Array\.isArray\(body\?\.leaderboard\)\?body\.leaderboard:\[\];/);
  assert.match(source, /setHomeShotsLeaderboard\(\{status:"success",rows,error:""\}\)/);
  assert.match(source, /const savedLog=await saveHomeShotLogRemote\(localLog\);[\s\S]*await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\);[\s\S]*return\{ok:true,mode:"remote_saved",syncState:"remote_saved"\}/);
  assert.match(source, /markShotSyncState\(localLog\.id,"local_pending",backendErrorCode\);[\s\S]*return\{ok:true,mode:"local_pending",syncState:"local_pending"/);
  assert.match(source, /markShotSyncState\(localLog\.id,"failed_sync",backendErrorCode\);[\s\S]*await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\);/);
  assert.match(source, /const savedLog=await saveHomeShotLogRemote\(\{\.\.\.log,syncState:"local_pending"\}\);[\s\S]*return\{ok:true,mode:"remote_saved",syncState:"remote_saved"\}/);
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
  assert.match(source, /markShotSyncState\(localLog\.id,"failed_sync",backendErrorCode\)/);
  assert.match(source, /await fetchHomeShotsLeaderboard\(user\.teamId,view==="player"\?"players":homeShotsLeaderboardScope\)/);
  assert.match(source, /const coachVisibleShotLogs=scopedShotLogs\.filter\(l=>l\.syncState==="remote_saved"\)/);
  assert.match(source, /RETRY SYNC/);
  assert.equal((source.match(/<HomeShotSyncRetryPanel syncIssueShots=\{syncIssueShots\}/g)||[]).length, 2);
});

test('retry path promotes local_pending or failed_sync shots to remote_saved', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const retryHomeShotLog=async\(log\)=>\{/);
  assert.match(source, /markShotSyncState\(log\.id,"local_pending",""\)/);
  assert.match(source, /replaceShotLog\(log\.id,savedLog\)/);
  assert.match(source, /mode:"remote_saved",syncState:"remote_saved"/);
  assert.match(source, /syncState==="local_pending"\|\|s\.syncState==="failed_sync"/);
});
