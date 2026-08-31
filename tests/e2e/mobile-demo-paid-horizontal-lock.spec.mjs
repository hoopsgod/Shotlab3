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
      'sl:players': role === 'coach' ? [coach] : [coach, player],
      'sl:player-profiles': role === 'coach' ? [] : [{ id: 'profile-shared-lock-player', userId: player.email, teamId: TEAM_ID, firstName: 'Shared', lastName: 'Player', jerseyNumber: '12' }],
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
  const page = await context.newPage();
  await page.goto('/?demo=1');
  const button = page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  return { context, page };
}

function selectorsFor(role) {
  const roleRail = role === 'coach'
    ? '.performance-shell--coach.is-mobile > .shell-main > .content-wrap'
    : '.player-scroll-container';
  const dashboard = role === 'coach' ? '[data-testid="coach-command-center-full"]' : '[data-testid="player-daily-command-center"]';
  const coachOwners = role === 'coach' ? [
    '.performance-workspace--coach',
    '.performance-shell--coach.is-mobile .coach-route-scroll-container',
    '.team-brand.coach-mode.page',
  ] : [];
  return {
    roleRail,
    dashboard,
    ambient: role === 'coach' ? '[data-testid="coach-ambient-glow"]' : null,
    locked: [...new Set(['html', 'body', '#root', '.app-shell.is-mobile', '.shell-main', '.content-wrap', '.performance-workspace', ...coachOwners, roleRail, dashboard])],
  };
}

async function readGeometry(page, role) {
  const selectors = selectorsFor(role);
  return page.evaluate(({ locked, roleRail, dashboard, ambient }) => {
    const layoutViewportWidth = document.documentElement.clientWidth;
    const visualViewportLeft = window.visualViewport?.offsetLeft ?? 0;
    const visualViewportWidth = window.visualViewport?.width ?? layoutViewportWidth;
    const visualViewportRight = visualViewportLeft + visualViewportWidth;
    const visualViewportCenter = visualViewportLeft + visualViewportWidth / 2;
    const entries = Object.fromEntries(locked.map((selector) => {
      const node = document.querySelector(selector);
      if (!node) return [selector, null];
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return [selector, {
        left: rect.left,
        right: rect.right,
        width: rect.width,
        clientWidth: node.clientWidth,
        scrollWidth: node.scrollWidth,
        scrollLeft: node.scrollLeft,
        overflowX: style.overflowX,
        overscrollBehaviorX: style.overscrollBehaviorX,
        touchAction: style.touchAction,
      }];
    }));
    const dashboardEntry = entries[dashboard];
    const roleEntry = entries[roleRail];
    const ambientNode = ambient ? document.querySelector(ambient) : null;
    const ambientRect = ambientNode?.getBoundingClientRect();
    return {
      layoutViewportWidth,
      visualViewportLeft,
      visualViewportWidth,
      visualViewportRight,
      visualViewportCenter,
      visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
      visualViewportScale: window.visualViewport?.scale || 1,
      windowScrollX: window.scrollX,
      rootScrollLeft: document.scrollingElement?.scrollLeft || 0,
      roleRail,
      dashboard,
      ambient: ambientRect ? { left: ambientRect.left, right: ambientRect.right, width: ambientRect.width } : null,
      entries,
      dashboardCenter: dashboardEntry ? (dashboardEntry.left + dashboardEntry.right) / 2 : null,
      dashboardLeftGutter: dashboardEntry ? dashboardEntry.left - visualViewportLeft : null,
      dashboardRightGutter: dashboardEntry ? visualViewportRight - dashboardEntry.right : null,
      roleCenter: roleEntry ? (roleEntry.left + roleEntry.right) / 2 : null,
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

async function dispatchHorizontalFingerPan(page, role) {
  const selectors = selectorsFor(role);
  const viewport = page.viewportSize();
  const dashboard = page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center');
  const box = await dashboard.boundingBox();
  const y = box
    ? Math.round(Math.min(box.y + Math.max(80, Math.min(140, box.height * 0.16)), viewport.height - 180))
    : Math.max(180, Math.min(Math.round(viewport.height * 0.48), viewport.height - 180));
  const left = box?.x ?? 0;
  const width = box?.width ?? viewport.width;
  const startX = Math.round(left + width * 0.78);
  const endX = Math.round(left + width * 0.22);

  await page.evaluate(({ locked, ambient }) => {
    const previous = window.__shotlabHorizontalPanProbeHandler;
    if (previous) document.removeEventListener('touchmove', previous);
    window.__shotlabHorizontalPanProbeEvents = [];
    const handler = (event) => {
      const ambientRect = ambient ? document.querySelector(ambient)?.getBoundingClientRect() : null;
      window.__shotlabHorizontalPanProbeEvents.push({
        cancelable: event.cancelable,
        defaultPrevented: event.defaultPrevented,
        windowScrollX: window.scrollX,
        visualViewportOffsetLeft: window.visualViewport?.offsetLeft || 0,
        owners: Object.fromEntries(locked.map((selector) => {
          const node = document.querySelector(selector);
          return [selector, node ? { clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, scrollLeft: node.scrollLeft } : null];
        })),
        ambient: ambientRect ? { left: ambientRect.left, right: ambientRect.right } : null,
      });
    };
    window.__shotlabHorizontalPanProbeHandler = handler;
    document.addEventListener('touchmove', handler, { passive: true });
  }, selectors);

  const session = await page.context().newCDPSession(page);
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

  return page.evaluate(() => {
    const events = window.__shotlabHorizontalPanProbeEvents || [];
    const handler = window.__shotlabHorizontalPanProbeHandler;
    if (handler) document.removeEventListener('touchmove', handler);
    delete window.__shotlabHorizontalPanProbeHandler;
    delete window.__shotlabHorizontalPanProbeEvents;
    return {
      count: events.length,
      cancelableCount: events.filter((event) => event.cancelable).length,
      preventedCount: events.filter((event) => event.defaultPrevented).length,
      samples: events,
    };
  });
}

async function expectIntentionalRangeGestureWorks(page, label) {
  const viewport = page.viewportSize();
  const probe = await page.evaluate(() => {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.value = '0';
    input.dataset.testid = 'horizontal-range-pan-probe';
    Object.assign(input.style, { position: 'fixed', left: '20px', right: '20px', bottom: '120px', zIndex: '9999', height: '44px' });
    document.body.append(input);
    window.__shotlabRangeProbeEvents = [];
    input.addEventListener('touchmove', (event) => window.__shotlabRangeProbeEvents.push({ defaultPrevented: event.defaultPrevented }), { passive: true });
    const rect = input.getBoundingClientRect();
    return { left: rect.left, right: rect.right, y: rect.top + rect.height / 2 };
  });

  const session = await page.context().newCDPSession(page);
  try {
    const startX = Math.round(probe.left + (probe.right - probe.left) * 0.2);
    const endX = Math.round(probe.left + (probe.right - probe.left) * 0.8);
    await session.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: Math.round(probe.y) }] });
    for (let step = 1; step <= 6; step += 1) {
      const x = Math.round(startX + ((endX - startX) * step) / 6);
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(probe.y) }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally {
    await session.detach();
  }

  const result = await page.evaluate(() => {
    const input = document.querySelector('[data-testid="horizontal-range-pan-probe"]');
    const events = window.__shotlabRangeProbeEvents || [];
    const value = Number(input?.value || 0);
    input?.remove();
    delete window.__shotlabRangeProbeEvents;
    return { value, count: events.length, preventedCount: events.filter((event) => event.defaultPrevented).length };
  });
  expect(result.count, `${label} range must receive trusted touchmove events`).toBeGreaterThan(0);
  expect(result.preventedCount, `${label} range gesture must not be cancelled by the outer viewport lock`).toBe(0);
  expect(result.value, `${label} range must respond to horizontal touch movement in a ${viewport.width}px viewport`).toBeGreaterThan(20);
}

async function expectVerticalScrollWorks(page, label) {
  const result = await page.evaluate(async () => {
    const root = document.scrollingElement || document.documentElement;
    const maxY = Math.max(0, root.scrollHeight - root.clientHeight);
    const targetY = Math.min(180, maxY);
    window.scrollTo(0, targetY);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const measured = { maxY, scrollY: window.scrollY, scrollX: window.scrollX };
    window.scrollTo(0, 0);
    return measured;
  });
  expect(result.maxY, `${label} must expose vertical content`).toBeGreaterThan(0);
  expect(result.scrollY, `${label} vertical scroll must remain available`).toBeGreaterThan(0);
  expect(Math.abs(result.scrollX), `${label} vertical movement must not introduce x translation`).toBeLessThanOrEqual(1);
}

function expectIntrinsicContainment(geometry, role, label) {
  if (role !== 'coach') return;
  for (const [selector, entry] of Object.entries(geometry.entries)) {
    if (!entry) continue;
    expect(entry.scrollWidth, `${label} ${selector} intrinsic width: ${JSON.stringify(entry)}`).toBeLessThanOrEqual(entry.clientWidth + 1);
  }
  if (geometry.ambient) {
    expect(geometry.ambient.left, `${label} Coach ambient glow left edge`).toBeGreaterThanOrEqual(geometry.visualViewportLeft - 1);
    expect(geometry.ambient.right, `${label} Coach ambient glow right edge`).toBeLessThanOrEqual(geometry.visualViewportRight + 1);
  }
}

function expectVisualAxis(geometry, label) {
  const diagnostic = `${label}: ${JSON.stringify(geometry, null, 2)}`;
  expect(geometry.dashboardCenter, diagnostic).not.toBeNull();
  expect(Math.abs(geometry.dashboardCenter - geometry.visualViewportCenter), `${label} dashboard must use visual viewport center`).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.dashboardLeftGutter - geometry.dashboardRightGutter), `${label} dashboard must have symmetric visual-viewport gutters`).toBeLessThanOrEqual(1);
  expect(geometry.roleCenter, diagnostic).not.toBeNull();
  expect(Math.abs(geometry.roleCenter - geometry.visualViewportCenter), `${label} real role owner must use visual viewport center`).toBeLessThanOrEqual(1);
}

async function expectSharedMobileLock(page, role, label) {
  const before = await readGeometry(page, role);
  const diagnostic = `${label}: ${JSON.stringify(before, null, 2)}`;
  expect(Math.abs(before.windowScrollX), diagnostic).toBeLessThanOrEqual(1);
  expect(Math.abs(before.rootScrollLeft), diagnostic).toBeLessThanOrEqual(1);
  expect(Math.abs(before.visualViewportOffsetLeft), diagnostic).toBeLessThanOrEqual(1);
  expectVisualAxis(before, label);
  expectIntrinsicContainment(before, role, label);

  for (const [selector, entry] of Object.entries(before.entries)) {
    if (!entry) continue;
    expect(entry.left, `${label} ${selector} left edge`).toBeGreaterThanOrEqual(before.visualViewportLeft - 1);
    expect(entry.right, `${label} ${selector} right edge`).toBeLessThanOrEqual(before.visualViewportRight + 1);
    expect(Math.abs(entry.scrollLeft), `${label} ${selector} initial scrollLeft`).toBeLessThanOrEqual(1);
    expect(['clip', 'hidden'], `${label} ${selector} x containment`).toContain(entry.overflowX);
  }

  for (const selector of ['html', 'body', '#root']) {
    const rootEntry = before.entries[selector];
    expect(rootEntry, diagnostic).not.toBeNull();
    expect(rootEntry.overscrollBehaviorX, `${label} ${selector} must own x overscroll containment`).toBe('none');
  }

  const roleEntry = before.entries[before.roleRail];
  expect(roleEntry, diagnostic).not.toBeNull();

  await forceInvalidHorizontalState(page, role);
  const afterForced = await readGeometry(page, role);
  expect(Math.abs(afterForced.windowScrollX), `${label} window retained forced x offset`).toBeLessThanOrEqual(1);
  expect(Math.abs(afterForced.rootScrollLeft), `${label} root retained forced x offset`).toBeLessThanOrEqual(1);
  expectVisualAxis(afterForced, `${label} after forced offset`);
  expectIntrinsicContainment(afterForced, role, `${label} after forced offset`);
  for (const [selector, entry] of Object.entries(afterForced.entries)) {
    if (!entry) continue;
    expect(Math.abs(entry.scrollLeft), `${label} ${selector} retained forced scrollLeft`).toBeLessThanOrEqual(1);
  }

  const touchProbe = await dispatchHorizontalFingerPan(page, role);
  expect(touchProbe.count, `${label} must receive trusted touchmove events`).toBeGreaterThan(0);
  expect(touchProbe.cancelableCount, `${label} must receive cancelable touchmove events`).toBeGreaterThan(0);
  expect(touchProbe.preventedCount, `${label} outer horizontal touchmove must be cancelled while finger is down`).toBeGreaterThan(0);
  for (const [index, sample] of touchProbe.samples.entries()) {
    const sampleLabel = `${label} during finger pan sample ${index + 1}`;
    expect(Math.abs(sample.windowScrollX), sampleLabel).toBeLessThanOrEqual(1);
    expect(Math.abs(sample.visualViewportOffsetLeft), sampleLabel).toBeLessThanOrEqual(1);
    for (const [selector, owner] of Object.entries(sample.owners)) {
      if (!owner) continue;
      if (role === 'coach') expect(owner.scrollWidth, `${sampleLabel} ${selector} intrinsic width`).toBeLessThanOrEqual(owner.clientWidth + 1);
      expect(Math.abs(owner.scrollLeft), `${sampleLabel} ${selector} scrollLeft`).toBeLessThanOrEqual(1);
    }
    if (sample.ambient) {
      expect(sample.ambient.left, `${sampleLabel} Coach ambient glow left edge`).toBeGreaterThanOrEqual(-1);
      expect(sample.ambient.right, `${sampleLabel} Coach ambient glow right edge`).toBeLessThanOrEqual(before.layoutViewportWidth + 1);
    }
  }

  const afterTouch = await readGeometry(page, role);
  expect(Math.abs(afterTouch.windowScrollX), `${label} window moved after finger pan`).toBeLessThanOrEqual(1);
  expect(Math.abs(afterTouch.rootScrollLeft), `${label} root moved after finger pan`).toBeLessThanOrEqual(1);
  expect(Math.abs(afterTouch.visualViewportOffsetLeft), `${label} visual viewport moved after finger pan`).toBeLessThanOrEqual(1);
  expectVisualAxis(afterTouch, `${label} after finger pan`);
  expectIntrinsicContainment(afterTouch, role, `${label} after finger pan`);
  for (const [selector, entry] of Object.entries(afterTouch.entries)) {
    if (!entry) continue;
    expect(Math.abs(entry.scrollLeft), `${label} ${selector} moved after finger pan`).toBeLessThanOrEqual(1);
  }
}

for (const viewport of VIEWPORTS) {
  test(`Demo and paid Coach share a locked centered mobile viewport at ${viewport.width}px`, async ({ browser }) => {
    test.setTimeout(180_000);
    for (const mode of ['demo', 'paid']) {
      const role = 'coach';
      const session = mode === 'demo'
        ? await createDemo(browser, role, viewport)
        : await createRegistered(browser, role, viewport);
      try {
        await expectSharedMobileLock(session.page, role, `${mode} ${role} ${viewport.width}px`);
        if (mode === 'paid') {
          await expectIntentionalRangeGestureWorks(session.page, `paid coach ${viewport.width}px`);
          await expectVerticalScrollWorks(session.page, `paid coach ${viewport.width}px`);
        }
        if (viewport.width === 390 || viewport.width === 430) {
          await session.page.screenshot({ path: `parity-evidence/${mode}-${role}-shared-mobile-lock-${viewport.width}.png`, fullPage: true });
        }
      } finally {
        await session.context.close();
      }
    }
  });
}
