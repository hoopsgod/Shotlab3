import { test, expect } from '@playwright/test';
import { installParityBranding, withParityBranding } from './parity-branding-fixture.mjs';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-responsive-parity-2026';
const IDENTITIES = {
  coach: { id: '33333333-3333-4333-8333-333333333333', email: 'responsive.coach@shotlab.test', name: 'Responsive Coach', role: 'coach', isCoach: true },
  player: { id: '44444444-4444-4444-8444-444444444444', email: 'responsive.player@shotlab.test', name: 'Responsive Player', role: 'player', isCoach: false },
};
const DATA_STATE_CLASSES = new Set(['is-onboarding', 'has-team-data']);

function registeredSeed(role) {
  const current = IDENTITIES[role];
  const coach = { ...IDENTITIES.coach, teamId: TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_000 };
  const player = { ...IDENTITIES.player, teamId: TEAM_ID, hideFromLeaderboards: false, createdAt: 1_780_000_000_001 };
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    user: { id: current.id, email: current.email, aud: 'authenticated', role: 'authenticated' },
    storage: {
      'sl:supabase-session': { access_token: `responsive-${role}-token`, refresh_token: `responsive-${role}-refresh`, expires_at: nowSeconds + 3600, expires_in: 3600, token_type: 'bearer', user: { id: current.id, email: current.email } },
      'sl:supabase-access-token': `responsive-${role}-token`,
      'sl:session': { email: current.email },
      'sl:teams': [withParityBranding({ id: TEAM_ID, name: 'Responsive Parity Team', ownerCoachId: coach.email, joinCode: 'RESP26', createdAt: 1_780_000_000_000 })],
      'sl:players': [coach, player],
      'sl:player-profiles': [{ id: 'profile-responsive-player', userId: player.email, teamId: TEAM_ID, firstName: 'Responsive', lastName: 'Player', jerseyNumber: '12' }],
      'sl:scores': [{ id: 'score-responsive-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, drillId: 'demo-home-warm-up-shooting-4-minute', score: 12, date: '2026-08-13', src: 'home' }],
      'sl:program-scores': [],
      'sl:shotlogs': [{ id: 'shot-responsive-1', email: player.email, playerId: player.email, name: player.name, teamId: TEAM_ID, made: 100, date: '2026-08-13', syncState: 'remote_saved', syncSource: 'remote' }],
      'sl:events': [{ id: 'event-responsive-1', teamId: TEAM_ID, title: 'Team Practice', date: '2026-08-15', time: '6:00 PM', location: 'Main Gym', type: 'practice' }],
      'sl:rsvps': [], 'sl:sc-sessions': [], 'sl:sc-rsvps': [], 'sl:sc-logs': [], 'sl:challenges': [], 'sl:season-archives': [], 'sl:team-stores': [],
    },
  };
}

async function installRoutes(target, registeredUser = null) {
  await target.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(registeredUser || {}) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  if (registeredUser?.email) {
    const identity = Object.values(IDENTITIES).find((candidate) => candidate.email === registeredUser.email);
    const profile = identity ? { email: identity.email, name: identity.name, role: identity.role, team_id: TEAM_ID, hide_from_leaderboards: identity.role === 'coach' } : null;
    await target.route('**/v1/legacy-auth/restore', (route) => route.fulfill({ status: profile ? 200 : 404, contentType: 'application/json', body: JSON.stringify(profile ? { ok: true, profile } : { error: 'profile_not_found' }) }));
    await target.route('**/v1/teams/restore-context', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, team: { id: TEAM_ID, name: 'Responsive Parity Team', ownerCoachId: IDENTITIES.coach.email, joinCode: 'RESP26', createdAt: 1_780_000_000_000 } }) }));
  }
}

async function createRegistered(browser, role, viewport) {
  const context = await browser.newContext({ viewport });
  const seed = registeredSeed(role);
  await context.addInitScript(({ storage }) => {
    window.localStorage.clear(); window.sessionStorage.clear();
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
  }, { storage: seed.storage });
  await installRoutes(context, seed.user);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

async function createDemo(browser, role, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await installRoutes(page);
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true }).click();
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  await installParityBranding(page);
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

async function signature(page, testId) {
  const locator = page.getByTestId(testId);
  return locator.evaluate((node, stateClasses) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const stableClassName = String(node.className || '')
      .split(/\s+/)
      .filter(Boolean)
      .filter((name) => !stateClasses.includes(name))
      .join(' ');
    return {
      tag: node.tagName,
      className: stableClassName,
      display: style.display,
      position: style.position,
      borderRadius: style.borderRadius,
      fontFamily: style.fontFamily,
      textAlign: style.textAlign,
      left: Math.round(rect.left * 2) / 2,
      width: Math.round(rect.width * 2) / 2,
    };
  }, [...DATA_STATE_CLASSES]);
}

async function expectRegisteredStateQuality(page, role) {
  if (role !== 'coach') return;
  const activation = page.locator('.mcTodayPlan.mcActivationPlan');
  if (await activation.count() === 0) return;

  const visual = await activation.evaluate((node) => {
    const style = getComputedStyle(node);
    const strong = node.querySelector('.mcTodayPlanCopy strong');
    const strongStyle = strong ? getComputedStyle(strong) : null;
    const button = node.querySelector(':scope > button');
    const buttonRect = button?.getBoundingClientRect();
    const rect = node.getBoundingClientRect();
    return {
      backgroundImage: style.backgroundImage,
      borderRadius: Number.parseFloat(style.borderRadius),
      textColor: strongStyle?.color || '',
      width: rect.width,
      buttonWidth: buttonRect?.width || 0,
    };
  });

  // A truthful sparse/onboarding state may change content, but it may not fall
  // back to the generic pale editorial card. Preserve the component-owned dark
  // premium material and the same full-width mobile action treatment as Demo.
  expect(visual.backgroundImage).toContain('linear-gradient');
  expect(visual.backgroundImage).not.toBe('none');
  expect(visual.borderRadius).toBeGreaterThanOrEqual(16);
  expect(visual.textColor).toBe('rgb(255, 255, 255)');
  expect(visual.buttonWidth).toBeGreaterThanOrEqual(visual.width - 34);
}

async function expectNoOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

for (const viewportCase of [
  { name: '430-mobile', viewport: { width: 430, height: 932 } },
  { name: 'desktop', viewport: { width: 1440, height: 1000 } },
]) {
  for (const role of ['coach', 'player']) {
    test(`${role} demo and registered ${role} share the same ${viewportCase.name} home surface`, async ({ browser }) => {
      const registered = await createRegistered(browser, role, viewportCase.viewport);
      const demo = await createDemo(browser, role, viewportCase.viewport);
      const testId = role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center';
      try {
        expect(await signature(demo.page, testId)).toEqual(await signature(registered.page, testId));
        await expectRegisteredStateQuality(registered.page, role);
        await expectNoOverflow(demo.page);
        await expectNoOverflow(registered.page);
        if (viewportCase.viewport.width < 768) {
          await expect(demo.page.getByTestId('mobile-navigation-dock')).toBeVisible();
          await expect(registered.page.getByTestId('mobile-navigation-dock')).toBeVisible();
        } else {
          await expect(demo.page.getByTestId('mobile-navigation-dock')).toHaveCount(0);
          await expect(registered.page.getByTestId('mobile-navigation-dock')).toHaveCount(0);
        }
        await demo.page.screenshot({ path: `parity-evidence/${role}-demo-${viewportCase.name}.png`, fullPage: true });
        await registered.page.screenshot({ path: `parity-evidence/${role}-registered-${viewportCase.name}.png`, fullPage: true });
      } finally {
        await demo.context.close(); await registered.context.close();
      }
    });
  }
}
