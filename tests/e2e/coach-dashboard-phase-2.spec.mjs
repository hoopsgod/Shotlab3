import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-phase-two-e2e";
const COACH_EMAIL = "coach.demo@shotlab.app";
const dateOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const ACTIVE_DATE = dateOffset(0);
const PRIOR_ACTIVITY_DATE = dateOffset(-14);
const QUIET_ACTIVITY_DATE = dateOffset(-30);
const NEXT_EVENT_DATE = dateOffset(1);
const SECOND_EVENT_DATE = dateOffset(5);
const PAST_EVENT_DATE = dateOffset(-10);
const OVERDUE_SC_DATE = dateOffset(-2);
const UPCOMING_SC_DATE = dateOffset(2);

const ARCHIVE = {
  id: "archive-phase-two",
  teamId: TEAM_ID,
  seasonName: "2025-26",
  seasonStartDate: "2025-11-01",
  seasonEndDate: "2026-03-15",
  createdAt: "2026-03-20T12:00:00.000Z",
  archivedBy: { email: COACH_EMAIL, name: "Demo Coach", role: "coach" },
  summary: {
    rosterCount: 2,
    homeScoreCount: 4,
    shotLogCount: 3,
    eventCount: 2,
    eventRsvpCount: 3,
    scSessionCount: 1,
    scLogCount: 1,
    totalShotLogMakes: 70,
  },
  playerSeasonSummaries: [],
};

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Phase Two Test Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "PHASE2",
    createdAt: 1_750_000_000_000,
    branding: {
      name: "Phase Two Test Team",
      shortName: "P2",
      wordmark: "PHASE TWO TEST TEAM",
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
    { id: "coach-phase-two", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "active-player", playerId: "active-player", email: "active@example.com", name: "Active Player", role: "player", teamId: TEAM_ID },
    { id: "quiet-player", playerId: "quiet-player", email: "quiet@example.com", name: "Quiet Player", role: "player", teamId: TEAM_ID },
    { id: "new-player", playerId: "new-player", email: "new@example.com", name: "New Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "profile-active", userId: "active@example.com", email: "active@example.com", teamId: TEAM_ID, firstName: "Active", lastName: "Player" },
    { id: "profile-quiet", userId: "quiet@example.com", email: "quiet@example.com", teamId: TEAM_ID, firstName: "Quiet", lastName: "Player" },
    { id: "profile-new", userId: "new@example.com", email: "new@example.com", teamId: TEAM_ID, firstName: "New", lastName: "Player" },
  ],
  "sl:drills": [
    { id: "home-active", name: "Form Shooting", desc: "Daily form work", max: 50, icon: "ft" },
    { id: "home-unused", name: "Corner Threes", desc: "Corner volume", max: 40, icon: "3p" },
  ],
  "sl:program-drills": [
    { id: "program-active", name: "Program Finishing", desc: "Team finishing standard", max: 30, icon: "layup" },
  ],
  "sl:scores": [
    { id: "score-active-1", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, drillId: "home-active", score: 40, src: "home", date: ACTIVE_DATE },
    { id: "score-active-2", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, drillId: "home-active", score: 42, src: "home", date: ACTIVE_DATE },
    { id: "score-active-3", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, drillId: "home-active", score: 44, src: "home", date: ACTIVE_DATE },
    { id: "score-quiet", email: "quiet@example.com", name: "Quiet Player", teamId: TEAM_ID, drillId: "home-unused", score: 20, src: "home", date: PRIOR_ACTIVITY_DATE },
  ],
  "sl:program-scores": [
    { id: "program-score", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, drillId: "program-active", score: 25, src: "program", date: ACTIVE_DATE },
  ],
  "sl:shotlogs": [
    { id: "shot-active-current", playerId: "active-player", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, made: 85, attempted_shots: 120, date: ACTIVE_DATE, sessionId: "active-current" },
    { id: "shot-active-prior", playerId: "active-player", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, made: 25, attempted_shots: 50, date: PRIOR_ACTIVITY_DATE, sessionId: "active-prior" },
    { id: "shot-quiet", playerId: "quiet-player", email: "quiet@example.com", name: "Quiet Player", teamId: TEAM_ID, made: 20, attempted_shots: 50, date: QUIET_ACTIVITY_DATE, sessionId: "quiet-session" },
  ],
  "sl:events": [
    { id: "event-practice", teamId: TEAM_ID, title: "Team Practice", type: "run", date: NEXT_EVENT_DATE, time: "6:00 PM", location: "Main Gym", desc: "Team practice" },
    { id: "event-game", teamId: TEAM_ID, title: "Summer Game", type: "game", date: SECOND_EVENT_DATE, time: "7:00 PM", location: "Field House", desc: "Summer game" },
    { id: "event-past", teamId: TEAM_ID, title: "Film Review", type: "recovery", date: PAST_EVENT_DATE, time: "4:00 PM", location: "Team Room", desc: "Film" },
  ],
  "sl:rsvps": [
    { id: "rsvp-active", eventId: "event-practice", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, status: "yes" },
  ],
  "sl:sc-sessions": [
    { id: "sc-overdue", teamId: TEAM_ID, sport: "Team Lift", date: OVERDUE_SC_DATE, time: "8:00 AM", sessionType: "School" },
    { id: "sc-upcoming", teamId: TEAM_ID, sport: "Recovery Session", date: UPCOMING_SC_DATE, time: "9:00 AM", sessionType: "School" },
  ],
  "sl:sc-rsvps": [
    { id: "sc-rsvp-one", sessionId: "sc-overdue", email: "active@example.com", teamId: TEAM_ID },
    { id: "sc-rsvp-two", sessionId: "sc-overdue", email: "quiet@example.com", teamId: TEAM_ID },
  ],
  "sl:sc-logs": [
    { id: "sc-log-one", sessionId: "sc-overdue", email: "active@example.com", name: "Active Player", teamId: TEAM_ID, date: OVERDUE_SC_DATE },
  ],
  "sl:season-archives": [ARCHIVE],
};

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, archives: [ARCHIVE] }),
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

async function enterSeededDemoCoach(page) {
  await page.addInitScript((payload) => {
    if (window.sessionStorage.getItem("coach-phase-two-seeded") === "1") return;
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem("coach-phase-two-seeded", "1");
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: "Coach demo", exact: true }).click();
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
  await expect(drawer.getByText("Event readiness", { exact: true }).first()).toBeVisible();
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

  await page.getByRole("button", { name: "Manage Attendance", exact: true }).click();
  const drawer = page.getByTestId("coach-event-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(drawer.getByRole("heading", { name: "Team Practice", exact: true })).toBeVisible();
  await expect(drawer.getByText("Active Player", { exact: true })).toBeVisible();
  await expect(drawer.getByText("Quiet Player", { exact: true })).toBeVisible();
  await expect(drawer.getByText("Missing responses", { exact: true })).toBeVisible();

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
  const drillFilters = page.getByTestId("coach-drills-operational-filters");
  await drillFilters.getByRole("button", { name: /^Underused/ }).click();
  await expect(drillFilters.getByRole("button", { name: /^Underused/ })).toHaveAttribute("aria-pressed", "true");
  await drillFilters.getByRole("searchbox").fill("Corner");
  await expect(page.getByText("Corner Threes", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await openMoreDestination(page, "sc");
  const strengthPanel = page.getByTestId("coach-strength-operational-panel");
  await expect(strengthPanel).toBeVisible({ timeout: 20_000 });
  const strengthFilters = page.getByTestId("coach-strength-operational-filters");
  await strengthFilters.getByRole("button", { name: /^Overdue/ }).click();
  await expect(strengthFilters.getByRole("button", { name: /^Overdue/ })).toHaveAttribute("aria-pressed", "true");
  await strengthFilters.getByRole("searchbox").fill("Team Lift");
  const strengthRows = page.locator('[data-accent="sc"] .scSection');
  await expect(strengthRows.filter({ hasText: "Team Lift" })).toBeVisible();
  await expect(strengthRows.filter({ hasText: "Recovery Session" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("leaderboard, activity, and season comparison use the shared intelligence layer", async ({ page }) => {
  await enterSeededDemoCoach(page);

  await openMoreDestination(page, "leaderboards");
  const leaderboardPanel = page.getByTestId("coach-leaderboard-operational-panel");
  await expect(leaderboardPanel).toBeVisible({ timeout: 20_000 });
  const leaderboardFilters = page.getByTestId("coach-leaderboard-operational-filters");
  await leaderboardFilters.getByRole("button", { name: /^Most Improved/ }).click();
  await expect(leaderboardFilters.getByRole("button", { name: /^Most Improved/ })).toHaveAttribute("aria-pressed", "true");
  await expectNoHorizontalOverflow(page);

  await openMoreDestination(page, "activity");
  await expect(page.getByTestId("coach-page-dashboard-activity")).toBeVisible({ timeout: 20_000 });
  const activityPanel = page.getByTestId("coach-activity-intelligence-panel");
  await expect(activityPanel).toBeVisible({ timeout: 20_000 });
  const activityFilters = page.getByTestId("coach-activity-intelligence-filters");
  await activityFilters.getByRole("button", { name: /^Drill Scores/ }).click();
  await activityFilters.getByRole("searchbox").fill("Active Player");
  const activityResults = page.getByTestId("coach-activity-intelligence-results");
  await expect(activityResults.getByText("Active Player", { exact: true }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
  const comparison = page.getByTestId("coach-season-comparison-panel");
  await comparison.scrollIntoViewIfNeeded();
  await expect(comparison).toBeVisible({ timeout: 20_000 });
  await expect(comparison.locator("select")).toHaveValue("archive-phase-two");
  await expectNoHorizontalOverflow(page);
});