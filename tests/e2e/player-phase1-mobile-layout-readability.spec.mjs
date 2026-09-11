import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT = path.resolve(process.cwd(), 'artifacts/player-phase1-mobile-layout-readability');
const EVIDENCE = process.env.PLAYER_PHASE1_EVIDENCE || 'after';
const CAPTURE_ONLY = process.env.PLAYER_PHASE1_CAPTURE_ONLY === '1';
const VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 375, height: 844 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
];
const ROUTES = [
  { key: 'log-drill', workspace: 'at-home', name: 'train' },
  { key: 'duels', workspace: 'program', name: 'program' },
  { key: 'program', testId: 'player-commitment-center-events', name: 'events' },
  { key: 'leaderboards', workspace: 'leaderboards', name: 'rankings' },
];

fs.mkdirSync(path.join(OUTPUT, EVIDENCE), { recursive: true });

const rgb = (value = '') => {
  const match = String(value).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  return match ? match.slice(1, 4).map(Number) : null;
};
const channel = (value) => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
const luminance = (c) => .2126 * channel(c[0]) + .7152 * channel(c[1]) + .0722 * channel(c[2]);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
const close = (a, b, tolerance = 2) => Math.abs(a - b) <= tolerance;

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"archives":[]}' }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"leaderboard":[]}' }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function freeze(page) {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
  await page.evaluate(() => document.fonts?.ready);
}

async function waitForAuth(page) {
  const card = page.locator('.auth-card-enter');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card.locator('input[type="email"]')).toBeVisible();
  await expect(card.locator('input[type="password"]')).toBeVisible();
  await expect(page.getByRole('button', { name: /Player demo/i })).toBeVisible();
}

async function resetToAuth(page) {
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await waitForAuth(page);
  await freeze(page);
}

async function enterPlayerDemo(page) {
  await page.getByRole('button', { name: /Player demo/i }).click();
  await expect(page.getByTestId('player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  await freeze(page);
  await page.waitForTimeout(180);
}

async function gotoPlayerRoute(page, target) {
  const dock = page.getByTestId('mobile-navigation-dock');
  if (await dock.isVisible().catch(() => false)) {
    const direct = dock.locator(`[data-nav-key="${target.key}"]`);
    if (await direct.isVisible().catch(() => false)) {
      await direct.click();
    } else {
      await page.getByTestId('mobile-navigation-more').click();
      const sheet = page.getByTestId('mobile-navigation-sheet');
      await expect(sheet).toBeVisible();
      const item = sheet.locator(`[data-nav-key="${target.key}"]`);
      await expect(item).toBeVisible();
      await item.click();
      await expect(sheet).toHaveCount(0);
    }
  } else if (target.key === 'log-drill') {
    const primary = page.getByTestId('player-daily-primary-action');
    if (!await primary.isVisible().catch(() => false)) return false;
    await primary.click();
  } else if (target.key === 'profile') {
    const profile = page.locator('.player-quick-actions').getByRole('button', { name: /Profile/i });
    if (!await profile.isVisible().catch(() => false)) return false;
    await profile.click();
  } else {
    return false;
  }
  await freeze(page);
  await expect(page.locator('.player-scroll-container')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(160);
  return true;
}

async function assertNoPageOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(geometry.documentWidth - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewport).toBeLessThanOrEqual(1);
}

async function capture(page, viewport, name, fullPage = false) {
  if (viewport.width !== 390) return;
  await page.screenshot({ path: path.join(OUTPUT, EVIDENCE, `390-${name}.png`), fullPage, animations: 'disabled' });
}

async function assertPlayerRail(page) {
  const rail = page.locator('.player-scroll-container');
  const geometry = await rail.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      paddingLeft: Number.parseFloat(style.paddingLeft) || 0,
      paddingRight: Number.parseFloat(style.paddingRight) || 0,
      scrollDelta: element.scrollWidth - element.clientWidth,
    };
  });
  expect(geometry.scrollDelta).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.paddingLeft - geometry.paddingRight)).toBeLessThanOrEqual(1);
}

async function assertWorkspaceReadability(page, viewport, expectedWorkspace) {
  const workspace = page.locator(`[data-team-workspace="${expectedWorkspace}"]`).first();
  await expect(workspace).toBeVisible({ timeout: 20_000 });
  const metrics = await workspace.locator('[data-metric-role="label"], [data-metric-role="detail"]').evaluateAll((nodes) => nodes.map((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const isTransparent = (value) => value === 'transparent' || /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0(?:\.0+)?\s*\)$/i.test(value);
    let surfaceColor = 'rgba(0, 0, 0, 0)';
    let darkSurface = false;
    let surfaceNode = node;
    while (surfaceNode) {
      const surface = getComputedStyle(surfaceNode);
      if (surface.backgroundImage !== 'none' && surface.backgroundImage.includes('gradient')) {
        darkSurface = true;
        surfaceColor = surface.backgroundColor;
        break;
      }
      if (!isTransparent(surface.backgroundColor)) {
        surfaceColor = surface.backgroundColor;
        break;
      }
      if (surfaceNode.matches?.('[data-team-workspace]')) break;
      surfaceNode = surfaceNode.parentElement;
    }
    return {
      role: node.dataset.metricRole,
      fontSize: Number.parseFloat(style.fontSize),
      whiteSpace: style.whiteSpace,
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      color: style.color,
      surfaceColor,
      darkSurface,
      left: rect.left,
      right: rect.right,
    };
  }));
  if (!CAPTURE_ONLY) {
    expect(metrics.length).toBeGreaterThan(0);
    for (const metric of metrics) {
      expect(metric.left).toBeGreaterThanOrEqual(-1);
      expect(metric.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(metric.whiteSpace).not.toBe('nowrap');
      expect(metric.textOverflow).not.toBe('ellipsis');
      if (metric.role === 'label') expect(metric.fontSize).toBeGreaterThanOrEqual(11);
      if (metric.role === 'detail') expect(metric.fontSize).toBeGreaterThanOrEqual(12);
      const foreground = rgb(metric.color);
      const surface = /rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/i.test(metric.surfaceColor) ? null : rgb(metric.surfaceColor);
      const backgrounds = metric.darkSurface
        ? [[7, 24, 32], [11, 38, 51], [32, 57, 69]]
        : (surface ? [surface] : [[247, 248, 244], [255, 255, 255]]);
      if (foreground) for (const background of backgrounds) expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
  }

  const identity = workspace.locator('[data-visual-role="player-team-workspace-title"]');
  if (await identity.count()) {
    const titleCopy = await identity.evaluate((node) => {
      const identityLine = node.querySelector('.teamIdentityTitleStage__identityLine');
      const summary = node.querySelector('.teamIdentityTitleStage__summary');
      return {
        identitySize: identityLine ? Number.parseFloat(getComputedStyle(identityLine).fontSize) : 0,
        summaryWhiteSpace: summary ? getComputedStyle(summary).whiteSpace : '',
        summaryOverflow: summary ? getComputedStyle(summary).overflow : '',
        summaryClamp: summary ? getComputedStyle(summary).webkitLineClamp : '',
      };
    });
    if (!CAPTURE_ONLY && viewport.width <= 760) {
      expect(titleCopy.identitySize).toBeGreaterThanOrEqual(10);
      expect(titleCopy.summaryWhiteSpace).not.toBe('nowrap');
      expect(titleCopy.summaryOverflow).not.toBe('hidden');
      expect(['none', 'unset', '']).toContain(titleCopy.summaryClamp);
    }
  }

  const rails = workspace.locator('[data-player-workspace-filter-rail="true"]');
  for (let index = 0; index < await rails.count(); index += 1) {
    const geometry = await rails.nth(index).evaluate((rail) => {
      const style = getComputedStyle(rail);
      const r = rail.getBoundingClientRect();
      return {
        left: r.left,
        right: r.right,
        scrollDelta: rail.scrollWidth - rail.clientWidth,
        flexWrap: style.flexWrap,
        overflowX: style.overflowX,
      };
    });
    if (!CAPTURE_ONLY && viewport.width <= 760) {
      expect(geometry.scrollDelta).toBeLessThanOrEqual(1);
      expect(geometry.flexWrap).toBe('wrap');
      expect(geometry.left).toBeGreaterThanOrEqual(-1);
      expect(geometry.right).toBeLessThanOrEqual(viewport.width + 1);
    }
  }
}

async function assertShotTracker(page, viewport) {
  const tracker = page.getByTestId('player-shot-logging-region');
  await expect(tracker).toBeVisible({ timeout: 20_000 });
  const geometry = await tracker.evaluate((element) => {
    const root = element.getBoundingClientRect();
    const fields = [...element.querySelectorAll('.player-logging-field')].map((field) => {
      const fieldRect = field.getBoundingClientRect();
      const label = field.querySelector('label');
      const input = field.querySelector('input');
      const control = field.querySelector('.player-logging-control');
      const labelRect = label?.getBoundingClientRect();
      const inputRect = input?.getBoundingClientRect();
      const controlRect = control?.getBoundingClientRect();
      return {
        fieldLeft: fieldRect.left,
        fieldRight: fieldRect.right,
        fieldWidth: fieldRect.width,
        labelCenter: labelRect ? (labelRect.left + labelRect.right) / 2 : 0,
        fieldCenter: (fieldRect.left + fieldRect.right) / 2,
        controlLeft: controlRect?.left || 0,
        controlRight: controlRect?.right || 0,
        controlWidth: controlRect?.width || 0,
        inputLeft: inputRect?.left || 0,
        inputRight: inputRect?.right || 0,
        inputWidth: inputRect?.width || 0,
        inputAlign: input ? getComputedStyle(input).textAlign : '',
      };
    });
    return { root: { left: root.left, right: root.right }, fields };
  });
  if (CAPTURE_ONLY) return;
  expect(geometry.fields).toHaveLength(2);
  expect(Math.abs(geometry.fields[0].fieldWidth - geometry.fields[1].fieldWidth)).toBeLessThanOrEqual(1);
  for (const field of geometry.fields) {
    expect(field.controlLeft).toBeGreaterThanOrEqual(field.fieldLeft - .5);
    expect(field.controlRight).toBeLessThanOrEqual(field.fieldRight + .5);
    expect(Math.abs(field.controlWidth - field.fieldWidth)).toBeLessThanOrEqual(1);
    expect(field.inputLeft).toBeGreaterThanOrEqual(field.controlLeft - .5);
    expect(field.inputRight).toBeLessThanOrEqual(field.controlRight + .5);
    expect(field.inputWidth).toBeGreaterThanOrEqual(field.controlWidth - 2.5);
    expect(Math.abs(field.labelCenter - field.fieldCenter)).toBeLessThanOrEqual(1);
    expect(field.inputAlign).toBe('center');
  }
  if (viewport.width <= 430) {
    const leftInset = geometry.fields[0].controlLeft - geometry.root.left;
    const rightInset = geometry.root.right - geometry.fields[1].controlRight;
    expect(close(leftInset, rightInset, 1)).toBe(true);
  }
}

async function assertProgressContrast(page) {
  const hero = page.getByTestId('player-progress-story-hero');
  await expect(hero).toBeVisible({ timeout: 20_000 });
  const samples = await hero.locator('[data-testid="player-progress-story-topline"] > span:first-child, [data-testid="player-progress-target-summary"] > span, [data-testid="player-progress-metrics"] [data-performance-kind] span, [data-testid="player-progress-metrics"] [data-performance-kind] small').evaluateAll((nodes) => nodes.map((node) => ({ color: getComputedStyle(node).color, fontSize: Number.parseFloat(getComputedStyle(node).fontSize) })));
  if (CAPTURE_ONLY) return;
  expect(samples.length).toBeGreaterThan(0);
  const conservativeHeroBackgrounds = [[7, 24, 32], [11, 38, 51], [32, 57, 69]];
  for (const sample of samples) {
    expect(sample.fontSize).toBeGreaterThanOrEqual(11);
    const foreground = rgb(sample.color);
    expect(foreground).not.toBeNull();
    for (const background of conservativeHeroBackgrounds) expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  }
}

for (const viewport of VIEWPORTS) {
  test(`Player Phase 1 stays centered, readable, and bounded at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await installSafeRoutes(page);
    await resetToAuth(page);

    const auth = await page.locator('.auth-card-enter').evaluate((card) => {
      const rect = (node) => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right }; };
      return {
        card: rect(card),
        email: rect(card.querySelector('input[type="email"]')),
        password: rect(card.querySelector('input[type="password"]')),
        button: rect(card.querySelector(':scope > button.cta-primary')),
      };
    });
    await capture(page, viewport, 'signin');
    if (!CAPTURE_ONLY && viewport.width <= 430) {
      expect(close(auth.email.left, auth.password.left)).toBe(true);
      expect(close(auth.email.right, auth.password.right)).toBe(true);
      expect(close(auth.email.left, auth.button.left)).toBe(true);
      expect(close(auth.email.right, auth.button.right)).toBe(true);
      for (const control of [auth.email, auth.password, auth.button]) {
        expect(control.left).toBeGreaterThanOrEqual(auth.card.left - 1);
        expect(control.right).toBeLessThanOrEqual(auth.card.right + 1);
      }
    }
    if (!CAPTURE_ONLY) await assertNoPageOverflow(page);

    await enterPlayerDemo(page);
    await assertPlayerRail(page);
    if (!CAPTURE_ONLY) await assertNoPageOverflow(page);
    const home = page.getByTestId('player-daily-command-center');
    await expect(home).toBeVisible();
    const disclosureTitles = home.locator('.playerProgressDisclosure > summary strong');
    if (await disclosureTitles.count() && !CAPTURE_ONLY) {
      const styles = await disclosureTitles.evaluateAll((nodes) => nodes.map((node) => ({ whiteSpace: getComputedStyle(node).whiteSpace, overflow: getComputedStyle(node).overflow, textOverflow: getComputedStyle(node).textOverflow })));
      for (const style of styles) {
        expect(style.whiteSpace).not.toBe('nowrap');
        expect(style.textOverflow).not.toBe('ellipsis');
      }
    }
    await capture(page, viewport, 'home', true);

    for (const route of ROUTES) {
      const reached = await gotoPlayerRoute(page, route);
      if (!reached) continue;
      await assertPlayerRail(page);
      if (route.testId) await expect(page.getByTestId(route.testId)).toBeVisible({ timeout: 20_000 });
      if (route.workspace) await assertWorkspaceReadability(page, viewport, route.workspace);
      if (route.workspace === 'at-home' && viewport.width <= 430) await assertShotTracker(page, viewport);
      if (!CAPTURE_ONLY) await assertNoPageOverflow(page);
      if (['train', 'program', 'events'].includes(route.name)) await capture(page, viewport, route.name, true);
    }

    const reachedProfile = await gotoPlayerRoute(page, { key: 'profile' });
    expect(reachedProfile).toBe(true);
    await assertPlayerRail(page);
    await assertProgressContrast(page);
    if (!CAPTURE_ONLY) await assertNoPageOverflow(page);
    await capture(page, viewport, 'progress', true);

    if (!CAPTURE_ONLY && viewport.width <= 430) {
      const dock = page.getByTestId('mobile-navigation-dock');
      if (await dock.isVisible()) {
        await page.evaluate(async () => {
          const nested = document.querySelector('.player-scroll-container');
          const scroller = nested && nested.scrollHeight > nested.clientHeight + 1 ? nested : document.scrollingElement;
          scroller?.scrollTo({ top: scroller.scrollHeight, left: 0, behavior: 'auto' });
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const access = await page.evaluate(() => {
          const dockNode = document.querySelector('[data-testid="mobile-navigation-dock"]');
          const story = document.querySelector('[data-testid="player-progress-story"]');
          if (!dockNode || !story) return null;
          return { dockTop: dockNode.getBoundingClientRect().top, storyBottom: story.getBoundingClientRect().bottom };
        });
        if (access) expect(access.storyBottom).toBeLessThanOrEqual(access.dockTop + 2);
      }
    }

    if (!CAPTURE_ONLY) expect(errors).toEqual([]);
  });
}
