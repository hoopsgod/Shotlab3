import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'artifacts/phase-2-premium-ui');

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function enterCoachDemo(page) {
  await page.goto('/');
  const demoButton = page.getByRole('button', { name: 'Coach demo', exact: true });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({ timeout: 20_000 });
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function expectPremiumMetricStrip(page, testId) {
  const strip = page.getByTestId(testId);
  await expect(strip).toBeVisible({ timeout: 20_000 });
  const metrics = strip.locator('[data-premium-metric]');
  await expect(metrics).toHaveCount(4);
  await expect(strip.locator('[data-premium-metric-icon]')).toHaveCount(4);
  await expect(strip.locator('[data-premium-metric-evidence]')).toHaveCount(4);

  for (let index = 0; index < 4; index += 1) {
    const box = await metrics.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  return strip;
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true, animations: 'disabled' });
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test('Coach Players premium metrics expose iconography, evidence, and working filters', async ({ page }) => {
  await enterCoachDemo(page);
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Players', exact: true }).click();
  await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible({ timeout: 20_000 });

  const strip = await expectPremiumMetricStrip(page, 'coach-players-metric-strip');
  expect(await strip.locator('[data-premium-metric-evidence]:not([data-premium-metric-placeholder])').count()).toBeGreaterThanOrEqual(1);

  const attention = strip.getByRole('button', { name: /Needs Attention/i });
  await attention.click();
  await expect(attention).toHaveAttribute('aria-pressed', 'true');

  await capture(page, '01-coach-players-premium-metrics');
});

test('Coach Schedule premium metrics preserve hierarchy and truthful no-trend signals', async ({ page }) => {
  await enterCoachDemo(page);
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Schedule', exact: true }).click();
  await expect(page.getByTestId('coach-events-interactive-dashboard')).toBeVisible({ timeout: 20_000 });

  const strip = await expectPremiumMetricStrip(page, 'coach-events-metric-strip');
  await expect(strip.locator('[data-premium-metric-placeholder]').first()).toBeVisible();

  const missing = strip.getByRole('button', { name: /Missing RSVPs/i });
  await missing.click();
  await expect(missing).toHaveAttribute('aria-pressed', 'true');

  await capture(page, '02-coach-events-premium-metrics');
});
