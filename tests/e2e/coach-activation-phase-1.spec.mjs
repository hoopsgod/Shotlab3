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
  await page.getByRole("button", { name: "Coach demo", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function expectTeamBrandingWorkspace(page) {
  await expect(page.getByText("TEAM BRANDING", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Brand system", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save team branding", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Create event" })).toHaveCount(0);
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

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("fresh Coach Demo receives one truthful next action and lands in team branding", async ({ page }) => {
  await enterFreshCoachDemo(page);

  const activation = page.getByTestId("coach-onboarding-state");
  await expect(activation).toBeVisible({ timeout: 20_000 });
  await expect(activation.getByText("Set your team identity", { exact: true })).toBeVisible();
  await expect(activation).toContainText(/Coach activation · [0-5]\/5/);

  await activation.getByRole("button", { name: /Open team branding/i }).click();

  await expectTeamBrandingWorkspace(page);
  await expectNoHorizontalOverflow(page);
});

test("Coach Inbox turns the notification bell into an actionable mobile workflow", async ({ page }) => {
  await enterFreshCoachDemo(page);

  const bell = page.getByRole("button", { name: /Open Coach Inbox/i });
  await expect(bell).toBeVisible({ timeout: 20_000 });
  await expect(bell).toHaveAttribute("aria-expanded", "false");
  await bell.click();

  const inbox = page.getByRole("dialog", { name: "Coach Inbox" });
  await expect(inbox).toBeVisible();
  await expect(bell).toHaveAttribute("aria-expanded", "true");
  await expect(inbox.getByText("Set your team identity", { exact: true })).toBeVisible();
  await expect(inbox.getByText("Only current team actions appear here.", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(inbox).toBeHidden();
  await expect(bell).toHaveAttribute("aria-expanded", "false");

  await bell.click();
  await inbox.getByRole("button", { name: /Set your team identity/i }).click();

  await expectTeamBrandingWorkspace(page);
  await expectNoHorizontalOverflow(page);
});
