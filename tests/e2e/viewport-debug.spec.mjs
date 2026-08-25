import { test, expect } from '@playwright/test';
import {
  collectViewportDiagnostics,
  findViewportFailures,
  formatViewportDiagnostics,
  writeViewportDiagnostics,
} from './support/viewport-debug.mjs';

const roles = (() => {
  const requested = String(process.env.SHOTLAB_VIEWPORT_ROLE || 'all').toLowerCase();
  return requested === 'all' ? ['coach', 'player'] : [requested];
})();
const widths = String(process.env.SHOTLAB_VIEWPORT_WIDTHS || '320,375,390,430')
  .split(',')
  .map((value) => Number.parseInt(value.trim(), 10))
  .filter((value) => Number.isFinite(value) && value >= 280 && value <= 2000);
const scenario = String(process.env.SHOTLAB_VIEWPORT_SCENARIO || 'smoke').toLowerCase();

function heightFor(width) {
  if (width <= 320) return 740;
  if (width <= 375) return 812;
  if (width <= 390) return 844;
  if (width <= 430) return 932;
  return 900;
}

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function enterDemo(page, role) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto('/');
  const buttonName = role === 'coach' ? 'Coach demo' : 'Player demo';
  await page.getByRole('button', { name: buttonName, exact: true }).click();
  await expect(page.getByTestId(role === 'coach' ? 'coach-command-center-full' : 'player-daily-command-center')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
}

async function capture(page, role, label, options = {}) {
  const report = await collectViewportDiagnostics(page, { role, label, ...options });
  const outputPath = writeViewportDiagnostics(report);
  console.log(formatViewportDiagnostics(report));
  console.log(`  evidence: ${outputPath}`);
  const failures = findViewportFailures(report);
  expect(failures, failures.join('\n')).toEqual([]);
}

async function openCoachPriorityEditor(page) {
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  const drawer = page.locator('.mcMobileDrawer');
  await expect(drawer).toBeVisible();
  await drawer.getByRole('button', { name: 'Coach Tools', exact: true }).click();
  const actions = page.locator('[aria-label="Coach quick actions"]');
  await expect(actions).toBeVisible();
  await actions.getByRole('button', { name: 'Set Team Focus', exact: true }).click();
  const editor = page.getByTestId('coach-priority-editor');
  await expect(editor).toBeVisible({ timeout: 20_000 });
  const save = editor.getByRole('button', { name: 'SAVE PRIORITIES', exact: true });
  await save.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await page.waitForTimeout(100);
  return { editor, save };
}

for (const width of widths) {
  for (const role of roles) {
    if (!['coach', 'player'].includes(role)) continue;
    if (scenario === 'priority' && role === 'player') continue;

    test(`${role} viewport debug ${scenario} at ${width}px`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize({ width, height: heightFor(width) });
      await installSafeRoutes(page);
      await enterDemo(page, role);

      await capture(page, role, 'home');

      const more = page.getByTestId('mobile-navigation-more');
      if (await more.count()) {
        await more.click();
        await expect(page.getByTestId('mobile-navigation-sheet')).toBeVisible();
        await capture(page, role, 'navigation-sheet', {
          extraSelectors: ['[data-testid="mobile-navigation-sheet"]', '[data-testid="mobile-navigation-dock"]'],
        });
        await page.keyboard.press('Escape');
      }

      if (scenario === 'priority' && role === 'coach') {
        const { editor, save } = await openCoachPriorityEditor(page);
        await capture(page, role, 'priority-editor', {
          extraSelectors: ['[data-testid="coach-priority-overlay"]', '[data-testid="coach-priority-editor"]'],
          criticalActionLocators: [{ locator: save, label: 'SAVE PRIORITIES' }],
        });
        await page.getByRole('button', { name: 'Close team focus editor', exact: true }).last().click();
        await expect(editor).toBeHidden();
      }
    });
  }
}
