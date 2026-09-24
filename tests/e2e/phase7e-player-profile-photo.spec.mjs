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

test('Player can add a profile photo through the shared profile surface', async ({ page }) => {
  await enterDemo(page, 'player');
  await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.getByTestId('player-profile-workspace')).toBeVisible({ timeout: 20_000 });

  const card = page.getByTestId('player-profile-photo-card');
  await expect(card).toBeVisible();
  const action = card.getByTestId('player-profile-photo-action');
  await expect(action).toBeVisible();
  const actionBox = await action.boundingBox();
  expect(actionBox?.height || 0).toBeGreaterThanOrEqual(44);

  await card.getByTestId('player-profile-photo-input').setInputFiles({
    name: 'profile.png',
    mimeType: 'image/png',
    buffer: ONE_PIXEL_PNG,
  });

  const image = card.locator('img');
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute('src', /^blob:/);
  await expect(action).toHaveText('Change photo');
  await noHorizontalOverflow(page);
});

test('Coach roster renders stored player photos and restrained row color', async ({ browser }) => {
  const { context, page } = await enterPhase1BSession(browser, {
    role: 'coach',
    scenario: 'populated',
    mode: 'registered',
    playerPhotoUrl: ONE_PIXEL_DATA_URL,
  });
  try {
    await page.getByTestId('mobile-navigation-dock').getByRole('button', { name: 'Players', exact: true }).click();
    await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible({ timeout: 20_000 });

    const roster = page.locator('#coach-roster-operations');
    const rows = roster.locator('.phase1RosterRow');
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
    const photo = roster.locator('.coachRosterCard__photo').first();
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute('src', /^data:image\/png;base64,/);

    const background = await rows.first().evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(background).not.toBe('rgb(255, 255, 255)');
    expect(background).not.toBe('rgba(0, 0, 0, 0)');
    await noHorizontalOverflow(page);
  } finally {
    await context.close();
  }
});
