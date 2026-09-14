import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const PRODUCTION_SHA = 'ea471d42bbd3d3b22f56e35d49b9f599268ef3ad';
const BASE_URL = 'https://5e45ac93.shotlab3.pages.dev';
const OUTPUT = path.resolve(process.cwd(), 'artifacts/phase1-final-evidence');
fs.mkdirSync(OUTPUT, { recursive: true });

const report = {
  productionSha: PRODUCTION_SHA,
  immutableProductionUrl: BASE_URL,
  generatedAt: null,
  wideBaseline: [],
  accessibility: [],
  reflowReducedMotion: [],
  closureBlockers: [],
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
  await page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true }).click();
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 25_000 });
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

async function horizontalContainment(page) {
  const value = await geometry(page);
  return { ...value, pass: value.document <= value.viewport + 2 && value.body <= value.viewport + 2 };
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

async function keyboardFocusState(page) {
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
    if (state?.visible) return { ...state, pass: Boolean(state.hasIndicator) };
  }
  return { pass: false, reason: 'No visible focusable element reached within 12 Tab presses.' };
}

async function axeScan(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const violations = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
  }));
  return {
    violations,
    blockers: violations.filter((violation) => ['serious', 'critical'].includes(violation.impact)),
  };
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
      pass: matchMedia('(prefers-reduced-motion: reduce)').matches && persistent.length === 0,
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
        const homeGeometry = await horizontalContainment(page);
        const homeFile = await capture(page, `${role}-home-${width}.png`);
        report.wideBaseline.push({ role, surface: 'home', width, geometry: homeGeometry, screenshot: homeFile });

        await page.setViewportSize({ width: 430, height: 932 });
        if (role === 'coach') await openMobileDestination(page, 'Players', 'coach-players-interactive-dashboard');
        else await openMobileDestination(page, 'Train', 'player-at-home-workspace');
        await page.setViewportSize({ width, height: 1000 });
        await page.waitForTimeout(200);
        const destination = role === 'coach' ? 'players' : 'train';
        const destinationGeometry = await horizontalContainment(page);
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
      const focus = await keyboardFocusState(page);
      const axe = await axeScan(page);
      const geometryResult = await horizontalContainment(page);
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
    const context = await browser.newContext({ viewport: { width: 640, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await prepareSurface(page, surface);
      const geometryResult = await horizontalContainment(page);
      const motion = await reducedMotionState(page);
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

test('Phase 1 closure verdict', async () => {
  const blockers = [];
  for (const entry of report.wideBaseline) {
    if (!entry.geometry.pass) blockers.push(`wide:${entry.role}:${entry.surface}:${entry.width}: overflow ${entry.geometry.body}/${entry.geometry.viewport}`);
  }
  for (const entry of report.accessibility) {
    if (!entry.focus.pass) blockers.push(`a11y:${entry.surface}: keyboard focus`);
    if (!entry.geometry.pass) blockers.push(`a11y:${entry.surface}: horizontal overflow`);
    for (const violation of entry.axe.blockers) blockers.push(`a11y:${entry.surface}:${violation.id}:${violation.nodes.length} nodes`);
  }
  for (const entry of report.reflowReducedMotion) {
    if (!entry.geometry.pass) blockers.push(`reflow:${entry.surface}: horizontal overflow`);
    if (!entry.motion.pass) blockers.push(`motion:${entry.surface}: persistent animations=${entry.motion.persistentAnimations}`);
  }
  report.closureBlockers = blockers;
  writeReport();
  expect(blockers, 'Phase 1 closure blockers must be empty').toEqual([]);
});
