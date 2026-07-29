import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, archives: [] }),
  }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, invitations: [] }),
  }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "[]",
  }));
}

async function enterFreshCoachDemo(page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("fresh Coach Demo receives one truthful next action and lands on the session form", async ({ page }) => {
  await enterFreshCoachDemo(page);

  const activation = page.getByTestId("coach-onboarding-state");
  await expect(activation).toBeVisible({ timeout: 20_000 });
  await expect(activation.getByText("Schedule the first team session", { exact: true })).toBeVisible();
  await expect(activation.getByText("2/4", { exact: false })).toBeVisible();

  await activation.getByRole("button", { name: /Create session/i }).click();

  const createEventDialog = page.getByRole("dialog", { name: "Create event" });
  await expect(createEventDialog).toBeVisible({ timeout: 20_000 });
  await expect(createEventDialog.getByPlaceholder("Open Gym Run")).toBeVisible();
  await expect(createEventDialog.locator('input[type="date"]')).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});
