import { test, expect } from '@playwright/test';
import { collectViewportDiagnostics, formatViewportDiagnostics } from './support/viewport-debug.mjs';

async function installRoutes(target) {
  await target.route('**/v1/season-archives', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, archives: [] }),
  }));
  await target.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ leaderboard: [] }),
  }));
  await target.route('**/v1/coach/players/provision**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, invitations: [] }),
  }));
  await target.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }));
}

async function clickVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    if (await item.isVisible().catch(() => false)) {
      await item.click();
      return true;
    }
  }
  return false;
}

test('Coach Players does not make the 1024px document horizontally scrollable', async ({ page, context }) => {
  await installRoutes(context);
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: 'Coach demo', exact: true }).click();
  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({ timeout: 20_000 });

  const opened = await clickVisible(page.getByRole('button', { name: 'Players', exact: true }))
    || await clickVisible(page.getByRole('link', { name: 'Players', exact: true }))
    || await clickVisible(page.locator('[data-nav-key="players"]'));
  expect(opened).toBeTruthy();
  await expect(page.locator('[data-testid="coach-players-interactive-dashboard"], #coach-roster-operations').first()).toBeVisible({ timeout: 20_000 });

  const report = await collectViewportDiagnostics(page, {
    role: 'coach',
    label: 'players-1024',
    extraSelectors: [
      '.performance-shell',
      '.performance-shell--coach',
      '.app-shell.is-desktop',
      '.sidebar-nav',
      '.insights-panel',
      '[data-testid="coach-players-interactive-dashboard"]',
      '#coach-roster-operations',
    ],
  });
  console.log(formatViewportDiagnostics(report));

  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    root: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    shell: document.querySelector('.performance-shell--coach.app-shell.is-desktop')?.getBoundingClientRect().width ?? null,
    shellClass: document.querySelector('.performance-shell')?.className ?? null,
    shellGrid: (() => {
      const element = document.querySelector('.performance-shell');
      return element ? getComputedStyle(element).gridTemplateColumns : null;
    })(),
    insightsDisplay: (() => {
      const element = document.querySelector('.insights-panel');
      return element ? getComputedStyle(element).display : null;
    })(),
  }));
  console.log(`[coach-1024-geometry] ${JSON.stringify(geometry)}`);

  expect(geometry.viewport).toBe(1024);
  expect(geometry.root).toBeLessThanOrEqual(1026);
  expect(geometry.body).toBeLessThanOrEqual(1026);
  expect(geometry.shell).toBeLessThanOrEqual(1024);
  expect(geometry.insightsDisplay).toBe('none');
});
