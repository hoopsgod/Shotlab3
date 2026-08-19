import { test, expect } from '@playwright/test';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-parity-2026';

const REGISTERED_IDENTITIES = {
  coach: { id: '11111111-1111-4111-8111-111111111111', email: 'registered.coach@shotlab.test', name: 'Registered Coach', role: 'coach', isCoach: true },
  player: { id: '22222222-2222-4222-8222-222222222222', email: 'registered.player@shotlab.test', name: 'Registered Player', role: 'player', isCoach: false },
};

function registeredSeed(role) {
  const current = REGISTERED_IDENTITIES[role];
  const coach = { ...REGISTERED_IDENTITIES.coach, teamId: TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_000 };
  const player = { ...REGISTERED_IDENTITIES.player, teamId: TEAM_ID, hideFromLeaderboards: false, createdAt: 1_780_000_000_001 };
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    user: { id: current.id, email: current.email, aud: 'authenticated', role: 'authenticated' },
    storage: {
      'sl:supabase-session': {
        access_token: `registered-${role}-token`,
        refresh_token: `registered-${role}-refresh`,
        expires_at: nowSeconds + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: current.id, email: current.email },
      },
      'sl:supabase-access-token': `registered-${role}-token`,
      'sl:session': { email: current.email },
      'sl:teams': [{ id: TEAM_ID, name: 'Parity Team', ownerCoachId: coach.email, joinCode: 'PARITY26', createdAt: 1_780_000_000_000 }],
      'sl:players': [coach, player],
      'sl:player-profiles': [{ id: 'profile-registered-player', userId: player.email, teamId: TEAM_ID, firstName: 'Registered', lastName: 'Player', jerseyNumber: '12' }],
      'sl:scores': [
        { id: 'score-registered-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, drillId: 'form-shooting', score: 18, makes: 18, date: '2026-08-09', src: 'home' },
      ],
      'sl:program-scores': [],
      'sl:shotlogs': [{ id: 'shot-registered-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, made: 75, date: '2026-08-09' }],
      'sl:events': [{ id: 'event-registered-1', teamId: TEAM_ID, title: 'Team Practice', date: '2026-08-10', time: '6:00 PM', location: 'Main Gym', type: 'practice' }],
      'sl:rsvps': [],
      'sl:sc-sessions': [],
      'sl:sc-rsvps': [],
      'sl:sc-logs': [],
      'sl:season-archives': [],
      'sl:team-stores': [],
    },
  };
}

async function installSharedRoutes(target, registeredUser = null) {
  await target.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(registeredUser || {}) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  if (registeredUser?.email) {
    const role = Object.keys(REGISTERED_IDENTITIES).find((key) => REGISTERED_IDENTITIES[key].email === registeredUser.email);
    const identity = role ? REGISTERED_IDENTITIES[role] : null;
    const coach = REGISTERED_IDENTITIES.coach;
    const legacyProfile = identity ? {
      email: identity.email,
      name: identity.name,
      role: identity.role,
      team_id: TEAM_ID,
      hide_from_leaderboards: role === 'coach',
    } : null;

    await target.route('**/v1/legacy-auth/restore', (route) => route.fulfill({
      status: legacyProfile ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(legacyProfile ? { ok: true, profile: legacyProfile } : { error: 'profile_not_found' }),
    }));
    await target.route('**/v1/teams/restore-context', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        team: {
          id: TEAM_ID,
          name: 'Parity Team',
          ownerCoachId: coach.email,
          joinCode: 'PARITY26',
          createdAt: 1_780_000_000_000,
        },
      }),
    }));
  }
}

async function seedRegisteredSession(context, role) {
  const seed = registeredSeed(role);
  await context.addInitScript(({ storage }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(storage)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, { storage: seed.storage });
  await installSharedRoutes(context, seed.user);
  return seed;
}

async function enterDemo(page, role) {
  await installSharedRoutes(page);
  await page.goto('/?demo=1');
  const button = page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
}

async function enterRegistered(page, role) {
  await page.goto('/');
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
}

async function surfaceSignature(locator) {
  await expect(locator).toBeVisible();
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    const structuralClasses = String(node.className || '')
      .split(/\s+/)
      .filter(Boolean)
      .filter((name) => !['is-onboarding', 'has-team-data'].includes(name))
      .sort()
      .join(' ');
    return {
      tag: node.tagName,
      className: structuralClasses,
      pageHierarchy: node.getAttribute('data-page-hierarchy') || '',
      layoutRole: node.getAttribute('data-layout-role') || '',
      phase: node.getAttribute('data-phase') || '',
      display: style.display,
      position: style.position,
      borderRadius: style.borderRadius,
      fontFamily: style.fontFamily,
    };
  });
}

async function navLabels(page) {
  return page.getByTestId('mobile-navigation-dock').getByRole('button').allTextContents().then((rows) => rows.map((value) => value.replace(/\s+/g, ' ').trim()).filter(Boolean));
}

async function noHorizontalOverflow(page) {
  return page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
}

async function expectPhoneSafe(page) {
  const widths = await noHorizontalOverflow(page);
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function createRegisteredPage(browser, role) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedRegisteredSession(context, role);
  const page = await context.newPage();
  await enterRegistered(page, role);
  return { context, page };
}

async function createDemoPage(browser, role) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enterDemo(page, role);
  return { context, page };
}

test('Coach demo and registered Coach use the same product surfaces and navigation', async ({ browser }) => {
  const registered = await createRegisteredPage(browser, 'coach');
  const demo = await createDemoPage(browser, 'coach');
  try {
    await expect(registered.page.getByTestId('coach-command-center-full')).toBeVisible();
    await expect(demo.page.getByTestId('coach-command-center-full')).toBeVisible();
    expect(await surfaceSignature(demo.page.getByTestId('coach-command-center-full'))).toEqual(await surfaceSignature(registered.page.getByTestId('coach-command-center-full')));
    expect(await navLabels(demo.page)).toEqual(await navLabels(registered.page));
    await registered.page.screenshot({ path: 'parity-evidence/coach-registered-home.png', fullPage: true });
    await demo.page.screenshot({ path: 'parity-evidence/coach-demo-home.png', fullPage: true });

    for (const destination of ['Players', 'Schedule']) {
      await registered.page.getByTestId('mobile-navigation-dock').getByRole('button', { name: destination, exact: true }).click();
      await demo.page.getByTestId('mobile-navigation-dock').getByRole('button', { name: destination, exact: true }).click();
      const testId = destination === 'Players' ? 'coach-players-interactive-dashboard' : 'coach-events-interactive-dashboard';
      const registeredSurface = registered.page.getByTestId(testId);
      const demoSurface = demo.page.getByTestId(testId);
      await expect(registeredSurface).toBeVisible({ timeout: 15_000 });
      await expect(demoSurface).toBeVisible({ timeout: 15_000 });
      expect(await surfaceSignature(demoSurface)).toEqual(await surfaceSignature(registeredSurface));
      await expectPhoneSafe(registered.page);
      await expectPhoneSafe(demo.page);
    }
  } finally {
    await registered.context.close();
    await demo.context.close();
  }
});

test('Player demo and registered Player use the same command center, navigation, and Team Store state', async ({ browser }) => {
  const registered = await createRegisteredPage(browser, 'player');
  const demo = await createDemoPage(browser, 'player');
  try {
    const registeredCommand = registered.page.getByTestId('player-daily-command-center');
    const demoCommand = demo.page.getByTestId('player-daily-command-center');
    await expect(registeredCommand).toBeVisible({ timeout: 15_000 });
    await expect(demoCommand).toBeVisible({ timeout: 15_000 });
    expect(await surfaceSignature(demoCommand)).toEqual(await surfaceSignature(registeredCommand));
    expect(await navLabels(demo.page)).toEqual(await navLabels(registered.page));
    await registered.page.screenshot({ path: 'parity-evidence/player-registered-home.png', fullPage: true });
    await demo.page.screenshot({ path: 'parity-evidence/player-demo-home.png', fullPage: true });

    for (const page of [registered.page, demo.page]) {
      const more = page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'More', exact: true });
      await more.click();
      const storeButton = page.getByRole('button', { name: /Team Store/i }).last();
      await expect(storeButton).toBeVisible({ timeout: 10_000 });
      await storeButton.click();
      const dialog = page.getByRole('dialog', { name: 'Team Store' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText('Your team store is not open yet', { exact: true })).toBeVisible();
      await expect(dialog.getByText('DEMO STOREFRONT', { exact: true })).toHaveCount(0);
      await expectPhoneSafe(page);
    }

    expect(await surfaceSignature(demo.page.getByRole('dialog', { name: 'Team Store' }))).toEqual(await surfaceSignature(registered.page.getByRole('dialog', { name: 'Team Store' })));
    await registered.page.screenshot({ path: 'parity-evidence/player-registered-team-store.png', fullPage: true });
    await demo.page.screenshot({ path: 'parity-evidence/player-demo-team-store.png', fullPage: true });
  } finally {
    await registered.context.close();
    await demo.context.close();
  }
});
