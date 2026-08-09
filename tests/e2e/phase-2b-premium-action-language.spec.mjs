import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve(process.cwd(), 'artifacts/phase-2b-premium-actions');

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

async function expectPremiumSupportingAction(button) {
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  const result = await button.evaluate((node) => {
    const style = getComputedStyle(node);
    const after = getComputedStyle(node, '::after');
    const rect = node.getBoundingClientRect();
    return {
      height: rect.height,
      left: rect.left,
      right: rect.right,
      display: style.display,
      afterContent: after.content,
      maskImage: after.maskImage || after.webkitMaskImage || '',
      afterWidth: Number.parseFloat(after.width),
    };
  });
  expect(result.height).toBeGreaterThanOrEqual(44);
  expect(result.left).toBeGreaterThanOrEqual(-1);
  expect(result.right).toBeLessThanOrEqual(391);
  expect(result.display).toBe('flex');
  expect(result.afterContent).not.toBe('none');
  expect(result.maskImage).not.toBe('none');
  expect(result.afterWidth).toBeGreaterThanOrEqual(13);
}

async function expectNativeShotLabAction(button) {
  await button.scrollIntoViewIfNeeded();
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width).toBeLessThanOrEqual(391);
  const arrow = button.locator('svg path[d="M5 12h14m-6-6 6 6-6 6"]');
  await expect(arrow).toHaveCount(1);
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

test('Coach Players supporting actions use the Phase 2B premium affordance and keep their handlers working', async ({ page }) => {
  await enterCoachDemo(page);
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Players', exact: true }).click();
  await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible({ timeout: 20_000 });

  const evidence = page.getByTestId('coach-players-insight-grid');
  await expect(evidence).toBeVisible();
  const actions = evidence.locator('button');
  expect(await actions.count()).toBeGreaterThanOrEqual(1);
  const action = actions.first();
  await expectPremiumSupportingAction(action);

  const teamAndAccount = page.getByRole('button', { name: 'Team & Account', exact: true });
  await expectPremiumSupportingAction(teamAndAccount);

  await capture(page, '01-coach-players-premium-actions');
  await action.click();
  await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible();
});

test('Coach Schedule keeps the accepted decision hierarchy and native premium actions functional', async ({ page }) => {
  await enterCoachDemo(page);
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Schedule', exact: true }).click();
  await expect(page.getByTestId('coach-events-interactive-dashboard')).toBeVisible({ timeout: 20_000 });

  const createEvent = page.getByTestId('coach-events-command-bar').getByRole('button', { name: 'Create Event', exact: true });
  const resolveRsvps = page.getByTestId('coach-events-decision-brief').getByRole('button', { name: 'Resolve RSVPs', exact: true });
  await expectNativeShotLabAction(createEvent);
  await expectNativeShotLabAction(resolveRsvps);

  const hiddenEvidence = page.getByTestId('coach-events-insight-grid');
  await expect(hiddenEvidence).toBeHidden();

  await capture(page, '02-coach-events-premium-actions');
  await resolveRsvps.click();
  await expect(page.getByTestId('coach-event-intelligence-drawer')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('coach-event-intelligence-drawer').getByText('Team Practice', { exact: true })).toBeVisible();
});
