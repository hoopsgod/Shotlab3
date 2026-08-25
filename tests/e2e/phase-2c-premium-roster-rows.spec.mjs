import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'artifacts/phase-2c-premium-roster');

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function enterCoachPlayers(page) {
  await page.goto('/');
  const demoButton = page.getByRole('button', { name: 'Coach demo', exact: true });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Players', exact: true }).click();
  await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible({ timeout: 20_000 });
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

async function capture(page, name, locator) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  await expectNoHorizontalOverflow(page);
  if (locator) {
    await locator.screenshot({ path: path.join(outputDir, `${name}.png`), animations: 'disabled' });
  } else {
    await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true, animations: 'disabled' });
  }
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test('Coach Players roster matches the Phase 2C mobile hierarchy and preserves player intelligence routing', async ({ page }) => {
  await enterCoachPlayers(page);

  const roster = page.locator('#coach-roster-operations');
  await expect(roster).toBeVisible({ timeout: 20_000 });
  await roster.scrollIntoViewIfNeeded();

  await expect(roster.getByText(/Most engaged:/)).toBeHidden();
  await expect(roster.getByText(/Track who's putting in work today/)).toBeHidden();

  const sort = roster.getByRole('combobox', { name: 'Sort' });
  await expect(sort).toBeVisible();
  const sortBox = await sort.boundingBox();
  expect(sortBox).not.toBeNull();
  expect(sortBox.height).toBeGreaterThanOrEqual(44);

  const rows = roster.locator('> .fade-up > .phase1RosterRow');
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
  const firstRow = rows.first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow).not.toHaveAttribute('role', 'button');

  const layout = await firstRow.evaluate((row) => {
    const rowStyle = getComputedStyle(row);
    const rowRect = row.getBoundingClientRect();
    const content = row.children[1];
    const contentStyle = content ? getComputedStyle(content) : null;
    return {
      height: rowRect.height,
      left: rowRect.left,
      right: rowRect.right,
      radius: Number.parseFloat(rowStyle.borderRadius),
      background: rowStyle.backgroundColor,
      contentDisplay: contentStyle?.display || '',
      gridAreas: contentStyle?.gridTemplateAreas || '',
    };
  });

  expect(layout.height).toBeGreaterThanOrEqual(104);
  expect(layout.left).toBeGreaterThanOrEqual(-1);
  expect(layout.right).toBeLessThanOrEqual(391);
  expect(layout.radius).toBeGreaterThanOrEqual(17);
  expect(layout.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(layout.contentDisplay).toBe('grid');
  expect(layout.gridAreas).toContain('avatar details');
  expect(layout.gridAreas).toContain('. actions');

  const removeButton = firstRow.getByRole('button', { name: 'REMOVE', exact: true });
  await expect(removeButton).toBeVisible();
  const removeBox = await removeButton.boundingBox();
  expect(removeBox).not.toBeNull();
  expect(removeBox.height).toBeGreaterThanOrEqual(44);

  const profileButton = firstRow.locator('[data-phase1-open-profile="true"]');
  await expect(profileButton).toBeVisible();
  const profileLabel = await profileButton.getAttribute('aria-label');
  const rowName = String(profileLabel || '').replace(/^Open\s+/i, '').replace(/\s+profile$/i, '') || 'Player';
  await capture(page, '01-coach-players-premium-roster-section', roster);

  await profileButton.click();
  const drawer = page.getByRole('dialog', { name: rowName });
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await expect(drawer).toContainText(rowName);
  await expectNoHorizontalOverflow(page);

  await drawer.getByRole('button', { name: 'Open Full Profile', exact: true }).click();
  const detail = page.getByTestId('coach-player-detail-workspace');
  await expect(detail).toBeVisible({ timeout: 10_000 });
  await expect(detail).toContainText(rowName);
  await expectNoHorizontalOverflow(page);
});

test('Coach Players premium roster remains phone-safe through the full visible page', async ({ page }) => {
  await enterCoachPlayers(page);
  const roster = page.locator('#coach-roster-operations');
  await expect(roster).toBeVisible({ timeout: 20_000 });
  await roster.scrollIntoViewIfNeeded();
  await capture(page, '02-coach-players-premium-roster-full', null);
});
