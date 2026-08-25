import { test, expect, webkit } from '@playwright/test';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-registered-webkit-scroll-lock-2026';
const COACH = {
  id: '77777777-7777-4777-8777-777777777777',
  email: 'webkit.viewport.coach@shotlab.test',
  name: 'WebKit Viewport Coach',
  role: 'coach',
  isCoach: true,
};
const COACH_RAIL_SELECTOR = '.performance-shell--coach.is-mobile > .shell-main > .content-wrap';

function registeredCoachSeed() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const coach = { ...COACH, teamId: TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_000 };
  const team = {
    id: TEAM_ID,
    name: 'Paid Mobile Team',
    ownerCoachId: coach.email,
    joinCode: 'WK26',
    createdAt: 1_780_000_000_000,
  };
  return {
    user: { id: coach.id, email: coach.email, aud: 'authenticated', role: 'authenticated' },
    team,
    storage: {
      'sl:supabase-session': {
        access_token: 'webkit-coach-token',
        refresh_token: 'webkit-coach-refresh',
        expires_at: nowSeconds + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: coach.id, email: coach.email },
      },
      'sl:supabase-access-token': 'webkit-coach-token',
      'sl:session': { email: coach.email },
      'sl:teams': [team],
      'sl:players': [coach],
      'sl:player-profiles': [], 'sl:scores': [], 'sl:program-scores': [], 'sl:shotlogs': [], 'sl:events': [], 'sl:rsvps': [], 'sl:sc-sessions': [], 'sl:sc-rsvps': [], 'sl:sc-logs': [], 'sl:challenges': [], 'sl:season-archives': [], 'sl:team-stores': [],
    },
  };
}

async function installRoutes(target, registeredUser, team) {
  await target.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/auth/v1/user`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(registeredUser) }));
  await target.route(`${REGISTERED_SUPABASE_ORIGIN}/rest/v1/**`, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await target.route('**/v1/legacy-auth/restore', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, profile: { email: COACH.email, name: COACH.name, role: 'coach', team_id: TEAM_ID, hide_from_leaderboards: true } }) }));
  await target.route('**/v1/teams/restore-context', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, team }) }));
}

async function createRegisteredCoach(browser, viewport) {
  const context = await browser.newContext({
    viewport,
    screen: viewport,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  });
  const seed = registeredCoachSeed();
  await context.addInitScript(({ storage }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, JSON.stringify(value));
  }, { storage: seed.storage });
  await installRoutes(context, seed.user, seed.team);
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

async function collectHorizontalOverflow(page) {
  return page.evaluate((coachRailSelector) => {
    const root = document.scrollingElement || document.documentElement;
    const rail = document.querySelector(coachRailSelector);
    const viewport = document.documentElement.clientWidth;
    const offenders = Array.from(document.querySelectorAll('body *'))
      .map((node) => {
        const styles = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        if (styles.display === 'none' || styles.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) return null;
        const outsideLeft = rect.left < -1;
        const outsideRight = rect.right > viewport + 1;
        const internallyScrollable = node.scrollWidth > node.clientWidth + 1;
        if (!outsideLeft && !outsideRight && !internallyScrollable) return null;
        return {
          tag: node.tagName.toLowerCase(), id: node.id || '', classes: typeof node.className === 'string' ? node.className.slice(0, 180) : '', testid: node.getAttribute('data-testid') || '',
          left: Math.round(rect.left * 10) / 10, right: Math.round(rect.right * 10) / 10, width: Math.round(rect.width * 10) / 10,
          clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, position: styles.position, overflowX: styles.overflowX, transform: styles.transform,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Math.max(b.right - viewport, -b.left, b.scrollWidth - b.clientWidth) - Math.max(a.right - viewport, -a.left, a.scrollWidth - a.clientWidth))
      .slice(0, 30);

    return {
      viewport,
      innerWidth: window.innerWidth,
      rootClientWidth: root.clientWidth,
      rootScrollWidth: root.scrollWidth,
      rootScrollLeft: root.scrollLeft,
      rootOverscrollBehaviorX: getComputedStyle(document.documentElement).overscrollBehaviorX,
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      windowScrollX: window.scrollX,
      visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
      rail: rail ? {
        clientWidth: rail.clientWidth,
        scrollWidth: rail.scrollWidth,
        scrollLeft: rail.scrollLeft,
        overflowX: getComputedStyle(rail).overflowX,
        overscrollBehaviorX: getComputedStyle(rail).overscrollBehaviorX,
      } : null,
      offenders,
    };
  }, COACH_RAIL_SELECTOR);
}

async function expectNoPersistentDocumentOrRailPan(page, label) {
  const before = await collectHorizontalOverflow(page);
  const diagnostic = `${label} horizontal overflow report:\n${JSON.stringify(before, null, 2)}`;
  expect(before.rootScrollWidth, diagnostic).toBeLessThanOrEqual(before.rootClientWidth + 1);
  expect(before.bodyScrollWidth, diagnostic).toBeLessThanOrEqual(before.viewport + 1);
  expect(before.rootOverscrollBehaviorX, diagnostic).toBe('none');
  expect(before.rail, diagnostic).not.toBeNull();
  expect(['clip', 'hidden'], diagnostic).toContain(before.rail.overflowX);
  expect(Math.abs(before.rail.scrollLeft), diagnostic).toBeLessThanOrEqual(1);

  const shifted = await page.evaluate(async (coachRailSelector) => {
    const root = document.scrollingElement || document.documentElement;
    const rail = document.querySelector(coachRailSelector);
    const y = window.scrollY;
    root.scrollLeft = 240;
    window.scrollTo(240, y);
    if (rail) rail.scrollLeft = 240;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
      rootScrollLeft: root.scrollLeft,
      railScrollLeft: rail?.scrollLeft || 0,
      windowScrollX: window.scrollX,
      visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
    };
  }, COACH_RAIL_SELECTOR);
  expect(Math.abs(shifted.rootScrollLeft), diagnostic).toBeLessThanOrEqual(1);
  expect(Math.abs(shifted.railScrollLeft), diagnostic).toBeLessThanOrEqual(1);
  expect(Math.abs(shifted.windowScrollX), diagnostic).toBeLessThanOrEqual(1);
  expect(Math.abs(shifted.visualViewportOffsetLeft), diagnostic).toBeLessThanOrEqual(1);
}

async function expectSymmetricVisualGutters(locator, label, minimumGutter = 12) {
  await expect(locator, `${label} must be visible`).toBeVisible({ timeout: 20_000 });
  const geometry = await locator.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    return {
      viewport,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      leftGutter: rect.left,
      rightGutter: viewport - rect.right,
    };
  });
  const diagnostic = `${label} visual gutters: ${JSON.stringify(geometry)}`;
  expect(geometry.leftGutter, diagnostic).toBeGreaterThanOrEqual(minimumGutter);
  expect(geometry.rightGutter, diagnostic).toBeGreaterThanOrEqual(minimumGutter);
  expect(Math.abs(geometry.leftGutter - geometry.rightGutter), diagnostic).toBeLessThanOrEqual(2);
}

async function expectVisibleDirectChildrenCentered(locator, label, minimumGutter = 12) {
  await expect(locator, `${label} must be visible`).toBeVisible({ timeout: 20_000 });
  const rows = await locator.evaluate((node) => {
    const viewport = document.documentElement.clientWidth;
    return Array.from(node.children).map((child) => {
      const style = getComputedStyle(child);
      const rect = child.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) return null;
      return {
        tag: child.tagName.toLowerCase(),
        classes: typeof child.className === 'string' ? child.className : '',
        testid: child.getAttribute('data-testid') || '',
        left: rect.left,
        right: rect.right,
        width: rect.width,
        leftGutter: rect.left,
        rightGutter: viewport - rect.right,
      };
    }).filter(Boolean);
  });
  expect(rows.length, `${label} must expose at least one visible direct child`).toBeGreaterThan(0);
  for (const row of rows) {
    const diagnostic = `${label} child visual gutters: ${JSON.stringify(row)}`;
    expect(row.leftGutter, diagnostic).toBeGreaterThanOrEqual(minimumGutter);
    expect(row.rightGutter, diagnostic).toBeGreaterThanOrEqual(minimumGutter);
    expect(Math.abs(row.leftGutter - row.rightGutter), diagnostic).toBeLessThanOrEqual(2);
  }
}

async function verifyRegisteredCoachVisualAxis(page, width) {
  const dock = page.getByTestId('mobile-navigation-dock');

  await expectSymmetricVisualGutters(
    page.getByTestId('coach-primary-objective').locator('.mcHeroIdentity'),
    `registered Coach Home ${width}px WebKit identity rail`,
  );
  await expectSymmetricVisualGutters(
    page.locator('[data-testid="coach-command-center-full"] .mcFocusGrid'),
    `registered Coach Home ${width}px WebKit lower focus grid`,
  );
  await expectVisibleDirectChildrenCentered(
    page.locator('[data-testid="coach-command-center-full"] .mcFocusGrid'),
    `registered Coach Home ${width}px WebKit lower focus grid`,
  );
  const lowerGrid = page.locator('[data-testid="coach-command-center-full"] .mcLowerGrid');
  if (await lowerGrid.count()) {
    await expectSymmetricVisualGutters(lowerGrid, `registered Coach Home ${width}px WebKit lower panel grid`);
    await expectVisibleDirectChildrenCentered(lowerGrid, `registered Coach Home ${width}px WebKit lower panel grid`);
  }
  await page.screenshot({ path: `parity-evidence/webkit-paid-coach-home-${width}.png`, fullPage: true });

  await dock.getByRole('button', { name: 'Players', exact: true }).click();
  const players = page.getByTestId('coach-players-interactive-dashboard');
  await expectSymmetricVisualGutters(players, `registered Coach Players ${width}px WebKit workspace`);
  await expectVisibleDirectChildrenCentered(players, `registered Coach Players ${width}px WebKit workspace`);
  await expectNoPersistentDocumentOrRailPan(page, `registered Coach Players ${width}px WebKit`);
  await page.screenshot({ path: `parity-evidence/webkit-paid-coach-players-${width}.png`, fullPage: true });

  await dock.getByRole('button', { name: 'Schedule', exact: true }).click();
  const events = page.getByTestId('coach-events-interactive-dashboard');
  await expectSymmetricVisualGutters(events, `registered Coach Events ${width}px WebKit workspace`);
  await expectVisibleDirectChildrenCentered(events, `registered Coach Events ${width}px WebKit workspace`);
  await expectNoPersistentDocumentOrRailPan(page, `registered Coach Events ${width}px WebKit`);
  await page.screenshot({ path: `parity-evidence/webkit-paid-coach-events-${width}.png`, fullPage: true });
}

for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
  test(`registered paid Coach onboarding Home, Players, and Events keep symmetric gutters in mobile WebKit at ${viewport.width}px`, async () => {
    test.setTimeout(180_000);
    const browser = await webkit.launch();
    try {
      const registered = await createRegisteredCoach(browser, viewport);
      try {
        await expectNoPersistentDocumentOrRailPan(registered.page, `registered Coach Home ${viewport.width}px WebKit`);
        await verifyRegisteredCoachVisualAxis(registered.page, viewport.width);
      } finally {
        await registered.context.close();
      }
    } finally {
      await browser.close();
    }
  });
}
