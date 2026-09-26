import { test, expect } from '@playwright/test';
import { enterPhase1BSession } from './support/phase1b-state-fixtures.mjs';

async function installSafeRoutes(page) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
}

async function enterDemo(page, role) {
  await page.goto('/?demo=1');
  const button = page.getByRole('button', { name: role === 'coach' ? 'Coach demo' : 'Player demo', exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible({ timeout: 20_000 });
}

async function noHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

const ONE_PIXEL_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const ONE_PIXEL_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.setViewportSize({ width: 390, height: 844 });
});

test('Player photo control lives in More > Personalization, not Progress', async ({ page }) => {
  await enterDemo(page, 'player');
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Progress', exact: true }).click();
  const progress = page.getByTestId('player-profile-workspace');
  await expect(progress).toBeVisible({ timeout: 20_000 });
  await expect(progress.locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]')).toHaveCount(0);

  await page.getByTestId('mobile-navigation-more').click();
  const sheet = page.getByTestId('mobile-navigation-sheet');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="personalization"]').click();
  const workspace = page.getByTestId('player-personalization-workspace');
  await expect(workspace).toBeVisible({ timeout: 20_000 });

  const card = workspace.locator('section.premiumSummaryPanel:has(input[type="file"])');
  await expect(card).toBeVisible();
  const cardBox = await card.boundingBox();
  expect(cardBox?.height || 0).toBeGreaterThanOrEqual(44);
  const action = card.locator('label.cta-primary');
  await expect(action).toHaveText('Add photo');
  await card.locator('input[type="file"]').setInputFiles({ name: 'profile.png', mimeType: 'image/png', buffer: ONE_PIXEL_PNG });
  await expect(card.locator('img')).toHaveAttribute('src', /^blob:/);
  await expect(action).toHaveText('Change photo');
  await noHorizontalOverflow(page);
});

test('Coach roster and full player profile render the same stored player photo', async ({ browser }) => {
  const { context, page } = await enterPhase1BSession(browser, { role: 'coach', scenario: 'populated', mode: 'registered', playerPhotoUrl: ONE_PIXEL_DATA_URL });
  try {
    await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Players', exact: true }).click();
    await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible({ timeout: 20_000 });
    const roster = page.locator('#coach-roster-operations');
    expect(await roster.locator('.phase1RosterRow').count()).toBeGreaterThanOrEqual(1);
    const photoRow = roster.locator('.phase1RosterRow:has(.coachRosterCard__photo)').first();
    const photo = photoRow.locator('.coachRosterCard__photo');
    await expect(photoRow).toBeVisible();
    await expect(photo).toHaveAttribute('src', /^data:image\/png;base64,/);
    const background = await photoRow.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).not.toBe('rgb(255, 255, 255)');
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    await photoRow.locator('[data-phase1-open-profile="true"]').click();
    const drawer = page.getByTestId('coach-player-intelligence-drawer');
    await expect(drawer).toBeVisible({ timeout: 20_000 });
    await drawer.getByRole('button', { name: 'Open Full Profile', exact: true }).click();
    const profile = page.getByTestId('coach-player-development-profile');
    await expect(profile).toBeVisible({ timeout: 20_000 });
    await expect(profile.getByTestId('coach-player-profile-photo')).toHaveAttribute('src', /^data:image\/png;base64,/);
    await noHorizontalOverflow(page);
  } finally { await context.close(); }
});
