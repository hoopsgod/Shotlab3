import { test, expect } from '@playwright/test';
import { withParityBranding } from './parity-branding-fixture.mjs';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-shared-mobile-horizontal-lock-2026';
const IDENTITIES = {
  coach: { id: '88888888-8888-4888-8888-888888888881', email: 'shared.lock.coach@shotlab.test', name: 'Shared Lock Coach', role: 'coach', isCoach: true },
  player: { id: '88888888-8888-4888-8888-888888888882', email: 'shared.lock.player@shotlab.test', name: 'Shared Lock Player', role: 'player', isCoach: false },
};

const VIEWPORTS = [
  { width: 320, height: 740 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

function registeredSeed(role) {
  const current = IDENTITIES[role];
  const coach = { ...IDENTITIES.coach, teamId: TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_000 };
  const player = { ...IDENTITIES.player, teamId: TEAM_ID, hideFromLeaderboards: false, createdAt: 1_780_000_000_001 };
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    user: { id: current.id, email: current.email, aud: 'authenticated', role: 'authenticated' },
    storage: {
      'sl:supabase-session': { access_token: `shared-lock-${role}`, refresh_token: `shared-lock-${role}-refresh`, expires_at: nowSeconds + 3600, expires_in: 3600, token_type: 'bearer', user: { id: current.id, email: current.email } },
      'sl:supabase-access-token': `shared-lock-${role}`,
      'sl:session': { email: current.email },
      'sl:teams': [withParityBranding({ id: TEAM_ID, name: 'Shared Mobile Lock Team', ownerCoachId: coach.email, joinCode: 'LOCK26', createdAt: 1_780_000_000_000 })],
      'sl:players': [coach, player],
      'sl:player-profiles': [{ id: 'profile-shared-lock-player', userId: player.email, teamId: TEAM_ID, firstName: 'Shared', lastName: 'Player', jerseyNumber: '12' }],
      'sl:scores': [], 'sl:program-scores': [], 'sl:shotlogs': [], 'sl:events': [], 'sl:rsvps': [], 'sl:sc-sessions': [], 'sl:sc-rsvps': [], 'sl:sc-logs': [], 'sl:challenges': [], 'sl:season-archives': [], 'sl:team-stores': [],
    },
  };
}

async function installRegisteredRoutes(target, registeredUser) {
  await target.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(registeredUser) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const identity = Object.values(IDENTITIES).find((candidate) => candidate.email === registeredUser.email);
  const profile = { email: identity.email, name: identity.name, role: identity.role, team_id: TEAM_ID, hide_from_leaderboards: identity.role === 'coach' };
  await target.route('**/v1/legacy-auth/restore', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, profile }) }));
  await target.route('**/v1/teams/restore-context', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, team: withParityBranding({ id: TEAM_ID, name: 'Shared Mobile Lock Team', ownerCoachId: IDENTITIES.coach.email, joinCode: 'LOCK26', createdAt: 1_780_000_000_000 }) }) }));
}

async function createRegistered(browser, role, viewport) {
  const context = await browser.newContext({ viewport, screen: viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const seed = registeredSeed(role);
  await context.addInitScript(({ storage }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
  }, { storage: seed.storage });
  await installRegisteredRoutes(context, seed.user);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

async function createDemo(browser, role, viewport) {
  const context = await browser.newContext({ viewport, screen: viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  const page = await context.newPage();
  await page.goto(`/?demo=${role}`);
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

function selectorsFor(role) {
  const roleRail = role === 'coach' ? '.coach-scroll-container' : '.player-scroll-container';
  const dashboard = role === 'coach' ? '[data-testid="coach-command-center-full"]' : '[data-testid="player-daily-command-center"]';
  return {
    roleRail,
    dashboard,
    locked: ['html', 'body', '#root', '.app-shell.is-mobile', '.shell-main', '.content-wrap', '.performance-workspace', roleRail, dashboard],
  };
}

async function readGeometry(page, role) {
  const selectors = selectorsFor(role);
  return page.evaluate(({ locked, roleRail, dashboard }) => {
    const viewport = document.documentElement.clientWidth;
    const entries = Object.fromEntries(locked.map((selector) => {
      const node = document.querySelector(selector);
      if (!node) return [selector, null];
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return [selector, {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        scrollLeft: node.scrollLeft,
        overflowX: style.overflowX,
        overscrollBehaviorX: style.overscrollBehaviorX,
        touchAction: style.touchAction,
      }];
    }));
    const dashboardEntry = entries[dashboard];
    return {
      viewport,
      windowScrollX: window.scrollX,
      rootScrollLeft: document.scrollingElement?.scrollLeft || 0,
      visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
      roleRail,
      dashboard,
      entries,
      dashboardCenter: dashboardEntry ? (dashboardEntry.left + dashboardEntry.right) / 2 : null,
    };
  }, selectors);
}

async function forceInvalidHorizontalState(page, role) {
  const { locked } = selectorsFor(role);
  await page.evaluate(async (selectors) => {
    const y = window.scrollY;
    const root = document.scrollingElement || document.documentElement;
    root.scrollLeft = 240;
    window.scrollTo(240, y);
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node) node.scrollLeft = 240;
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.dispatchEvent(new Event('touchend'));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, locked);
}

async function dispatchHorizontalFingerPan(page) {
  const viewport = page.viewportSize();
  const session = await page.context().newCDPSession(page);
  const y = Math.max(180, Math.min(Math.round(viewport.height * 0.48), viewport.height - 180));
  const startX = Math.round(viewport.width * 0.78);
  const endX = Math.round(viewport.width * 0.22);
  try {
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y }] });
    for (let step = 1; step <= 7; step += 1) {
      const x = Math.round(startX + ((endX - startX) * step) / 7);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(160);
  } finally {
    await session.detach();
  }
}

async function expectSharedMobileLock(page, role, label) {
  const before = await readGeometry(page, role);
  const diagnostic = `${label}: ${JSON.stringify(before, null, 2)}`;
  expect(Math.abs(before.windowScrollX), diagnostic).toBeLessThanOrEqual(1);
  expect(Math.abs(before.rootScrollLeft), diagnostic).toBeLessThanOrEqual(1);
  expect(Math.abs(before.visualViewportOffsetLeft), diagnostic).toBeLessThanOrEqual(1);
  expect(before.dashboardCenter, diagnostic).not.toBeNull();
  expect(Math.abs(before.dashboardCenter - before.viewport / 2), diagnostic).toBeLessThanOrEqual(1);

  for (const [selector, entry] of Object.entries(before.entries)) {
    if (!entry) continue;
    expect(entry.left, `${label} ${selector} left edge`).toBeGreaterThanOrEqual(-1);
    expect(entry.right, `${label} ${selector} right edge`).toBeLessThanOrEqual(before.viewport + 1);
    expect(Math.abs(entry.scrollLeft), `${label} ${selector} initial scrollLeft`).toBeLessThanOrEqual(1);
    expect(['clip', 'hidden'], `${label} ${selector} x containment`).toContain(entry.overflowX);
  }

  const roleEntry = before.entries[before.roleRail];
  expect(roleEntry, diagnostic).not.toBeNull();
  expect(roleEntry.overscrollBehaviorX, diagnostic).toBe('none');
  expect(roleEntry.touchAction, diagnostic).toContain('pan-y');

  await forceInvalidHorizontalState(page, role);
  const afterForced = await readGeometry(page, role);
  expect(Math.abs(afterForced.windowScrollX), `${label} window retained forced x offset`).toBeLessThanOrEqual(1);
  expect(Math.abs(afterForced.rootScrollLeft), `${label} root retained forced x offset`).toBeLessThanOrEqual(1);
  for (const [selector, entry] of Object.entries(afterForced.entries)) {
    if (!entry) continue;
    expect(Math.abs(entry.scrollLeft), `${label} ${selector} retained forced scrollLeft`).toBeLessThanOrEqual(1);
  }

  await dispatchHorizontalFingerPan(page);
  const afterTouch = await readGeometry(page, role);
  expect(Math.abs(afterTouch.windowScrollX), `${label} window moved after finger pan`).toBeLessThanOrEqual(1);
  expect(Math.abs(afterTouch.rootScrollLeft), `${label} root moved after finger pan`).toBeLessThanOrEqual(1);
  expect(Math.abs(afterTouch.visualViewportOffsetLeft), `${label} visual viewport moved after finger pan`).toBeLessThanOrEqual(1);
  expect(Math.abs(afterTouch.dashboardCenter - afterTouch.viewport / 2), `${label} dashboard lost center axis after finger pan`).toBeLessThanOrEqual(1);
  for (const [selector, entry] of Object.entries(afterTouch.entries)) {
    if (!entry) continue;
    expect(Math.abs(entry.scrollLeft), `${label} ${selector} moved after finger pan`).toBeLessThanOrEqual(1);
  }
}

for (const viewport of VIEWPORTS) {
  test(`Demo and paid Coach/Player share a locked centered mobile viewport at ${viewport.width}px`, async ({ browser }) => {
    test.setTimeout(180_000);
    for (const mode of ['demo', 'paid']) {
      for (const role of ['coach', 'player']) {
        const session = mode === 'demo'
          ? await createDemo(browser, role, viewport)
          : await createRegistered(browser, role, viewport);
        try {
          await expectSharedMobileLock(session.page, role, `${mode} ${role} ${viewport.width}px`);
          if (viewport.width === 390) {
            await session.page.screenshot({ path: `parity-evidence/${mode}-${role}-shared-mobile-lock-390.png`, fullPage: true });
          }
        } finally {
          await session.context.close();
        }
      }
    }
  });
}
