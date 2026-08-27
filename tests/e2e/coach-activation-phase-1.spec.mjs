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

  const teamHeader = page.getByTestId("mission-control-team-header");
  await teamHeader.getByRole("button", { name: "Customize Demo Titans team identity", exact: true }).click();

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
  await expect(inbox.getByText("Only current team actions appear here.", { exact: true })).toBeVisible();
  const currentActions = inbox.locator(".mcInboxList > button");
  await expect(currentActions.first()).toBeVisible();
  await expect(currentActions.first()).toContainText(/\S+/);

  await page.keyboard.press("Escape");
  await expect(inbox).toBeHidden();
  await expect(bell).toHaveAttribute("aria-expanded", "false");

  await bell.click();
  await expect(currentActions.first()).toBeVisible();
  await currentActions.first().click();
  await expect(inbox).toBeHidden();
  await expectNoHorizontalOverflow(page);
});
