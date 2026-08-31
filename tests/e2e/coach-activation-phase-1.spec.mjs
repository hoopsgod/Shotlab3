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
  await expect(page.getByRole("heading", { name: "Program Branding", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Refine the system", exact: true })).toBeVisible();
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

test("fresh Coach Demo preserves its confirmed team identity and keeps branding reachable", async ({ page }) => {
  await enterFreshCoachDemo(page);

  // Demo Titans ships with a confirmed custom identity, so the old first-run
  // activation card must not reappear for a fresh browser session.
  await expect(page.getByTestId("coach-onboarding-state")).toHaveCount(0);
  const objective = page.getByTestId("coach-primary-objective");
  await expect(objective.getByText("Demo Titans", { exact: true })).toBeVisible();
  await expect(objective.getByRole("heading", { level: 1 })).toHaveText(/\S+/);
  await expect(objective.locator(".mcPrimary")).toBeVisible();
  await expect(objective.getByTestId("coach-primary-metrics").getByRole("button")).toHaveCount(3);

  // Phase 4 makes the hero identity authoritative and may hide the older
  // duplicate header control. Exercise whichever current branding affordance
  // is actually visible rather than coupling this contract to one old label.
  const brandingAccess = page.locator('button[aria-label*="team identity"]:visible').first();
  await expect(brandingAccess).toBeVisible();
  await brandingAccess.click();

  await expectTeamBrandingWorkspace(page);
  await expectNoHorizontalOverflow(page);
});

test("Coach mobile utilities use the current More sheet without restoring retired Inbox chrome", async ({ page }) => {
  await enterFreshCoachDemo(page);

  await expect(page.getByRole("button", { name: /Open Coach Inbox/i })).toHaveCount(0);
  const more = page.getByTestId("mobile-navigation-more");
  await expect(more).toBeVisible();
  await more.click();

  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute("role", "dialog");
  await expect(page.locator('[data-navigation-group="program"]')).toBeVisible();
  await expect(page.locator('[data-navigation-group="team"]')).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
