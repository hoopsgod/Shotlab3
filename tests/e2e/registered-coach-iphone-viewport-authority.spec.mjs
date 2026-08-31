import { test, expect, webkit } from '@playwright/test';

const REGISTERED_SUPABASE_ORIGIN = 'https://parity.supabase.co';
const TEAM_ID = 'team-iphone-viewport-authority-2026';
const COACH = {
  id: '91919191-9191-4919-8919-919191919191',
  email: 'iphone.viewport.coach@shotlab.test',
  name: 'iPhone Viewport Coach',
  role: 'coach',
  isCoach: true,
};
const IPHONE_VIEWPORT = { width: 390, height: 844 };
const ROUTES = ['players', 'drills', 'events', 'sc', 'leaderboards', 'activity'];
const SUSTAINED_TOUCH_STEPS = 12;
const ROOT_AUTHORITY_SELECTORS = {
  html: 'html',
  body: 'body',
  root: '#root',
  shell: '.performance-shell--coach.is-mobile',
  shellMain: '.performance-shell--coach.is-mobile > .shell-main',
  contentWrap: '.performance-shell--coach.is-mobile > .shell-main > .content-wrap',
  workspace: '.performance-shell--coach.is-mobile .performance-workspace--coach',
  routeOwner: '.performance-shell--coach.is-mobile .coach-route-scroll-container',
};

function registeredCoachSeed() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const coach = { ...COACH, teamId: TEAM_ID, hideFromLeaderboards: true, createdAt: 1_780_000_000_000 };
  const team = {
    id: TEAM_ID,
    name: 'iPhone Authority Team',
    ownerCoachId: coach.email,
    joinCode: 'IOS26',
    createdAt: 1_780_000_000_000,
  };
  return {
    user: { id: coach.id, email: coach.email, aud: 'authenticated', role: 'authenticated' },
    team,
    storage: {
      'sl:supabase-session': {
        access_token: 'iphone-authority-token',
        refresh_token: 'iphone-authority-refresh',
        expires_at: nowSeconds + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: coach.id, email: coach.email },
      },
      'sl:supabase-access-token': 'iphone-authority-token',
      'sl:session': { email: coach.email },
      'sl:teams': [team],
      'sl:players': [coach],
      'sl:player-profiles': [],
      'sl:scores': [],
      'sl:program-scores': [],
      'sl:shotlogs': [],
      'sl:events': [],
      'sl:rsvps': [],
      'sl:sc-sessions': [],
      'sl:sc-rsvps': [],
      'sl:sc-logs': [],
      'sl:challenges': [],
      'sl:season-archives': [],
      'sl:team-stores': [],
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

async function createRegisteredCoach(browser) {
  const context = await browser.newContext({
    viewport: IPHONE_VIEWPORT,
    screen: IPHONE_VIEWPORT,
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
  await page.waitForTimeout(220);
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
  await page.waitForTimeout(220);
}

async function expectAuthoritativeHorizontalContainment(page, label) {
  const report = await page.evaluate((selectors) => {
    const viewportWidth = document.documentElement.clientWidth;
    const owners = Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
      const node = document.querySelector(selector);
      if (!node) return [name, null];
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return [name, {
        left: rect.left,
        right: rect.right,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        scrollLeft: node.scrollLeft,
        overflowX: style.overflowX,
        overscrollBehaviorX: style.overscrollBehaviorX,
      }];
    }));
    return {
      viewportWidth,
      windowScrollX: window.scrollX,
      rootScrollLeft: document.scrollingElement?.scrollLeft || 0,
      visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
      owners,
    };
  }, ROOT_AUTHORITY_SELECTORS);

  expect(Math.abs(report.windowScrollX), `${label} window x offset`).toBeLessThanOrEqual(1);
  expect(Math.abs(report.rootScrollLeft), `${label} root scrollLeft`).toBeLessThanOrEqual(1);
  expect(Math.abs(report.visualViewportOffsetLeft), `${label} visual viewport x offset`).toBeLessThanOrEqual(1);
  for (const [name, owner] of Object.entries(report.owners)) {
    expect(owner, `${label} missing ${name} authority owner`).not.toBeNull();
    expect(['clip', 'hidden'], `${label} ${name} overflow-x`).toContain(owner.overflowX);
    expect(owner.overscrollBehaviorX, `${label} ${name} overscroll-x`).toBe('none');
    expect(owner.left, `${label} ${name} left edge`).toBeGreaterThanOrEqual(-1);
    expect(owner.right, `${label} ${name} right edge`).toBeLessThanOrEqual(report.viewportWidth + 1);
  }
}

async function expectVisibleTitlesBelowVisualViewportTop(page, label) {
  const report = await page.evaluate(() => {
    const visual = window.visualViewport;
    const visualTop = visual?.offsetTop || 0;
    const visualHeight = visual?.height || window.innerHeight;
    const visualBottom = visualTop + visualHeight;
    const routeOwner = document.querySelector('.performance-shell--coach.is-mobile .coach-route-scroll-container');
    const routePaddingTop = routeOwner ? Number.parseFloat(getComputedStyle(routeOwner).paddingTop) || 0 : 0;
    const candidates = Array.from(document.querySelectorAll([
      '[data-identity-role="page-title"]',
      '[data-team-identity-stage="coach-mission-control"] h1',
      '[data-team-identity-stage="coach-mission-control"] h2',
      '[data-testid="coach-primary-objective"] h1',
      '[data-testid="coach-primary-objective"] h2',
    ].join(',')));
    const titles = candidates.map((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0) return null;
      return { text: String(node.textContent || '').trim(), top: rect.top, bottom: rect.bottom };
    }).filter(Boolean);
    return { visualTop, visualBottom, visualHeight, routePaddingTop, titles };
  });

  expect(report.routePaddingTop, `${label} authenticated safe-area start`).toBeGreaterThanOrEqual(11.5);
  expect(report.titles.length, `${label} must expose a visible route title`).toBeGreaterThan(0);
  for (const title of report.titles) {
    expect(title.top, `${label} title "${title.text}" safe-area top`).toBeGreaterThanOrEqual(report.visualTop + 8);
    expect(title.top, `${label} title "${title.text}" visible visual viewport`).toBeLessThan(report.visualBottom - 1);
  }
}

async function expectSustainedFingerDragCannotPanPage(page, label) {
  const result = await page.evaluate(async (steps) => {
    const surfaceCandidates = [
      document.querySelector('[data-visual-role="page-intro"]'),
      document.querySelector('[data-testid="coach-primary-objective"] .mcHeroContent'),
      document.querySelector('[data-testid="coach-command-center-full"] .mcHeroContent'),
      document.querySelector('.performance-shell--coach.is-mobile .coach-route-scroll-container'),
    ].filter(Boolean);
    const surface = surfaceCandidates.find((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 40 && rect.height > 24;
    });
    if (!surface) return null;

    const style = getComputedStyle(surface);
    const rect = surface.getBoundingClientRect();
    const visual = window.visualViewport;
    const visualTop = visual?.offsetTop || 0;
    const visualBottom = visualTop + (visual?.height || window.innerHeight);
    const startX = Math.min(window.innerWidth - 28, Math.max(180, rect.right - 32));
    const startY = Math.min(visualBottom - 28, Math.max(visualTop + 28, rect.top + Math.min(44, Math.max(18, rect.height / 3))));

    const dispatchTouch = (type, x, y) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      const touchList = type === 'touchend' || type === 'touchcancel' ? [] : [{ clientX: x, clientY: y }];
      Object.defineProperty(event, 'touches', { configurable: true, value: touchList });
      Object.defineProperty(event, 'changedTouches', { configurable: true, value: [{ clientX: x, clientY: y }] });
      surface.dispatchEvent(event);
      return event.defaultPrevented;
    };

    dispatchTouch('touchstart', startX, startY);
    const samples = [];
    for (let step = 1; step <= steps; step += 1) {
      const x = startX - step * 14;
      const y = startY + Math.min(step, 4);
      const defaultPrevented = dispatchTouch('touchmove', x, y);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      samples.push({
        step,
        defaultPrevented,
        windowScrollX: window.scrollX,
        rootScrollLeft: document.scrollingElement?.scrollLeft || 0,
        visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
      });
    }
    dispatchTouch('touchend', startX - steps * 14, startY + 4);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
      touchAction: style.touchAction,
      samples,
      finalWindowScrollX: window.scrollX,
      finalRootScrollLeft: document.scrollingElement?.scrollLeft || 0,
      finalVisualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
    };
  }, SUSTAINED_TOUCH_STEPS);

  expect(result, `${label} must expose a non-horizontal touch surface`).not.toBeNull();
  expect(result.touchAction, `${label} touch policy must preserve vertical pan`).toContain('pan-y');
  expect(result.touchAction, `${label} touch policy must preserve pinch zoom`).toContain('pinch-zoom');
  expect(result.samples).toHaveLength(SUSTAINED_TOUCH_STEPS);
  for (const sample of result.samples) {
    expect(sample.defaultPrevented, `${label} sustained touch step ${sample.step} horizontal gesture`).toBe(true);
    expect(Math.abs(sample.windowScrollX), `${label} sustained touch step ${sample.step} window x`).toBeLessThanOrEqual(1);
    expect(Math.abs(sample.rootScrollLeft), `${label} sustained touch step ${sample.step} root x`).toBeLessThanOrEqual(1);
    expect(Math.abs(sample.visualViewportOffsetLeft), `${label} sustained touch step ${sample.step} visual viewport x`).toBeLessThanOrEqual(1);
  }
  expect(Math.abs(result.finalWindowScrollX), `${label} final window x`).toBeLessThanOrEqual(1);
  expect(Math.abs(result.finalRootScrollLeft), `${label} final root x`).toBeLessThanOrEqual(1);
  expect(Math.abs(result.finalVisualViewportOffsetLeft), `${label} final visual viewport x`).toBeLessThanOrEqual(1);
}

test('registered paid Coach iPhone viewport keeps titles safe and rejects sustained horizontal finger drag on every certified route', async () => {
  test.setTimeout(180_000);
  const browser = await webkit.launch();
  try {
    const registered = await createRegisteredCoach(browser);
    try {
      await expectAuthoritativeHorizontalContainment(registered.page, 'Coach Home');
      await expectVisibleTitlesBelowVisualViewportTop(registered.page, 'Coach Home');
      await expectSustainedFingerDragCannotPanPage(registered.page, 'Coach Home');

      for (const route of ROUTES) {
        await navigateByKey(registered.page, route);
        await expectAuthoritativeHorizontalContainment(registered.page, `Coach ${route}`);
        await expectVisibleTitlesBelowVisualViewportTop(registered.page, `Coach ${route}`);
        await expectSustainedFingerDragCannotPanPage(registered.page, `Coach ${route}`);
      }
    } finally {
      await registered.context.close();
    }
  } finally {
    await browser.close();
  }
});
