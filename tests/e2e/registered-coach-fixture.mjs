import { expect } from '@playwright/test';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const DEFAULT_AUTH_USER_ID = '99999999-9999-4999-8999-999999999999';
const DEFAULT_PLAYER_AUTH_USER_ID = '88888888-8888-4888-8888-888888888888';

async function installSignedPlayersRoute(page, storage) {
  let players = Array.isArray(storage?.['sl:players']) ? storage['sl:players'] : [];
  await page.route('**/v1/players**', async (route) => {
    if (route.request().method().toUpperCase() === 'POST') {
      try {
        const body = route.request().postDataJSON();
        if (Array.isArray(body?.players)) {
          players = body.players.map((player) => {
            const identity = String(player?.email || player?.id || '').toLowerCase();
            const existing = players.find((candidate) => String(candidate?.email || candidate?.id || '').toLowerCase() === identity);
            const photoUrl = player?.photoUrl || player?.photo_url || existing?.photoUrl || existing?.photo_url || null;
            return {
              ...player,
              ...(photoUrl ? { photoUrl, photo_url: photoUrl } : {}),
            };
          });
        }
      } catch {}
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        storage_mode: 'signed_api',
        players: players.map((player) => ({
          ...player,
          team_id: player?.team_id || player?.teamId || '',
          photo_url: player?.photo_url || player?.photoUrl || null,
          photoUrl: player?.photoUrl || player?.photo_url || null,
        })),
      }),
    });
  });
}

async function installSignedEventsRoute(page, storage) {
  let events = Array.isArray(storage?.['sl:events']) ? storage['sl:events'] : [];
  await page.route('**/v1/events**', async (route) => {
    if (route.request().method().toUpperCase() === 'POST') {
      try {
        const body = route.request().postDataJSON();
        events = Array.isArray(body?.events) ? body.events : [];
      } catch {
        events = [];
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, storage_mode: 'signed', events }),
    });
  });
}

async function installSignedStrengthConditioningRoute(page, storage, teamId) {
  let sessions = Array.isArray(storage?.['sl:sc-sessions']) ? storage['sl:sc-sessions'] : [];
  let rsvps = Array.isArray(storage?.['sl:sc-rsvps']) ? storage['sl:sc-rsvps'] : [];
  let logs = Array.isArray(storage?.['sl:sc-logs']) ? storage['sl:sc-logs'] : [];
  await page.route('**/v1/strength-conditioning**', async (route) => {
    let resource = '', rows = [];
    if (route.request().method().toUpperCase() === 'POST') {
      try {
        const body = route.request().postDataJSON();
        resource = String(body?.resource || '');
        rows = Array.isArray(body?.rows) ? body.rows : [];
        if (resource === 'sessions') sessions = rows;
        else if (resource === 'rsvps') rsvps = rows;
        else if (resource === 'logs') logs = rows;
      } catch {}
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        storage_mode: 'signed',
        team_id: teamId,
        can_write_sessions: true,
        sessions,
        rsvps,
        logs,
        ...(resource ? { resource, rows, deleted_count: 0 } : {}),
      }),
    });
  });
}

/**
 * Boots a deterministic registered Coach without borrowing ShotLab's canonical
 * Demo identity. Bespoke dashboard/acceptance fixtures must use this boundary
 * so demo-data reconciliation can remain strict and production-like.
 */
export async function enterSeededRegisteredCoach(page, {
  storage,
  coachEmail,
  coachName = 'Registered Test Coach',
  teamId,
  team = storage?.['sl:teams']?.find((candidate) => candidate?.id === teamId) || storage?.['sl:teams']?.[0],
  authUserId = DEFAULT_AUTH_USER_ID,
  path = '/',
  readyTestId = 'coach-command-center-full',
  homeShotsLeaderboardRows = [],
}) {
  if (!storage || !coachEmail || !teamId || !team) {
    throw new Error('enterSeededRegisteredCoach requires storage, coachEmail, teamId, and team');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = `registered-e2e-${String(teamId).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-token`;
  const registeredUser = { id: authUserId, email: coachEmail, aud: 'authenticated', role: 'authenticated' };
  const signedStorage = {
    ...storage,
    'sl:supabase-session': {
      access_token: token,
      refresh_token: `${token}-refresh`,
      expires_at: nowSeconds + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: authUserId, email: coachEmail },
    },
    'sl:supabase-access-token': token,
    'sl:session': { email: coachEmail },
  };

  await page.addInitScript(({ seededStorage }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(seededStorage)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, { seededStorage: signedStorage });

  await installSignedPlayersRoute(page, storage);
  await installSignedEventsRoute(page, storage);
  await installSignedStrengthConditioningRoute(page, storage, teamId);
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      team_id: teamId,
      count: Array.isArray(homeShotsLeaderboardRows) ? homeShotsLeaderboardRows.length : 0,
      leaderboard: Array.isArray(homeShotsLeaderboardRows) ? homeShotsLeaderboardRows : [],
    }),
  }));
  await page.route(`${REGISTERED_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(registeredUser),
  }));
  await page.route(`${REGISTERED_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('**/v1/legacy-auth/restore', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      profile: {
        email: coachEmail,
        name: coachName,
        role: 'coach',
        team_id: teamId,
        hide_from_leaderboards: true,
      },
    }),
  }));
  await page.route('**/v1/teams/restore-context', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, team }),
  }));

  await page.goto(path);
  await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 20_000 });
}

/**
 * Player counterpart to the registered Coach fixture. Controlled Player E2E
 * suites use this boundary instead of the canonical Demo identity so the
 * production-like demo reconciliation can remain strict and deterministic.
 */
export async function enterSeededRegisteredPlayer(page, {
  storage,
  playerEmail,
  playerName = 'Registered Test Player',
  teamId,
  team = storage?.['sl:teams']?.find((candidate) => candidate?.id === teamId) || storage?.['sl:teams']?.[0],
  authUserId = DEFAULT_PLAYER_AUTH_USER_ID,
  path = '/',
  readyTestId = 'mobile-navigation-dock',
  homeShotsLeaderboardRows = [],
}) {
  if (!storage || !playerEmail || !teamId || !team) {
    throw new Error('enterSeededRegisteredPlayer requires storage, playerEmail, teamId, and team');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const token = `registered-player-e2e-${String(teamId).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-token`;
  const registeredUser = { id: authUserId, email: playerEmail, aud: 'authenticated', role: 'authenticated' };
  const signedStorage = {
    ...storage,
    'sl:supabase-session': {
      access_token: token,
      refresh_token: `${token}-refresh`,
      expires_at: nowSeconds + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: { id: authUserId, email: playerEmail },
    },
    'sl:supabase-access-token': token,
    'sl:session': { email: playerEmail },
  };

  await page.addInitScript(({ seededStorage }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(seededStorage)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, { seededStorage: signedStorage });

  await installSignedPlayersRoute(page, storage);
  await installSignedEventsRoute(page, storage);
  await installSignedStrengthConditioningRoute(page, storage, teamId);
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      team_id: teamId,
      count: Array.isArray(homeShotsLeaderboardRows) ? homeShotsLeaderboardRows.length : 0,
      leaderboard: Array.isArray(homeShotsLeaderboardRows) ? homeShotsLeaderboardRows : [],
    }),
  }));
  await page.route(`${REGISTERED_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(registeredUser),
  }));
  await page.route(`${REGISTERED_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
  await page.route('**/v1/legacy-auth/restore', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      profile: {
        email: playerEmail,
        name: playerName,
        role: 'player',
        team_id: teamId,
        hide_from_leaderboards: false,
      },
    }),
  }));
  await page.route('**/v1/teams/restore-context', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, team }),
  }));

  await page.goto(path);
  await expect(page.getByTestId(readyTestId)).toBeVisible({ timeout: 20_000 });
}
