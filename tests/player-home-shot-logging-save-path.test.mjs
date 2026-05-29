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
  assert.equal(shouldUseQuietHomeShotFallback({ status: 403, errorCode: 'forbidden', message: 'No active membership found.' }), true);
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
