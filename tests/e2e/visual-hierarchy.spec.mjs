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
  const button = page.getByRole("button", {
    name: role === "coach" ? "Coach demo" : "Player demo",
    exact: true,
  });
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

function visibleCreateEventButton(page) {
  return page.getByRole("button", { name: "Create Event", exact: true });
}

function futureDateInput(daysAhead = 7) {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
  await startClean(page);
});

test("player mobile home presents performance, interpretation, momentum, and one dominant action", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "player");

  const commandCenter = page.getByTestId("player-daily-command-center");
  const todayPerformance = page.getByTestId("player-today-performance");
  const interpretation = page.getByTestId("player-target-interpretation");
  const momentum = page.getByTestId("player-command-evidence");
  const primaryAction = page.getByTestId("player-daily-primary-action");
  const schedule = page.getByTestId("player-upcoming-schedule");
  const standings = page.getByTestId("player-team-standings");
  const guidance = page.getByTestId("player-coach-guidance");
  const secondary = page.getByTestId("player-secondary-intelligence");

  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(todayPerformance).toBeVisible();
  await expect(interpretation).toBeVisible();
  await expect(momentum).toBeVisible();
  await expect(momentum.locator(":scope > *")).toHaveCount(2);
  await expect(primaryAction).toBeVisible();
  await expect(page.getByTestId("player-daily-progress-ring")).toBeVisible();
  await expect(page.getByTestId("player-daily-primary-action")).toHaveCount(1);

  for (const disclosure of [schedule, standings, guidance, secondary]) {
    await expect(disclosure).toBeVisible();
    expect(await disclosure.evaluate((element) => element.open)).toBe(false);
  }

  const commandCenterBox = await commandCenter.boundingBox();
  const todayBox = await todayPerformance.boundingBox();
  const momentumBox = await momentum.boundingBox();
  const primaryActionBox = await primaryAction.boundingBox();
  const scheduleBox = await schedule.boundingBox();
  expect(commandCenterBox).not.toBeNull();
  expect(todayBox).not.toBeNull();
  expect(momentumBox).not.toBeNull();
  expect(primaryActionBox).not.toBeNull();
  expect(scheduleBox).not.toBeNull();
  expect(todayBox.y).toBeGreaterThanOrEqual(commandCenterBox.y);
  expect(momentumBox.y).toBeGreaterThan(todayBox.y);
  expect(primaryActionBox.y).toBeGreaterThan(momentumBox.y);
  expect(commandCenterBox.y).toBeLessThan(scheduleBox.y);
  expect(primaryActionBox.y).toBeLessThan(844);

  const progressDisclosure = page.getByTestId("player-progress-disclosure");
  if (!(await progressDisclosure.evaluate((element) => element.open))) await progressDisclosure.locator("summary").click();
  const momentumSignal = page.getByTestId("player-daily-momentum-signal");
  await expect(momentumSignal).toBeVisible();
  const signalColors = await momentumSignal.evaluate((node) => {
    return [...node.querySelectorAll('[class*="signalEyebrow"],[class*="signalTitle"],[class*="signalDetail"]')]
      .filter((element) => element.textContent?.trim())
      .map((element) => getComputedStyle(element).color);
  });
  expect(signalColors.length).toBeGreaterThanOrEqual(2);
  for (const signalColor of signalColors) {
    expect(signalColor).not.toBe("rgb(245, 242, 234)");
    expect(signalColor).not.toBe("rgb(245, 248, 249)");
  }

  await schedule.locator("summary").click();
  expect(await schedule.evaluate((element) => element.open)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("coach mobile home presents populated decision intelligence and a current Schedule", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");

  const commandCenter = page.getByTestId("coach-command-center-full");
  const objective = page.getByTestId("coach-primary-objective");
  const objectiveContent = objective.locator(".mcHeroContent");
  const metrics = page.getByTestId("coach-primary-metrics");
  const needsAttention = page.getByRole("heading", { name: "Needs attention", exact: true });

  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(objective).toBeVisible();
  await expect(objectiveContent).toBeVisible();
  await expectThreeMetrics(metrics);
  await expect(needsAttention).toBeVisible();
  await expect(page.getByTestId("coach-dashboard-identity-header")).not.toBeVisible();
  await expect(page.locator(".coach-home-dashboard")).not.toBeVisible();

  const shellBox = await commandCenter.boundingBox();
  const objectiveBox = await objective.boundingBox();
  const objectiveContentBox = await objectiveContent.boundingBox();
  const attentionBox = await needsAttention.boundingBox();
  expect(shellBox).not.toBeNull();
  expect(objectiveBox).not.toBeNull();
  expect(objectiveContentBox).not.toBeNull();
  expect(attentionBox).not.toBeNull();
  expect(shellBox.x).toBeLessThanOrEqual(1);
  expect(shellBox.width).toBeGreaterThanOrEqual(388);
  const stageLeftGap = objectiveBox.x;
  const stageRightGap = 390 - (objectiveBox.x + objectiveBox.width);
  expect(Math.abs(stageLeftGap)).toBeLessThanOrEqual(1);
  expect(Math.abs(stageRightGap)).toBeLessThanOrEqual(1);
  const contentLeftGutter = objectiveContentBox.x - objectiveBox.x;
  const contentRightGutter = objectiveBox.x + objectiveBox.width - (objectiveContentBox.x + objectiveContentBox.width);
  expect(contentLeftGutter).toBeGreaterThanOrEqual(20);
  expect(contentRightGutter).toBeGreaterThanOrEqual(20);
  expect(objectiveBox.height).toBeLessThan(520);
  expect(attentionBox.y).toBeLessThan(844);
  await expectNoHorizontalOverflow(page);

  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  await dock.getByRole("button", { name: "Schedule", exact: true }).click();

  const eventsPage = page.getByTestId("coach-events-mobile-page");
  const eventsHeader = page.getByTestId("coach-events-command-bar");
  const createEvent = visibleCreateEventButton(page);

  await expect(eventsPage).toBeVisible({ timeout: 20_000 });
  await expect(eventsHeader).toBeVisible();
  await expect(eventsPage.getByText("Team Practice", { exact: true }).first()).toBeVisible();
  await expect(page.getByTestId("coach-events-mobile-empty-state")).toHaveCount(0);
  await expect(createEvent).toBeVisible();
  await expect(page.getByTestId("coach-command-center-full")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Log out", exact: true })).not.toBeVisible();

  expect(await eventsPage.evaluate((node) => node.closest(".accent-card") !== null)).toBe(false);
  const headerBox = await eventsHeader.boundingBox();
  const createBox = await createEvent.boundingBox();
  expect(headerBox).not.toBeNull();
  expect(createBox).not.toBeNull();
  expect(headerBox.y).toBeLessThan(150);
  expect(createBox.y).toBeGreaterThanOrEqual(headerBox.y);
  await expectNoHorizontalOverflow(page);
});

test("coach can create and revisit a mobile event without breaking navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Schedule", exact: true }).click();
  const eventsPage = page.getByTestId("coach-events-mobile-page");
  let createEvent = visibleCreateEventButton(page);
  await expect(createEvent).toBeVisible({ timeout: 20_000 });

  await createEvent.click();
  const dialog = page.getByRole("dialog", { name: "Create event" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  createEvent = visibleCreateEventButton(page);
  await createEvent.click();
  const reopenedDialog = page.getByRole("dialog", { name: "Create event" });
  await reopenedDialog.getByPlaceholder("Open Gym Run").fill("E2E Team Practice");
  await reopenedDialog.locator('input[type="date"]').fill(futureDateInput());
  await reopenedDialog.getByPlaceholder("6:00 PM").fill("6:30 PM");
  await reopenedDialog.getByPlaceholder("Main Gym — Court 1").fill("Thomas Gym");
  await reopenedDialog.getByRole("button", { name: "SAVE EVENT", exact: true }).click();

  await expect(reopenedDialog).toHaveCount(0);
  await expect(eventsPage.getByText("E2E Team Practice", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(eventsPage.getByText("6:30 PM · Thomas Gym", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await dock.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible();
  await dock.getByRole("button", { name: "Players", exact: true }).click();
  await expect(page.getByTestId("coach-players-command-bar")).toBeVisible();
  await dock.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(page.getByTestId("coach-events-mobile-page").getByText("E2E Team Practice", { exact: true })).toBeVisible();
  await dock.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toBeVisible();
});
