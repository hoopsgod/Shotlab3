import { test, expect } from '@playwright/test';

const PAID_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-parity-2026';

const PAID_IDENTITIES = {
  coach: { id: '11111111-1111-4111-8111-111111111111', email: 'paid.coach@shotlab.test', name: 'Paid Coach', role: 'coach', isCoach: true },
  player: { id: '22222222-2222-4222-8222-222222222222', email: 'paid.player@shotlab.test', name: 'Paid Player', role: 'player', isCoach: false },
};

function paidSeed(role) {
  const current = PAID_IDENTITIES[role];
  const coach = { ...PAID_IDENTITIES.coach, teamId: TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_000 };
  const player = { ...PAID_IDENTITIES.player, teamId: TEAM_ID, hideFromLeaderboards: false, createdAt: 1_780_000_000_001 };
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    user: { id: current.id, email: current.email, aud: 'authenticated', role: 'authenticated' },
    storage: {
      'sl:supabase-session': {
        access_token: `paid-${role}-token`,
        refresh_token: `paid-${role}-refresh`,
        expires_at: nowSeconds + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: current.id, email: current.email },
      },
      'sl:supabase-access-token': `paid-${role}-token`,
      'sl:session': { email: current.email },
      'sl:teams': [{ id: TEAM_ID, name: 'Parity Team', ownerCoachId: coach.email, joinCode: 'PARITY26', createdAt: 1_780_000_000_000 }],
      'sl:players': [coach, player],
      'sl:player-profiles': [{ id: 'profile-paid-player', userId: player.email, teamId: TEAM_ID, firstName: 'Paid', lastName: 'Player', jerseyNumber: '12' }],
      'sl:scores': [
        { id: 'score-paid-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, drillId: 'form-shooting', score: 18, makes: 18, date: '2026-08-09', src: 'home' },
      ],
      'sl:program-scores': [],
      'sl:shotlogs': [{ id: 'shot-paid-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, made: 75, date: '2026-08-09' }],
      'sl:events': [{ id: 'event-paid-1', teamId: TEAM_ID, title: 'Team Practice', date: '2026-08-10', time: '6:00 PM', location: 'Main Gym', type: 'practice' }],
      'sl:rsvps': [],
      'sl:sc-sessions': [],
      'sl:sc-rsvps': [],
      'sl:sc-logs': [],
      'sl:season-archives': [],
      'sl:team-stores': [],
    },
  };
}

async function installSharedRoutes(target, paidUser = null) {
  await target.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(`${PAID_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(paidUser || {}) }));
  await target.route(`${PAID_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));

  if (paidUser?.email) {
    const role = Object.keys(PAID_IDENTITIES).find((key) => PAID_IDENTITIES[key].email === paidUser.email);
    const identity = role ? PAID_IDENTITIES[role] : null;
    const coach = PAID_IDENTITIES.coach;
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

async function seedPaidSession(context, role) {
  const seed = paidSeed(role);
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
  await page.goto('/');
  const button = page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
}

async function enterPaid(page, role) {
  await page.goto('/');
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
}

async function surfaceSignature(locator) {
  await expect(locator).toBeVisible();
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      tag: node.tagName,
      className: String(node.className || ''),
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

async function createPaidPage(browser, role) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await seedPaidSession(context, role);
  const page = await context.newPage();
  await enterPaid(page, role);
  return { context, page };
}

async function createDemoPage(browser, role) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enterDemo(page, role);
  return { context, page };
}

test('Coach demo and registered Coach use the same product surfaces and navigation', async ({ browser }) => {
  const paid = await createPaidPage(browser, 'coach');
  const demo = await createDemoPage(browser, 'coach');
  try {
    await expect(paid.page.getByTestId('coach-command-center-full')).toBeVisible();
    await expect(demo.page.getByTestId('coach-command-center-full')).toBeVisible();
    expect(await surfaceSignature(demo.page.getByTestId('coach-command-center-full'))).toEqual(await surfaceSignature(paid.page.getByTestId('coach-command-center-full')));
    expect(await navLabels(demo.page)).toEqual(await navLabels(paid.page));
    await paid.page.screenshot({ path: 'parity-evidence/coach-paid-home.png', fullPage: true });
    await demo.page.screenshot({ path: 'parity-evidence/coach-demo-home.png', fullPage: true });

    for (const destination of ['Players', 'Schedule']) {
      await paid.page.getByTestId('mobile-navigation-dock').getByRole('button', { name: destination, exact: true }).click();
      await demo.page.getByTestId('mobile-navigation-dock').getByRole('button', { name: destination, exact: true }).click();
      const testId = destination === 'Players' ? 'coach-players-interactive-dashboard' : 'coach-events-interactive-dashboard';
      const paidSurface = paid.page.getByTestId(testId);
      const demoSurface = demo.page.getByTestId(testId);
      await expect(paidSurface).toBeVisible({ timeout: 15_000 });
      await expect(demoSurface).toBeVisible({ timeout: 15_000 });
      expect(await surfaceSignature(demoSurface)).toEqual(await surfaceSignature(paidSurface));
      await expectPhoneSafe(paid.page);
      await expectPhoneSafe(demo.page);
    }
  } finally {
    await paid.context.close();
    await demo.context.close();
  }
});

test('Player demo and registered Player use the same command center, navigation, and Team Store state', async ({ browser }) => {
  const paid = await createPaidPage(browser, 'player');
  const demo = await createDemoPage(browser, 'player');
  try {
    const paidCommand = paid.page.getByTestId('player-daily-command-center');
    const demoCommand = demo.page.getByTestId('player-daily-command-center');
    await expect(paidCommand).toBeVisible({ timeout: 15_000 });
    await expect(demoCommand).toBeVisible({ timeout: 15_000 });
    expect(await surfaceSignature(demoCommand)).toEqual(await surfaceSignature(paidCommand));
    expect(await navLabels(demo.page)).toEqual(await navLabels(paid.page));
    await paid.page.screenshot({ path: 'parity-evidence/player-paid-home.png', fullPage: true });
    await demo.page.screenshot({ path: 'parity-evidence/player-demo-home.png', fullPage: true });

    for (const page of [paid.page, demo.page]) {
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

    expect(await surfaceSignature(demo.page.getByRole('dialog', { name: 'Team Store' }))).toEqual(await surfaceSignature(paid.page.getByRole('dialog', { name: 'Team Store' })));
    await paid.page.screenshot({ path: 'parity-evidence/player-paid-team-store.png', fullPage: true });
    await demo.page.screenshot({ path: 'parity-evidence/player-demo-team-store.png', fullPage: true });
  } finally {
    await paid.context.close();
    await demo.context.close();
  }
});
