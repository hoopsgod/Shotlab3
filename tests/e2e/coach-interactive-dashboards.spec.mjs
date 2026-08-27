import { mkdir } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { enterSeededRegisteredCoach } from "./registered-coach-fixture.mjs";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-dashboard-e2e";
const COACH_EMAIL = "dashboard.coach@shotlab.test";
const SCREENSHOT_DIR = "artifacts/coach-events-mobile";
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
    { id: "coach-dashboard", email: COACH_EMAIL, name: "Dashboard Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
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

async function waitForSeedAuthority(page, payload) {
  const seededTeam = payload["sl:teams"]?.[0];
  const seededPlayer = payload["sl:players"]?.find((player) => player?.role === "player");
  await expect.poll(() => page.evaluate(({ teamId, teamName, coachEmail, playerEmail }) => {
    const parse = (key) => {
      try { return JSON.parse(window.localStorage.getItem(key) || "[]"); }
      catch { return []; }
    };
    const teams = parse("sl:teams");
    const players = parse("sl:players");
    const profiles = parse("sl:player-profiles");
    const drills = parse("sl:drills");
    const programDrills = parse("sl:program-drills");
    return drills.length > 0
      && programDrills.length > 0
      && teams.some((team) => team?.id === teamId && team?.name === teamName)
      && players.some((player) => player?.email === coachEmail && player?.teamId === teamId)
      && (!playerEmail || players.some((player) => player?.email === playerEmail && player?.teamId === teamId))
      && (!playerEmail || profiles.some((profile) => (profile?.userId === playerEmail || profile?.email === playerEmail) && profile?.teamId === teamId));
  }, {
    teamId: seededTeam?.id,
    teamName: seededTeam?.name,
    coachEmail: COACH_EMAIL,
    playerEmail: seededPlayer?.email || null,
  }), { timeout: 20_000 }).toBe(true);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function enterSeededCoach(page, payload = seedData) {
  await enterSeededRegisteredCoach(page, {
    storage: payload,
    coachEmail: COACH_EMAIL,
    coachName: "Dashboard Coach",
    teamId: TEAM_ID,
    path: "/?bootDebug=1",
  });
  const bootPanel = page.locator('[aria-label="ShotLab boot debug"]');
  if (await bootPanel.isVisible().catch(() => false)) await bootPanel.evaluate((element) => element.remove());
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await waitForSeedAuthority(page, payload);
}

async function openSchedule(page) {
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(page.getByTestId("coach-events-command-bar")).toBeVisible({ timeout: 20_000 });
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

async function currentPerformanceRail(page) {
  const stage = page.locator('[data-visual-role="primary-decision"]:visible').first();
  await expect(stage).toBeVisible({ timeout: 20_000 });
  const rail = stage.locator('[data-visual-role="performance-evidence"]');
  await expect(rail).toBeVisible();
  return rail;
}

async function captureEventsPage(page, name) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("Coach Players behaves as an interactive operational dashboard", async ({ page }) => {
  await enterSeededCoach(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();

  const rosterResults = page.locator("#coach-roster-operations");
  await expect(page.getByTestId("coach-players-command-bar")).toBeVisible({ timeout: 20_000 });
  const playerFilterRail = page.getByTestId("coach-players-filter-rail");
  await expect(playerFilterRail).toBeVisible();
  await expect(rosterResults.getByText("Active Player", { exact: true }).first()).toBeVisible();
  await expect(rosterResults.getByText("Quiet Player", { exact: true }).first()).toBeVisible();

  const needsAttention = playerFilterRail.getByRole("button", { name: /^Attention/i });
  await needsAttention.click();
  await expect(needsAttention).toHaveAttribute("aria-pressed", "true");
  await expect(rosterResults.getByText("Active Player", { exact: true })).toHaveCount(0);
  await expect(rosterResults.getByText("Quiet Player", { exact: true }).first()).toBeVisible();
  await expect(rosterResults.getByText("New Player", { exact: true }).first()).toBeVisible();

  const search = playerFilterRail.getByRole("searchbox");
  await search.fill("Quiet");
  await expect(rosterResults.getByText("Quiet Player", { exact: true }).first()).toBeVisible();
  await expect(rosterResults.getByText("New Player", { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("Coach Events exposes one premium schedule hierarchy, creation entry point, RSVP gaps, and searchable controls", async ({ page }) => {
  await enterSeededCoach(page);
  await openSchedule(page);

  const scheduleResults = page.getByTestId("coach-events-mobile-page");
  const commandBar = page.getByTestId("coach-events-command-bar");
  const calendar = page.getByTestId("coach-events-month-calendar");
  const decisionBrief = page.getByTestId("coach-events-decision-brief");
  const performanceRail = await currentPerformanceRail(page);
  await expect(page.getByTestId("coach-events-filter-rail")).toBeVisible();
  await expect(commandBar.getByText("SCHEDULE", { exact: true })).toBeVisible();
  await expect(commandBar.getByRole("heading", { name: "Events", exact: true })).toBeVisible();
  await expect(calendar).toBeVisible();
  await expect(calendar.getByTestId("coach-events-calendar-month")).toBeVisible();
  await expect(decisionBrief.getByText("NEXT TEAM MOMENT", { exact: true })).toBeVisible();
  await expect(scheduleResults.getByText("Team Practice", { exact: true }).first()).toBeVisible();
  await expect(performanceRail.getByRole("button")).toHaveCount(3);
  const hierarchy = await page.evaluate(() => {
    const intro = document.querySelector('[data-testid="coach-events-command-bar"]')?.getBoundingClientRect();
    const month = document.querySelector('[data-testid="coach-events-month-calendar"]')?.getBoundingClientRect();
    const decision = document.querySelector('[data-testid="coach-events-decision-brief"]')?.getBoundingClientRect();
    return { introBottom: intro?.bottom || 0, monthTop: month?.top || 0, monthBottom: month?.bottom || 0, decisionTop: decision?.top || 0 };
  });
  expect(hierarchy.monthTop).toBeGreaterThanOrEqual(hierarchy.introBottom - 2);
  expect(hierarchy.decisionTop).toBeGreaterThanOrEqual(hierarchy.monthBottom - 2);
  await expectNoHorizontalOverflow(page);
  await captureEventsPage(page, "events-populated-390");

  const createEvent = commandBar.getByRole("button", { name: /Create Event/i });
  await expect(createEvent).toHaveCount(1);
  await createEvent.click();
  const createDialog = page.getByRole("dialog", { name: "Create event" });
  await expect(createDialog).toBeVisible();
  await expect(createDialog.getByText("CREATE EVENT", { exact: true })).toBeVisible();
  await expect(createDialog.getByPlaceholder("Open Gym Run")).toBeVisible();
  await createDialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(createDialog).toHaveCount(0);

  const awaitingRsvp = performanceRail.getByRole("button", { name: /^Awaiting RSVP:/i });
  await awaitingRsvp.click();
  await expect(awaitingRsvp).toHaveAttribute("aria-pressed", "true");

  const search = page.getByTestId("coach-events-filter-rail").getByRole("searchbox");
  await search.fill("Summer Game");
  await expect(scheduleResults.getByText("Summer Game", { exact: true }).first()).toBeVisible();
  await expect(scheduleResults.getByText("Team Practice", { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("Coach Events keeps the zero-event mobile page short and overflow-safe on narrow iPhone widths", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const emptyScheduleSeed = { ...seedData, "sl:events": [], "sl:rsvps": [] };
  await enterSeededCoach(page, emptyScheduleSeed);
  await openSchedule(page);

  const commandBar = page.getByTestId("coach-events-command-bar");
  const calendar = page.getByTestId("coach-events-month-calendar");
  const decisionBrief = page.getByTestId("coach-events-decision-brief");
  await expect(calendar).toBeVisible();
  await expect(calendar.getByTestId("coach-events-calendar-month")).toBeVisible();
  await expect(calendar.locator(".coachEventsCalendar__eventMarks")).toHaveCount(0);
  await expect(decisionBrief.getByText("Calendar is open", { exact: true })).toBeVisible();
  await expect(commandBar.getByRole("button", { name: /Create Event/i })).toHaveCount(1);
  await expect(page.getByText("OPEN SCHEDULE SLOT", { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await captureEventsPage(page, "events-empty-375");

  await page.setViewportSize({ width: 320, height: 740 });
  await expect(commandBar).toBeVisible();
  await expect(calendar).toBeVisible();
  await expect(decisionBrief).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("Coach Inbox routes the next-event RSVP risk into exact attendance management", async ({ page }) => {
  await enterSeededCoach(page);

  const bell = page.getByRole("button", { name: /Open Coach Inbox/i });
  await expect(bell).toBeVisible({ timeout: 20_000 });
  await bell.click();

  const inbox = page.getByRole("dialog", { name: "Coach Inbox" });
  const readiness = inbox.getByRole("button", { name: /Event readiness Team Practice/i });
  await expect(readiness).toContainText("2 of 3 players still need to RSVP.");
  await expect(readiness).toContainText("33% responded");
  await readiness.click();

  const eventDrawer = page.getByTestId("coach-event-intelligence-drawer");
  await expect(eventDrawer).toBeVisible();
  await expect(eventDrawer.getByText("Team Practice", { exact: true })).toBeVisible();
  await expect(eventDrawer.getByRole("heading", { name: "Awaiting RSVP", exact: true })).toBeVisible();
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
  await enterSeededCoach(page);

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
  await enterSeededCoach(page);

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