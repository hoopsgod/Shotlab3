import { expect } from '@playwright/test';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const DEFAULT_AUTH_USER_ID = '99999999-9999-4999-8999-999999999999';

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

  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ leaderboard: [] }),
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
