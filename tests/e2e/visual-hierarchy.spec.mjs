import { test, expect } from "@playwright/test";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function startClean(page) {
  await page.addInitScript(() => window.localStorage.clear());
}

async function enterDemo(page, role) {
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? "Demo Coach" : "Demo Player", exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectThreeMetrics(locator) {
  await expect(locator).toBeVisible();
  await expect(locator.locator(":scope > *")).toHaveCount(3);
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
  await startClean(page);
});

test("player mobile home prioritizes one mission, three metrics, and collapsed support", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "player");

  const objective = page.getByTestId("player-primary-objective");
  const metrics = page.getByTestId("player-primary-metrics");
  const schedule = page.getByTestId("player-upcoming-schedule");
  const standings = page.getByTestId("player-team-standings");
  const guidance = page.getByTestId("player-coach-guidance");
  const secondary = page.getByTestId("player-secondary-intelligence");

  await expect(objective).toBeVisible({ timeout: 20_000 });
  await expectThreeMetrics(metrics);
  for (const disclosure of [schedule, standings, guidance, secondary]) {
    await expect(disclosure).toBeVisible();
    expect(await disclosure.evaluate((element) => element.open)).toBe(false);
  }

  const objectiveBox = await objective.boundingBox();
  const metricBox = await metrics.boundingBox();
  const scheduleBox = await schedule.boundingBox();
  expect(objectiveBox).not.toBeNull();
  expect(metricBox).not.toBeNull();
  expect(scheduleBox).not.toBeNull();
  expect(objectiveBox.y).toBeLessThan(metricBox.y);
  expect(metricBox.y).toBeLessThan(scheduleBox.y);
  expect(metricBox.y).toBeLessThan(844);

  await schedule.locator("summary").click();
  expect(await schedule.evaluate((element) => element.open)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("coach mobile home answers the 30-second workflow and Events remains a standalone schedule page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");

  const commandCenter = page.getByTestId("coach-command-center-full");
  const objective = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  const needsAttention = page.getByRole("heading", { name: "Needs attention", exact: true });
  const teamActivity = page.getByRole("heading", { name: "Team activity", exact: true });
  const nextSession = page.getByRole("heading", { name: "Next session", exact: true });

  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(objective).toBeVisible();
  await expectThreeMetrics(metrics);
  await expect(needsAttention).toBeVisible();
  await expect(teamActivity).toBeVisible();
  await expect(nextSession).toBeVisible();
  await expect(page.getByTestId("coach-dashboard-identity-header")).toHaveCount(0);
  await expect(page.locator(".coach-home-dashboard")).not.toBeVisible();

  const objectiveBox = await objective.boundingBox();
  const attentionBox = await needsAttention.boundingBox();
  expect(objectiveBox).not.toBeNull();
  expect(attentionBox).not.toBeNull();
  expect(objectiveBox.height).toBeLessThan(430);
  expect(attentionBox.y).toBeLessThan(844);
  await expectNoHorizontalOverflow(page);

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  await dock.getByRole("button", { name: "Events", exact: true }).click();

  const eventsPage = page.getByTestId("coach-events-mobile-page");
  const eventsHeader = page.getByTestId("coach-events-mobile-header");
  const emptyState = page.getByTestId("coach-events-mobile-empty-state");
  const createEvent = page.getByTestId("coach-events-mobile-create-event");

  await expect(eventsPage).toBeVisible({ timeout: 20_000 });
  await expect(eventsHeader).toBeVisible();
  await expect(emptyState).toBeVisible();
  await expect(createEvent).toBeVisible();
  await expect(page.getByTestId("coach-command-center-full")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out", exact: true })).not.toBeVisible();

  expect(await eventsPage.evaluate((node) => node.closest(".accent-card") !== null)).toBe(false);
  const headerBox = await eventsHeader.boundingBox();
  const emptyBox = await emptyState.boundingBox();
  const createBox = await createEvent.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(emptyBox).not.toBeNull();
  expect(createBox).not.toBeNull();
  expect(headerBox.y).toBeLessThan(150);
  expect(createBox.width).toBeLessThan(390 * 0.8);
  expect(createBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
  expect(emptyBox.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalOverflow(page);
});

test("coach can open, close, save, and revisit a mobile event without breaking navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Events", exact: true }).click();
  const createEvent = page.getByTestId("coach-events-mobile-create-event");
  await expect(createEvent).toBeVisible({ timeout: 20_000 });

  await createEvent.click();
  const dialog = page.getByRole("dialog", { name: "Create event" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByTestId("coach-events-mobile-create-event").click();
  const reopenedDialog = page.getByRole("dialog", { name: "Create event" });
  await reopenedDialog.getByPlaceholder("Open Gym Run").fill("E2E Team Practice");
  await reopenedDialog.locator('input[type="date"]').fill("2026-08-15");
  await reopenedDialog.getByPlaceholder("6:00 PM").fill("6:30 PM");
  await reopenedDialog.getByPlaceholder("Main Gym — Court 1").fill("Thomas Gym");
  await reopenedDialog.getByRole("button", { name: "SAVE EVENT", exact: true }).click();

  await expect(reopenedDialog).toHaveCount(0);
  await expect(page.getByText("E2E Team Practice", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("6:30 PM · Thomas Gym", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await dock.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible();
  await dock.getByRole("button", { name: "Players", exact: true }).click();
  await expect(page.getByText("PLAYERS", { exact: true }).first()).toBeVisible();
  await dock.getByRole("button", { name: "Events", exact: true }).click();
  await expect(page.getByText("E2E Team Practice", { exact: true })).toBeVisible();
  await dock.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /More/i })).toBeVisible();
});
