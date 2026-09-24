import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'artifacts/phase-2c-premium-roster');
const viewportWidths = [320, 375, 390, 430, 768, 1024, 1280, 1440];

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
  await page.waitForTimeout(200);
  await expectNoHorizontalOverflow(page);
  if (locator) {
    await locator.screenshot({ path: path.join(outputDir, `${name}.png`), animations: 'disabled' });
  } else {
    await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true, animations: 'disabled' });
  }
}

async function flatSurface(locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      borderRadius: style.borderRadius,
    };
  });
}

function expectFlatSurface(style) {
  expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(style.backgroundColor);
  expect(style.backgroundImage).toBe('none');
  expect(style.boxShadow).toBe('none');
  expect(style.borderTopWidth).toBe('0px');
  expect(style.borderRightWidth).toBe('0px');
  expect(style.borderBottomWidth).toBe('0px');
  expect(style.borderLeftWidth).toBe('0px');
  expect(style.borderRadius).toBe('0px');
}

async function firstHealthyOrNormalRow(roster) {
  const healthy = roster.locator('.phase1RosterRow[data-status="success"]');
  return (await healthy.count()) ? healthy.first() : roster.locator('.phase1RosterRow').first();
}

async function verifyRosterGeometry(page, width) {
  await page.setViewportSize({ width, height: width <= 430 ? 844 : 900 });
  await expectNoHorizontalOverflow(page);
  const roster = page.locator('#coach-roster-operations');
  await expect(roster).toBeVisible();

  const sort = roster.getByRole('combobox', { name: 'Sort' });
  await expect(sort).toBeVisible();
  const sortBox = await sort.boundingBox();
  expect(sortBox?.height || 0).toBeGreaterThanOrEqual(44);
  expect((sortBox?.x || 0) + (sortBox?.width || 0)).toBeLessThanOrEqual(width + 1);

  const row = await firstHealthyOrNormalRow(roster);
  await expect(row).toBeVisible();
  const rowBox = await row.boundingBox();
  expect(rowBox?.x || 0).toBeGreaterThanOrEqual(-1);
  expect((rowBox?.x || 0) + (rowBox?.width || 0)).toBeLessThanOrEqual(width + 1);
  if (width <= 430) {
    expect(rowBox?.height || 0).toBeGreaterThanOrEqual(76);
    expect(rowBox?.height || 999).toBeLessThanOrEqual(84);
  }

  const manage = row.locator('.coachRosterCard__manageTrigger');
  await expect(manage).toBeVisible();
  const manageBox = await manage.boundingBox();
  expect(manageBox?.width || 0).toBeGreaterThanOrEqual(44);
  expect(manageBox?.height || 0).toBeGreaterThanOrEqual(44);

  const profile = row.locator('[data-phase1-open-profile="true"]');
  await expect(profile).toBeVisible();
  const profileBox = await profile.boundingBox();
  expect(profileBox?.width || 0).toBeGreaterThan(80);
  expect(profileBox?.height || 0).toBeGreaterThanOrEqual(44);
  expect((profileBox?.x || 0) + (profileBox?.width || 0)).toBeLessThanOrEqual((manageBox?.x || width) + 1);

  const pseudoGeometry = await profile.evaluate((node) => ({
    beforeContent: getComputedStyle(node, '::before').content,
    afterContent: getComputedStyle(node, '::after').content,
  }));
  expect(['none', 'normal']).toContain(pseudoGeometry.beforeContent);
  expect(['none', 'normal']).toContain(pseudoGeometry.afterContent);

  const metrics = row.locator('.coachRosterCard__metrics');
  await expect(metrics).toBeVisible();
  const metricsBox = await metrics.boundingBox();
  expect((metricsBox?.x || 0) + (metricsBox?.width || 0)).toBeLessThanOrEqual(width + 1);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test('Coach Players roster is one flat editorial surface and preserves contextual management', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterCoachPlayers(page);

  const roster = page.locator('#coach-roster-operations');
  await expect(roster).toBeVisible({ timeout: 20_000 });
  await roster.scrollIntoViewIfNeeded();

  const rows = roster.locator('.phase1RosterRow');
  expect(await rows.count()).toBeGreaterThanOrEqual(1);
  const firstRow = await firstHealthyOrNormalRow(roster);
  await expect(firstRow).not.toHaveAttribute('role', 'button');

  const nestedInteractives = roster.locator('button button, button a[href], a[href] button, [role="button"] button, [role="button"] a[href]');
  expect(await nestedInteractives.count()).toBe(0);

  for (const selector of [
    '.coachRosterCard__details',
    '.coachRosterCard__identity',
    '[data-phase1-open-profile="true"]',
    '.coachRosterCard__metrics',
  ]) {
    const target = firstRow.locator(selector);
    await expect(target).toBeAttached();
    expectFlatSurface(await flatSurface(target));
  }

  const rowBox = await firstRow.boundingBox();
  expect(rowBox?.height || 0).toBeGreaterThanOrEqual(76);
  expect(rowBox?.height || 999).toBeLessThanOrEqual(84);

  const profileButton = firstRow.locator('[data-phase1-open-profile="true"]');
  const manageTrigger = firstRow.locator('.coachRosterCard__manageTrigger');
  const profileBox = await profileButton.boundingBox();
  const manageBox = await manageTrigger.boundingBox();
  expect(profileBox?.height || 0).toBeGreaterThanOrEqual(44);
  expect(manageBox?.height || 0).toBeGreaterThanOrEqual(44);
  expect((profileBox?.x || 0) + (profileBox?.width || 0)).toBeLessThanOrEqual((manageBox?.x || 390) + 1);
  const profilePseudoGeometry = await profileButton.evaluate((node) => ({
    beforeContent: getComputedStyle(node, '::before').content,
    afterContent: getComputedStyle(node, '::after').content,
  }));
  expect(['none', 'normal']).toContain(profilePseudoGeometry.beforeContent);
  expect(['none', 'normal']).toContain(profilePseudoGeometry.afterContent);

  const removeButton = firstRow.getByRole('button', { name: 'REMOVE', exact: true });
  await expect(removeButton).toBeHidden();

  await manageTrigger.focus();
  await expect(manageTrigger).toBeFocused();
  const manageFocus = await manageTrigger.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) };
  });
  expect(manageFocus.outlineStyle).not.toBe('none');
  expect(manageFocus.outlineWidth).toBeGreaterThanOrEqual(2);

  const pathBeforeManage = new URL(page.url()).pathname;
  await page.keyboard.press('Space');
  await expect(removeButton).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(pathBeforeManage);
  const menu = firstRow.locator('.coachRosterCard__menu');
  const menuBox = await menu.boundingBox();
  expect(menuBox?.x || 0).toBeGreaterThanOrEqual(0);
  expect((menuBox?.x || 0) + (menuBox?.width || 0)).toBeLessThanOrEqual(391);
  await capture(page, '02-coach-players-context-menu-390', null);

  const rowCountBeforeCancel = await rows.count();
  let removalDismissed = false;
  page.once('dialog', async (dialog) => {
    removalDismissed = true;
    await dialog.dismiss();
  });
  await removeButton.click();
  expect(removalDismissed).toBe(true);
  expect(await rows.count()).toBe(rowCountBeforeCancel);
  await expect(firstRow).toBeVisible();
  await expect(removeButton).toBeHidden();

  const status = firstRow.getByTestId('semantic-roster-status');
  if (await status.count()) await expect(status).toBeHidden();

  await capture(page, '01-coach-players-flat-roster-390', roster);

  const firstNameSpan = profileButton.locator('span').first();
  const originalName = await firstNameSpan.textContent();
  await firstNameSpan.evaluate((node) => { node.textContent = 'Alexandria-Montgomery Verylonghyphenated-Surname'; });
  await expectNoHorizontalOverflow(page);
  const overflowState = await firstNameSpan.evaluate((node) => ({ clientWidth: node.clientWidth, scrollWidth: node.scrollWidth, overflow: getComputedStyle(node).textOverflow }));
  expect(overflowState.scrollWidth).toBeGreaterThanOrEqual(overflowState.clientWidth);
  expect(overflowState.overflow).toBe('ellipsis');
  await capture(page, '03-coach-players-long-name-390', firstRow);
  await firstNameSpan.evaluate((node, value) => { node.textContent = value; }, originalName || 'Player');

  const sort = roster.getByRole('combobox', { name: 'Sort' });
  const options = await sort.locator('option').evaluateAll((nodes) => nodes.map((node) => node.value));
  if (options.length > 1) {
    await sort.selectOption(options[1]);
    await expect(sort).toHaveValue(options[1]);
  }

  const lastRow = rows.last();
  await lastRow.scrollIntoViewIfNeeded();
  await expect(lastRow).toBeVisible();
  await capture(page, '04-coach-players-bottom-roster-390', null);

  await profileButton.scrollIntoViewIfNeeded();
  await profileButton.focus();
  await expect(profileButton).toBeFocused();
  const profileFocus = await profileButton.evaluate((node) => {
    const style = getComputedStyle(node);
    return { outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) };
  });
  expect(profileFocus.outlineStyle).not.toBe('none');
  expect(profileFocus.outlineWidth).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');
  const drawer = page.getByTestId('coach-player-intelligence-drawer');
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await expectNoHorizontalOverflow(page);
  await drawer.getByRole('button', { name: 'Close details', exact: true }).last().click();
  await expect(drawer).toHaveCount(0);

  await profileButton.click();
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await drawer.getByRole('button', { name: 'Open Full Profile', exact: true }).click();
  await expect(page.getByTestId('coach-player-detail-workspace')).toBeVisible({ timeout: 10_000 });
  await expectNoHorizontalOverflow(page);
});

test('Coach Players roster remains overflow-safe at all required responsive widths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterCoachPlayers(page);
  for (const width of viewportWidths) {
    await verifyRosterGeometry(page, width);
  }
});
