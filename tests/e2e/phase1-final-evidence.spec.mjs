import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const PRODUCTION_SHA = 'beb4c0e4387de405235f432648be79abad2a4493';
const BASE_URL = 'https://d7b4bcd1.shotlab3.pages.dev';
const OUTPUT = path.resolve(process.cwd(), 'artifacts/phase1-final-evidence');
fs.mkdirSync(OUTPUT, { recursive: true });

const report = {
  productionSha: PRODUCTION_SHA,
  immutableProductionUrl: BASE_URL,
  generatedAt: null,
  wideBaseline: [],
  accessibility: [],
  reflowReducedMotion: [],
};

function writeReport() {
  report.generatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUTPUT, 'phase1-final-evidence-report.json'), `${JSON.stringify(report, null, 2)}\n`);
}

test.afterAll(() => writeReport());

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto(`${BASE_URL}/?demo=1`, { waitUntil: 'domcontentloaded' });
  const label = role === 'coach' ? 'Coach demo' : 'Player demo';
  await page.getByRole('button', { name: label, exact: true }).click();
  const homeId = role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center';
  await expect(page.getByTestId(homeId)).toBeVisible({ timeout: 25_000 });
}

async function openMobileDestination(page, name, testId) {
  const dock = page.getByTestId('mobile-navigation-dock');
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await dock.getByRole('button', { name, exact: true }).click();
  await expect(page.getByTestId(testId)).toBeVisible({ timeout: 20_000 });
}

async function geometry(page) {
  return page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
}

async function expectNoHorizontalOverflow(page, label) {
  const result = await geometry(page);
  expect(result.document, `${label}: document overflow`).toBeLessThanOrEqual(result.viewport + 2);
  expect(result.body, `${label}: body overflow`).toBeLessThanOrEqual(result.viewport + 2);
  return result;
}

async function capture(page, fileName) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  const file = path.join(OUTPUT, fileName);
  await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  expect(fs.statSync(file).size, `${fileName} should be a real rendered capture`).toBeGreaterThan(10_000);
  return fileName;
}

async function prepareSurface(page, surface) {
  if (surface === 'auth') {
    await installSafeRoutes(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible({ timeout: 20_000 });
    return;
  }

  const [role, destination] = surface.split(':');
  await enterDemo(page, role);
  if (!destination || destination === 'home') return;

  const routes = {
    'coach:players': ['Players', 'coach-players-interactive-dashboard'],
    'player:train': ['Train', 'player-at-home-workspace'],
    'player:progress': ['Progress', 'player-progress-story'],
  };
  const route = routes[surface];
  if (!route) throw new Error(`Unknown evidence surface: ${surface}`);
  await openMobileDestination(page, route[0], route[1]);
}

async function verifyKeyboardFocus(page) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(() => {
      const node = document.activeElement;
      if (!node || node === document.body || node === document.documentElement) return null;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      const focusVisible = node.matches?.(':focus-visible') ?? false;
      const hasIndicator = style.outlineStyle !== 'none' || style.boxShadow !== 'none' || focusVisible;
      return {
        tag: node.tagName,
        role: node.getAttribute('role') || '',
        name: node.getAttribute('aria-label') || node.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) || '',
        visible,
        focusVisible,
        hasIndicator,
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow,
      };
    });
    if (state?.visible) {
      expect(state.hasIndicator, `Focused ${state.tag} ${state.name} should expose a visible focus indicator`).toBeTruthy();
      return state;
    }
  }
  throw new Error('Keyboard traversal did not reach a visible focusable element within 12 Tab presses.');
}

async function axeScan(page, label) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    nodes: violation.nodes.length,
  }));
  const blockers = violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));
  expect(blockers, `${label}: no serious/critical axe violations`).toEqual([]);
  return { violations, blockers };
}

async function reducedMotionState(page) {
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const running = document.getAnimations().filter((animation) => animation.playState === 'running').map((animation) => {
      const timing = animation.effect?.getComputedTiming?.() || {};
      return { duration: timing.duration, iterations: timing.iterations };
    });
    const persistent = running.filter((animation) => animation.iterations === Infinity || Number(animation.duration) > 1500);
    return {
      mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      runningAnimations: running.length,
      persistentAnimations: persistent.length,
    };
  });
}

for (const width of [768, 1024, 1280]) {
  test(`wide baseline evidence at ${width}px`, async ({ browser }) => {
    for (const role of ['coach', 'player']) {
      const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
      const page = await context.newPage();
      try {
        await enterDemo(page, role);
        await page.setViewportSize({ width, height: 1000 });
        await page.waitForTimeout(200);
        const homeGeometry = await expectNoHorizontalOverflow(page, `${role} home ${width}`);
        const homeFile = await capture(page, `${role}-home-${width}.png`);
        report.wideBaseline.push({ role, surface: 'home', width, geometry: homeGeometry, screenshot: homeFile });

        await page.setViewportSize({ width: 430, height: 932 });
        if (role === 'coach') {
          await openMobileDestination(page, 'Players', 'coach-players-interactive-dashboard');
        } else {
          await openMobileDestination(page, 'Train', 'player-at-home-workspace');
        }
        await page.setViewportSize({ width, height: 1000 });
        await page.waitForTimeout(200);
        const destination = role === 'coach' ? 'players' : 'train';
        const destinationGeometry = await expectNoHorizontalOverflow(page, `${role} ${destination} ${width}`);
        const destinationFile = await capture(page, `${role}-${destination}-${width}.png`);
        report.wideBaseline.push({ role, surface: destination, width, geometry: destinationGeometry, screenshot: destinationFile });
      } finally {
        await context.close();
      }
    }
    writeReport();
  });
}

test('formal accessibility baseline on required surfaces', async ({ browser }) => {
  const surfaces = ['auth', 'coach:home', 'coach:players', 'player:home', 'player:train', 'player:progress'];
  for (const surface of surfaces) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await prepareSurface(page, surface);
      const focus = await verifyKeyboardFocus(page);
      const axe = await axeScan(page, surface);
      const geometryResult = await expectNoHorizontalOverflow(page, `${surface} accessibility`);
      const file = await capture(page, `a11y-${surface.replace(':', '-')}-390.png`);
      report.accessibility.push({ surface, viewport: '390x844', focus, axe, geometry: geometryResult, screenshot: file });
    } finally {
      await context.close();
    }
  }
  writeReport();
});

test('200 percent equivalent reflow and reduced-motion baseline', async ({ browser }) => {
  const surfaces = ['auth', 'coach:home', 'coach:players', 'player:home', 'player:train', 'player:progress'];
  for (const surface of surfaces) {
    // A 640 CSS-pixel viewport is the reflow-equivalent layout width of a
    // 1280 CSS-pixel desktop viewport viewed at 200% browser zoom.
    const context = await browser.newContext({ viewport: { width: 640, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await prepareSurface(page, surface);
      const geometryResult = await expectNoHorizontalOverflow(page, `${surface} 200% equivalent reflow`);
      const motion = await reducedMotionState(page);
      expect(motion.mediaMatches, `${surface}: reduced-motion media query should be active`).toBeTruthy();
      expect(motion.persistentAnimations, `${surface}: no persistent animation should remain under reduced motion`).toBe(0);
      const file = await capture(page, `reflow-200-${surface.replace(':', '-')}-640.png`);
      report.reflowReducedMotion.push({
        surface,
        physicalReferenceWidth: 1280,
        equivalentZoomPercent: 200,
        effectiveCssViewport: 640,
        geometry: geometryResult,
        motion,
        screenshot: file,
      });
    } finally {
      await context.close();
    }
  }
  writeReport();
});
