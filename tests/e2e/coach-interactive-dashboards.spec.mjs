import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-dashboard-e2e";
const COACH_EMAIL = "coach.demo@shotlab.app";
const dateOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const ACTIVE_DATE = dateOffset(0);
const QUIET_ACTIVITY_DATE = dateOffset(-30);
const NEXT_EVENT_DATE = dateOffset(1);
const SECOND_EVENT_DATE = dateOffset(5);
const PAST_EVENT_DATE = dateOffset(-10);
const UPCOMING_SC_DATE = dateOffset(2);

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Dashboard Test Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "DASH26",
    createdAt: 1_750_000_000_000,
    branding: {
      name: "Dashboard Test Team",
      shortName: "DTT",
      wordmark: "DASHBOARD TEST TEAM",
      primaryColor: "#C8FF1A",
      secondaryColor: "#77D7FF",
      accentColor: "#C8FF1A",
      textOnPrimary: "#071007",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
      logoMarkUrl: "/branding/titans-default-mark.svg",
      textScale: "standard",
      version: 1,
    },
  }],
  "sl:players": [
    { id: "coach-dashboard", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "active-player", playerId: "active-player", email: "active@example.com", name: "Active Player", role: "player", teamId: TEAM_ID },
    { id: "quiet-player", playerId: "quiet-player", email: "quiet@example.com", name: "Quiet Player", role: "player", teamId: TEAM_ID },
    { id: "new-player", playerId: "new-player", email: "new@example.com", name: "New Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "profile-active", userId: "active@example.com", email: "active@example.com", teamId: TEAM_ID, firstName: "Active", lastName: "Player" },
    { id: "profile-quiet", userId: "quiet@example.com", email: "quiet@example.com", teamId: TEAM_ID, firstName: "Quiet", lastName: "Player" },
    { id: "profile-new", userId: "new@example.com", email: "new@example.com", teamId: TEAM_ID, firstName: "New", lastName: "Player" },
  ],
  "sl:scores": [
    { id: "score-active", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, drillId: "demo-home-form-shooting", score: 40, src: "home", date: ACTIVE_DATE },
    { id: "score-quiet", email: "quiet@example.com", name: "Quiet Player", teamId: TEAM_ID, drillId: "demo-home-form-shooting", score: 20, src: "home", date: QUIET_ACTIVITY_DATE },
  ],
  "sl:program-scores": [],
  "sl:shotlogs": [
    { id: "shot-active", playerId: "active-player", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, made: 85, attempted_shots: 120, date: ACTIVE_DATE, sessionId: "active-session" },
    { id: "shot-quiet", playerId: "quiet-player", email: "quiet@example.com", name: "Quiet Player", teamId: TEAM_ID, made: 25, attempted_shots: 50, date: QUIET_ACTIVITY_DATE, sessionId: "quiet-session" },
  ],
  "sl:events": [
    { id: "event-practice", teamId: TEAM_ID, title: "Team Practice", type: "run", date: NEXT_EVENT_DATE, time: "6:00 PM", location: "Main Gym", desc: "Team practice" },
    { id: "event-game", teamId: TEAM_ID, title: "Summer Game", type: "game", date: SECOND_EVENT_DATE, time: "7:00 PM", location: "Field House", desc: "Summer game" },
    { id: "event-past", teamId: TEAM_ID, title: "Film Review", type: "recovery", date: PAST_EVENT_DATE, time: "4:00 PM", location: "Team Room", desc: "Film" },
  ],
  "sl:rsvps": [
    { id: "rsvp-active", eventId: "event-practice", email: "active@example.com", name: "Active Player", teamId: TEAM_ID },
  ],
  "sl:sc-sessions": [{ id: "sc-one", teamId: TEAM_ID, sport: "Team Lift", date: UPCOMING_SC_DATE, time: "8:00 AM", sessionType: "School" }],
  "sl:sc-rsvps": [{ id: "sc-rsvp", sessionId: "sc-one", email: "active@example.com", teamId: TEAM_ID }],
  "sl:sc-logs": [{ id: "sc-log", sessionId: "sc-one", email: "active@example.com", teamId: TEAM_ID, date: ACTIVE_DATE }],
  "sl:season-archives": [],
};

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterSeededDemoCoach(page) {
  await page.addInitScript((payload) => {
    if (window.sessionStorage.getItem("coach-dashboard-e2e-seeded") === "1") return;
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem("coach-dashboard-e2e-seeded", "1");
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openMoreDestination(page, key) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(sheet).toHaveCount(0);
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

test("Coach Players behaves as an interactive operational dashboard", async ({ page }) => {
  await enterSeededDemoCoach(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();

  const rosterResults = page.locator("#coach-roster-operations");
  await expect(page.getByTestId("coach-players-command-bar")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-players-metric-strip")).toBeVisible();
  await expect(page.getByTestId("coach-players-filter-rail")).toBeVisible();
  await expect(rosterResults.getByText("Active Player", { exact: true }).first()).toBeVisible();
  await expect(rosterResults.getByText("Quiet Player", { exact: true }).first()).toBeVisible();

  await page.getByTestId("coach-players-metric-strip").getByRole("button", { name: /Needs Attention/i }).click();
  await expect(page.getByTestId("coach-players-metric-strip").getByRole("button", { name: /Needs Attention/i })).toHaveAttribute("aria-pressed", "true");
  await expect(rosterResults.getByText("Active Player", { exact: true })).toHaveCount(0);
  await expect(rosterResults.getByText("Quiet Player", { exact: true }).first()).toBeVisible();
  await expect(rosterResults.getByText("New Player", { exact: true }).first()).toBeVisible();

  const search = page.getByTestId("coach-players-filter-rail").getByRole("searchbox");
  await search.fill("Quiet");
  await expect(rosterResults.getByText("Quiet Player", { exact: true }).first()).toBeVisible();
  await expect(rosterResults.getByText("New Player", { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("Coach Events exposes RSVP gaps and searchable schedule controls", async ({ page }) => {
  await enterSeededDemoCoach(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Events", exact: true }).click();

  const scheduleResults = page.getByTestId("coach-events-mobile-page");
  await expect(page.getByTestId("coach-events-command-bar")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-events-metric-strip")).toBeVisible();
  await expect(page.getByTestId("coach-events-filter-rail")).toBeVisible();
  await expect(scheduleResults.getByText("Team Practice", { exact: true }).first()).toBeVisible();

  await page.getByTestId("coach-events-metric-strip").getByRole("button", { name: /Missing RSVPs/i }).click();
  await expect(page.getByTestId("coach-events-metric-strip").getByRole("button", { name: /Missing RSVPs/i })).toHaveAttribute("aria-pressed", "true");

  const search = page.getByTestId("coach-events-filter-rail").getByRole("searchbox");
  await search.fill("Summer Game");
  await expect(scheduleResults.getByText("Summer Game", { exact: true }).first()).toBeVisible();
  await expect(scheduleResults.getByText("Team Practice", { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("Coach Inbox routes the next-event RSVP risk into exact attendance management", async ({ page }) => {
  await enterSeededDemoCoach(page);

  const bell = page.getByRole("button", { name: /Open Coach Inbox/i });
  await expect(bell).toBeVisible({ timeout: 20_000 });
  await bell.click();

  const inbox = page.getByRole("dialog", { name: "Coach Inbox" });
  const readiness = inbox.getByRole("button", { name: /Event readiness Team Practice/i });
  await expect(readiness).toContainText("3 of 4 players still need to RSVP.");
  await expect(readiness).toContainText("25% confirmed");
  await readiness.click();

  const eventDrawer = page.getByTestId("coach-event-intelligence-drawer");
  await expect(eventDrawer).toBeVisible();
  await expect(eventDrawer.getByText("Team Practice", { exact: true })).toBeVisible();
  await expect(eventDrawer.getByText("Missing responses", { exact: true })).toBeVisible();
  await eventDrawer.getByRole("button", { name: "Manage Attendance", exact: true }).click();

  const eventsPage = page.getByTestId("coach-events-mobile-page");
  await expect(eventsPage).toBeVisible();
  const expandedPractice = eventsPage
    .locator("article")
    .filter({ hasText: "Team Practice" })
    .filter({ hasText: "Active Player" });
  await expect(expandedPractice).toHaveCount(1);
  await expect(expandedPractice.getByText("1 confirmed", { exact: true })).toBeVisible();
  await expect(expandedPractice.getByText("Active Player", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("remaining coach pages inherit the reusable dashboard control layer", async ({ page }) => {
  await enterSeededDemoCoach(page);

  await openMoreDestination(page, "drills");
  await expect(page.getByTestId("coach-page-dashboard-drills")).toBeVisible({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);

  await openMoreDestination(page, "sc");
  await expect(page.getByTestId("coach-page-dashboard-strength")).toBeVisible({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);

  await openMoreDestination(page, "leaderboards");
  await expect(page.getByTestId("coach-page-dashboard-leaderboards")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const navButtons = page.getByTestId("mobile-navigation-dock").getByRole("button");
  for (let index = 0; index < await navButtons.count(); index += 1) {
    const box = await navButtons.nth(index).boundingBox();
    expect(box?.height || 0).toBeGreaterThanOrEqual(44);
  }
});

test("Mission Control Analytics opens rankings instead of duplicating Players", async ({ page }) => {
  await enterSeededDemoCoach(page);

  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  const drawer = page.locator(".mcMobileDrawer");
  await expect(drawer).toBeVisible();
  await drawer.getByRole("button", { name: "Analytics", exact: true }).click();

  await expect(page.getByTestId("coach-page-dashboard-leaderboards")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible();
  await expect(page.getByTestId("leaderboard-time-scope-current")).toBeVisible();
  await expect(page.getByTestId("leaderboard-time-scope-all_time")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Players Dashboard", exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
