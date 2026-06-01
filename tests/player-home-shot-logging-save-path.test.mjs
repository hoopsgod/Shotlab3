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

test('player leaderboard updates optimistically after shot logging', () => {
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
  assert.equal(shouldUseQuietHomeShotFallback({ errorCode: 'forbidden', message: 'No active membership found.', userEmail: 'demo@shotlab.app', teamId: 'demo-team', playerName: 'Demo Player' }), true);
  const local = buildLocalHomeShotLog({ id: 'shotlog-demo', user: { email: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player' }, made: 25, date: '2026-05-29', ts: 123 });
  assert.deepEqual(local, { id: 'shotlog-demo', email: 'demo@shotlab.app', playerId: 'demo@shotlab.app', teamId: 'demo-team', name: 'Demo Player', made: 25, date: '2026-05-29', ts: 123 });
});

test('0-value submission is handled intentionally before remote save', async () => {
  assert.deepEqual(validateHomeShotLogInput({ made: 0, date: '2026-05-29' }), { ok: false, error: HOME_SHOT_VALIDATION_MESSAGE });

  const originalFetch = global.fetch;
  let remoteCalled = false;
  global.fetch = async () => {
    remoteCalled = true;
    return new Response(JSON.stringify([]), { status: 200 });
  };
  try {
    const res = await onRequestPost(ctx({ team_id: 'team-a', player_id: 'p@x.com', made: 0, date: '2026-05-29' }, { 'x-user-id': 'p@x.com' }));
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'invalid_made');
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
  assert.deepEqual(normalized, { id: 'remote-id', email: 'p@x.com', playerId: 'p@x.com', teamId: 'team-a', name: 'Player', made: 12, date: '2026-05-29', ts: 55 });
});


test('Player At Home shot logging relies on inline Saved state instead of the large top completion cue', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /shotSaving\?"SAVING…":shotSaved\?"✓ SAVED":"LOG SHOTS"/);
  assert.match(source, /disabled=\{shotSaving\}/);
  assert.match(source, /const result=await addShotLog\(validation\.made,shotDate\)/);
  assert.match(source, /if\(result\?\.ok\)\{if\(result\.mode==="local_fallback"\)/);
  assert.match(source, /setShotSaved\(true\);setShotMade\(""\)/);
  assert.match(source, /<input type="number" min="1" value=\{shotMade\}/);
  assert.doesNotMatch(source, /Shot activity logged/);
});


test('home shot save modes are explicit for remote, quiet fallback, and failed sync', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /mode:"remote_saved"/);
  assert.match(source, /mode:"local_fallback"/);
  assert.match(source, /Saved locally — team sync pending/);
  assert.match(source, /mode:"failed_sync"/);
  assert.match(source, /console\.error\("home_shots_save_failed",\{mode:"failed_sync"/);
});


test('non-quiet backend failures roll back optimistic shot and leaderboard state', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const previousHomeShotsLeaderboard=\{\.\.\.homeShotsLeaderboard,rows:Array\.isArray\(homeShotsLeaderboard\?\.rows\)\?homeShotsLeaderboard\.rows\.map\(row=>\(\{\.\.\.row\}\)\):\[\]\}/);
  assert.match(source, /const rollbackOptimisticShot=\(\)=>\{/);
  assert.match(source, /const next=prev\.filter\(log=>log\.id!==localLog\.id\);persistLocalShotLogs\(next\);return next;/);
  assert.match(source, /setHomeShotsLeaderboard\(previousHomeShotsLeaderboard\)/);
  assert.match(source, /rollbackOptimisticShot\(\);\s*console\.error\("home_shots_save_failed",\{mode:"failed_sync",errorCode:backendErrorCode/);
});

test('quiet fallback is narrowed to demo or explicit missing durable membership cases', () => {
  assert.equal(shouldUseQuietHomeShotFallback({ errorCode: 'identity_mismatch', message: 'Submitted identity did not match requester.', userEmail: 'demo@shotlab.app', teamId: 'demo-team' }), false);
  assert.equal(shouldUseQuietHomeShotFallback({ errorCode: 'unauthorized', message: 'Request user identity missing.', userEmail: 'demo@shotlab.app', teamId: 'demo-team' }), false);
  assert.equal(shouldUseQuietHomeShotFallback({ errorCode: 'forbidden', message: 'No active membership found.', userEmail: 'real@team.com', teamId: 'team-a', playerName: 'Real Player' }), false);
  assert.equal(shouldUseQuietHomeShotFallback({ errorCode: 'forbidden', message: 'No active membership found.', userEmail: 'demo@shotlab.app', teamId: 'demo-team', playerName: 'Demo Player' }), true);
  assert.equal(shouldUseQuietHomeShotFallback({ errorCode: 'missing_durable_membership', message: 'Missing durable membership for preview user.', userEmail: 'real@team.com', teamId: 'team-a' }), true);
});

test('persist_failed and auth failures are failed sync modes, not quiet successes', async () => {
  const source = await readFile(APP_PATH, 'utf8');
  assert.match(source, /const backendErrorCode=String\(e\?\.body\?\.error\|\|e\?\.message\|\|"sync_failed"\)/);
  assert.match(source, /return\{ok:false,mode:"failed_sync",error:backendErrorCode\}/);
  assert.doesNotMatch(source, /\[401, 403, 404\]\.includes/);
  assert.doesNotMatch(source, /identity_mismatch'[\s\S]*return true/);
});
