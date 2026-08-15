import { test, expect } from '@playwright/test';

async function installRoutes(page, counters) {
  await page.route('**/v1/season-archives', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route('**/v1/leaderboards/home-shots**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ leaderboard: [] }) }));
  await page.route('**/v1/coach/players/provision**', (route) => {
    counters.invites += 1;
    return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'demo_should_not_reach_network' }) });
  });
}

async function enterDemoCoach(page, counters) {
  await installRoutes(page, counters);
  await page.goto('/?demo=1');
  const demoButton = page.getByRole('button', { name: 'Coach demo', exact: true });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId('coach-command-center-full')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible();
}

async function openMobileDestination(page, name) {
  const dock = page.getByTestId('mobile-navigation-dock');
  const direct = dock.getByRole('button', { name, exact: true });
  if (await direct.count()) {
    await direct.click();
    return;
  }
  await dock.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name, exact: true }).last().click();
}

test.describe('demo sandbox runtime safety', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Coach demo keeps production invite UI but never reaches the invitation service', async ({ page }) => {
    const counters = { invites: 0 };
    await enterDemoCoach(page, counters);
    await openMobileDestination(page, 'Players');

    const form = page.getByTestId('coach-player-invite-form');
    await expect(form).toBeVisible({ timeout: 15_000 });
    await form.getByLabel('First name').fill('Sandbox');
    await form.getByLabel('Last name').fill('Prospect');
    await form.getByLabel('Player email').fill('sandbox.prospect@example.com');
    await form.getByRole('button', { name: 'ADD PLAYER & SEND INVITE', exact: true }).click();

    await expect(form.getByRole('alert')).toContainText('Player invitations are disabled in the demo sandbox.');
    expect(counters.invites).toBe(0);
    await expect(page.getByTestId('coach-players-interactive-dashboard')).toBeVisible();
  });

  test('Coach demo renders the real account deletion flow but capability guard blocks deletion', async ({ page }) => {
    const counters = { invites: 0 };
    await enterDemoCoach(page, counters);
    await openMobileDestination(page, 'Settings');

    await expect(page.getByTestId('coach-administration-workspace')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: 'Delete Account & Data', exact: true }).click();
    await expect(page.getByText('CONFIRM ACCOUNT REQUEST', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'CONFIRM DELETE ACCOUNT', exact: true }).click();

    await expect(page.getByText('Account deletion is disabled in the demo sandbox.', { exact: true })).toBeVisible();
    await expect(page.getByTestId('coach-administration-workspace')).toBeVisible();
    await expect(page.getByTestId('mobile-navigation-dock')).toBeVisible();
  });
});