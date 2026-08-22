import { test, expect } from '@playwright/test';
import { withParityBranding } from './parity-branding-fixture.mjs';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-registered-viewport-lock-2026';
const IDENTITIES = {
  coach: { id: '55555555-5555-4555-8555-555555555555', email: 'viewport.coach@shotlab.test', name: 'Viewport Coach', role: 'coach', isCoach: true },
  player: { id: '66666666-6666-4666-8666-666666666666', email: 'viewport.player@shotlab.test', name: 'Viewport Player', role: 'player', isCoach: false },
};

function registeredSeed(role) {
  const current = IDENTITIES[role];
  const coach = { ...IDENTITIES.coach, teamId: TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_000 };
  const player = { ...IDENTITIES.player, teamId: TEAM_ID, hideFromLeaderboards: false, createdAt: 1_780_000_000_001 };
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    user: { id: current.id, email: current.email, aud: 'authenticated', role: 'authenticated' },
    storage: {
      'sl:supabase-session': { access_token: `viewport-${role}-token`, refresh_token: `viewport-${role}-refresh`, expires_at: nowSeconds + 3600, expires_in: 3600, token_type: 'bearer', user: { id: current.id, email: current.email } },
      'sl:supabase-access-token': `viewport-${role}-token`,
      'sl:session': { email: current.email },
      'sl:teams': [withParityBranding({ id: TEAM_ID, name: 'Viewport Lock Team', ownerCoachId: coach.email, joinCode: 'VIEW26', createdAt: 1_780_000_000_000 })],
      'sl:players': [coach, player],
      'sl:player-profiles': [{ id: 'profile-viewport-player', userId: player.email, teamId: TEAM_ID, firstName: 'Viewport', lastName: 'Player', jerseyNumber: '12' }],
      'sl:scores': [{ id: 'score-viewport-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, drillId: 'demo-home-warm-up-shooting-4-minute', score: 12, date: '2026-08-21', src: 'home' }],
      'sl:program-scores': [],
      'sl:shotlogs': [{ id: 'shot-viewport-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, made: 100, date: '2026-08-21', syncState: 'remote_saved', syncSource: 'remote' }],
      'sl:events': [{ id: 'event-viewport-1', teamId: TEAM_ID, title: 'Team Practice', date: '2026-08-22', time: '6:00 PM', location: 'Main Gym', type: 'practice' }],
      'sl:rsvps': [], 'sl:sc-sessions': [], 'sl:sc-rsvps': [], 'sl:sc-logs': [], 'sl:challenges': [], 'sl:season-archives': [], 'sl:team-stores': [],
    },
  };
}

async function installRoutes(target, registeredUser) {
  await target.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(registeredUser) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const identity = Object.values(IDENTITIES).find((candidate) => candidate.email === registeredUser.email);
  const profile = { email: identity.email, name: identity.name, role: identity.role, team_id: TEAM_ID, hide_from_leaderboards: identity.role === 'coach' };
  await target.route('**/v1/legacy-auth/restore', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, profile }) }));
  await target.route('**/v1/teams/restore-context', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, team: withParityBranding({ id: TEAM_ID, name: 'Viewport Lock Team', ownerCoachId: IDENTITIES.coach.email, joinCode: 'VIEW26', createdAt: 1_780_000_000_000 }) }) }));
}

async function createRegistered(browser, role, viewport) {
  const context = await browser.newContext({ viewport });
  const seed = registeredSeed(role);
  await context.addInitScript(({ storage }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
  }, { storage: seed.storage });
  await installRoutes(context, seed.user);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

async function navigateByKey(page, key) {
  const dock = page.getByTestId('mobile-navigation-dock');
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId('mobile-navigation-more').click();
    const sheet = page.getByTestId('mobile-navigation-sheet');
    await expect(sheet).toBeVisible();
    const item = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(item).toBeVisible();
    await item.click();
    await expect(sheet).toHaveCount(0);
  }
  await page.waitForTimeout(180);
}

const VIEWPORT_CONTAINMENT_SELECTORS = [
  'html',
  'body',
  '#root',
  '.app-shell.is-mobile',
  '.shell-main',
  '.content-wrap',
  '.performance-workspace',
  '.player-scroll-container',
  '.coach-scroll-container',
  '[data-testid="coach-command-center-full"]',
  '[data-testid="coach-command-center-full"] .missionControl',
  '[data-testid="mission-control-team-header"]',
  '.mcHero[data-team-identity-stage="coach-mission-control"]',
  '.mcHero[data-team-identity-stage="coach-mission-control"] .mcHeroContent',
];

const OVERFLOW_LOCK_SELECTORS = new Set([
  'html',
  'body',
  '#root',
  '.app-shell.is-mobile',
  '.shell-main',
  '.content-wrap',
  '.performance-workspace',
  '[data-testid="coach-command-center-full"]',
  '[data-testid="coach-command-center-full"] .missionControl',
]);

const COACH_HOME_FULL_BLEED_SELECTORS = [
  '.performance-workspace--coach',
  '.coach-scroll-container',
  '[data-testid="coach-command-center-full"]',
  '[data-testid="coach-command-center-full"] .missionControl',
  '[data-testid="mission-control-team-header"]',
  '.mcHero[data-team-identity-stage="coach-mission-control"]',
];

async function expectRegisteredViewportLocked(page) {
  const geometry = await page.evaluate(async (selectors) => {
    const nodes = selectors.map((selector) => [selector, document.querySelector(selector)]).filter(([, node]) => node);
    const before = Object.fromEntries(nodes.map(([selector, node]) => {
      const rect = node.getBoundingClientRect();
      return [selector, {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        scrollLeft: node.scrollLeft,
        overflowX: getComputedStyle(node).overflowX,
      }];
    }));

    const y = window.scrollY;
    window.scrollTo(999, y);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const result = { viewport: window.innerWidth, windowScrollX: window.scrollX, before };
    window.scrollTo(0, y);
    return result;
  }, VIEWPORT_CONTAINMENT_SELECTORS);

  expect(Math.abs(geometry.windowScrollX)).toBeLessThanOrEqual(1);
  for (const selector of VIEWPORT_CONTAINMENT_SELECTORS) {
    const entry = geometry.before[selector];
    if (!entry) continue;
    expect(entry.left, `${selector} left edge`).toBeGreaterThanOrEqual(-1);
    expect(entry.right, `${selector} right edge`).toBeLessThanOrEqual(geometry.viewport + 1);
    if (OVERFLOW_LOCK_SELECTORS.has(selector)) {
      expect(['clip', 'hidden'], `${selector} horizontal overflow`).toContain(entry.overflowX);
    }
  }
}

async function expectCoachHomeFullBleed(page) {
  const geometry = await page.evaluate((selectors) => {
    const before = Object.fromEntries(selectors.map((selector) => {
      const node = document.querySelector(selector);
      if (!node) return [selector, null];
      const rect = node.getBoundingClientRect();
      const styles = getComputedStyle(node);
      return [selector, {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        paddingLeft: Number.parseFloat(styles.paddingLeft) || 0,
        paddingRight: Number.parseFloat(styles.paddingRight) || 0,
      }];
    }));
    return { viewport: window.innerWidth, before };
  }, COACH_HOME_FULL_BLEED_SELECTORS);

  for (const selector of COACH_HOME_FULL_BLEED_SELECTORS) {
    const entry = geometry.before[selector];
    expect(entry, `${selector} exists on registered Coach Home`).not.toBeNull();
    expect(Math.abs(entry.left), `${selector} must start on the viewport axis`).toBeLessThanOrEqual(1);
    expect(Math.abs(entry.right - geometry.viewport), `${selector} must end on the viewport axis`).toBeLessThanOrEqual(1);
  }

  for (const selector of ['.performance-workspace--coach', '.coach-scroll-container']) {
    const entry = geometry.before[selector];
    expect(entry.paddingLeft, `${selector} must not inherit the secondary-page left gutter on Home`).toBeLessThanOrEqual(1);
    expect(entry.paddingRight, `${selector} must not inherit the secondary-page right gutter on Home`).toBeLessThanOrEqual(1);
  }
}

const CASES = [
  { role: 'coach', routes: ['players', 'drills', 'events', 'sc', 'leaderboards', 'activity'] },
  { role: 'player', routes: ['log-drill', 'program', 'leaderboards', 'profile'] },
];

for (const viewport of [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  for (const { role, routes } of CASES) {
    test(`registered ${role} remains viewport-locked across paid routes at ${viewport.width}px`, async ({ browser }) => {
      test.setTimeout(120_000);
      const registered = await createRegistered(browser, role, viewport);
      try {
        await expectRegisteredViewportLocked(registered.page);
        if (role === 'coach') await expectCoachHomeFullBleed(registered.page);
        for (const route of routes) {
          await navigateByKey(registered.page, route);
          await expectRegisteredViewportLocked(registered.page);
        }
      } finally {
        await registered.context.close();
      }
    });
  }
}
