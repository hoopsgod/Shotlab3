import { test, expect } from "@playwright/test";
import { seededCoachDashboardState } from "../fixtures/coach-dashboard-phase2.mjs";

const DEMO_EVENT_ID = "coach-phase2-event";

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function enterSeededDemoCoach(page) {
  await page.addInitScript(({ seededState, eventId }) => {
    localStorage.clear();
    const now = new Date();
    const plusDays = (days) => {
      const next = new Date(now);
      next.setDate(next.getDate() + days);
      return next.toISOString().slice(0, 10);
    };
    const seed = JSON.parse(JSON.stringify(seededState));
    seed.events = seed.events.map((event, index) => ({
      ...event,
      id: index === 0 ? eventId : event.id,
      date: index === 0 ? plusDays(2) : event.date,
    }));
    for (const [key, value] of Object.entries(seed)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, { seededState: seededCoachDashboardState, eventId: DEMO_EVENT_ID });

  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openMoreDestination(page, key) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("player intelligence drawer summarizes development and hands off to the full profile", async ({ page }) => {
  await enterSeededDemoCoach(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();

  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  await roster.getByText("Active Player", { exact: true }).first().click();

  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Active Player", exact: true })).toBeVisible();
  await expect(drawer.getByText("Weekly makes", { exact: true }).first()).toBeVisible();
  await expect(drawer.getByText("Upcoming RSVPs", { exact: true }).first()).toBeVisible();
  await expect(drawer.getByText("S&C completion", { exact: true }).first()).toBeVisible();
  await expect(drawer.getByText("Activity timeline", { exact: true })).toBeVisible();

  await drawer.getByRole("button", { name: "Open Full Profile", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByTestId("coach-player-data-management")).toBeVisible({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);
});

test("event intelligence drawer identifies missing responses and returns to attendance management", async ({ page }) => {
  await enterSeededDemoCoach(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Schedule", exact: true }).click();

  const decisionBrief = page.getByTestId("coach-events-decision-brief");
  await expect(decisionBrief).toBeVisible({ timeout: 20_000 });
  await decisionBrief.getByRole("button", { name: "View Event", exact: true }).click();
  const drawer = page.getByTestId("coach-event-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(drawer.getByRole("heading", { name: "Team Practice", exact: true })).toBeVisible();
  await expect(drawer.getByText("Active Player", { exact: true })).toBeVisible();
  await expect(drawer.getByText("Quiet Player", { exact: true })).toBeVisible();
  await expect(drawer.getByRole("heading", { name: "Awaiting RSVP", exact: true })).toBeVisible();

  await drawer.getByRole("button", { name: "Manage Attendance", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.getByText("Team Practice", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("drills and strength dashboards support decision-ready filtering", async ({ page }) => {
  await enterSeededDemoCoach(page);

  await openMoreDestination(page, "drills");
  const drillPanel = page.getByTestId("coach-drills-operational-panel");
  await expect(drillPanel).toBeVisible({ timeout: 20_000 });
  const drillLibrary = page.getByTestId("coach-drills-library-management");
  await drillLibrary.locator("summary").click();
  const drillFilters = page.getByTestId("coach-drills-operational-filters");
  await drillFilters.getByRole("button", { name: /^Underused/ }).click();
  await expect(drillFilters.getByRole("button", { name: /^Underused/ })).toHaveAttribute("aria-pressed", "true");
  await drillFilters.getByRole("searchbox").fill("Corner");
  await expect(drillLibrary.getByText("Corner Threes", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await openMoreDestination(page, "sc");
  const strengthPanel = page.getByTestId("coach-strength-operational-panel");
  await expect(strengthPanel).toBeVisible({ timeout: 20_000 });
  const strengthFilters = page.getByTestId("coach-strength-operational-filters");
  await strengthFilters.getByRole("button", { name: /^Attention/ }).click();
  await expect(strengthFilters.getByRole("button", { name: /^Attention/ })).toHaveAttribute("aria-pressed", "true");
  await strengthFilters.getByRole("searchbox").fill("Quiet");
  await expect(strengthPanel.getByText("Quiet Player", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("leaderboards and activity intelligence keep ranking context and player drill-down", async ({ page }) => {
  await enterSeededDemoCoach(page);

  await openMoreDestination(page, "leaderboards");
  const leaderboardPanel = page.getByTestId("coach-leaderboard-operational-panel");
  await expect(leaderboardPanel).toBeVisible({ timeout: 20_000 });
  const leaderboardFilters = page.getByTestId("coach-leaderboard-operational-filters");
  await leaderboardFilters.getByRole("button", { name: /^This Week/ }).click();
  await expect(leaderboardFilters.getByRole("button", { name: /^This Week/ })).toHaveAttribute("aria-pressed", "true");
  await leaderboardFilters.getByRole("searchbox").fill("Active");
  await expect(leaderboardPanel.getByText("Active Player", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await openMoreDestination(page, "feed");
  const activityPanel = page.getByTestId("coach-activity-intelligence-panel");
  await expect(activityPanel).toBeVisible({ timeout: 20_000 });
  const activityFilters = page.getByTestId("coach-activity-intelligence-filters");
  await activityFilters.getByRole("button", { name: /^Players/ }).click();
  await expect(activityFilters.getByRole("button", { name: /^Players/ })).toHaveAttribute("aria-pressed", "true");
  await activityFilters.getByRole("searchbox").fill("Active");
  await expect(activityPanel.getByText("Active Player", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});