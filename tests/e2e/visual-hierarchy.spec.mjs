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
  await expect(locator.locator(":scope > div")).toHaveCount(3);
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

test("coach mobile home is compact and Events becomes a clean standalone schedule page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");

  const identityHeader = page.getByTestId("coach-dashboard-identity-header");
  const commandCenter = page.getByTestId("coach-command-center-full");
  const objective = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  const secondaryTools = page.getByTestId("coach-secondary-tools");
  const practice = page.getByTestId("coach-today-practice");
  const standings = page.getByTestId("coach-team-standings");

  await expect(identityHeader).toBeVisible({ timeout: 20_000 });
  await expect(commandCenter).toBeVisible();
  await expect(objective).toBeVisible();
  await expectThreeMetrics(metrics);
  await expect(secondaryTools).toBeVisible();
  await expect(practice).toBeVisible();
  await expect(standings).toBeVisible();
  expect(await standings.evaluate((element) => element.open)).toBe(false);

  const commandBox = await commandCenter.boundingBox();
  const practiceBox = await practice.boundingBox();
  const standingsBox = await standings.boundingBox();
  expect(commandBox).not.toBeNull();
  expect(practiceBox).not.toBeNull();
  expect(standingsBox).not.toBeNull();
  expect(commandBox.height).toBeLessThan(340);
  expect(standingsBox.height).toBeLessThan(72);
  expect(practiceBox.y).toBeLessThan(standingsBox.y);
  await expectNoHorizontalOverflow(page);

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Events", exact: true }).click();

  const eventsPage = page.getByTestId("coach-events-mobile-page");
  const eventsHeader = page.getByTestId("coach-events-mobile-header");
  const emptyState = page.getByTestId("coach-events-mobile-empty-state");
  const createEvent = page.getByTestId("coach-events-mobile-create-event");

  await expect(eventsPage).toBeVisible({ timeout: 20_000 });
  await expect(eventsHeader).toBeVisible();
  await expect(emptyState).toBeVisible();
  await expect(createEvent).toBeVisible();
  await expect(page.getByTestId("coach-dashboard-identity-header")).toHaveCount(0);
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
  expect(createBox.width).toBeLessThan(260);
  expect(createBox.y).toBeGreaterThan(headerBox.y + headerBox.height);
  expect(emptyBox.width).toBeLessThanOrEqual(390);
  await expectNoHorizontalOverflow(page);
});
