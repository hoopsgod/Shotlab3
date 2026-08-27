import { test, expect } from "@playwright/test";
import { enterSeededRegisteredPlayer } from "./registered-coach-fixture.mjs";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-player-phase-two";
const PLAYER_EMAIL = "player.phase2@shotlab.test";
const COACH_EMAIL = "coach.phase2@shotlab.test";

const isoOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const seedData = {
  "sl:teams": [{ id: TEAM_ID, name: "Player Phase Two Team", ownerCoachId: COACH_EMAIL, joinCode: "PLAYER2", createdAt: Date.now() - 86400000 }],
  "sl:players": [
    { id: "coach-phase-two", email: COACH_EMAIL, name: "Phase Two Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player-phase-two", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Phase Two Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "profile-phase-two", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Phase Two", lastName: "Player" }],
  "sl:drills": [
    { id: "form-shooting", name: "Form Shooting", desc: "Clean mechanics and balanced feet", max: 50, icon: "ft" },
    { id: "corner-threes", name: "Corner Threes", desc: "Build repeatable corner volume", max: 40, icon: "3p" },
  ],
  "sl:program-drills": [
    { id: "program-finishing", name: "Program Finishing", desc: "Finish through contact", max: 30, icon: "layup" },
    { id: "program-reads", name: "Game Speed Reads", desc: "Make decisions at pace", max: 20, icon: "shoot" },
  ],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:events": [
    { id: "team-practice", teamId: TEAM_ID, title: "Team Practice", type: "practice", date: isoOffset(1), time: "6:00 PM", location: "Main Gym", desc: "Team practice" },
    { id: "film-session", teamId: TEAM_ID, title: "Film Session", type: "meeting", date: isoOffset(2), time: "5:00 PM", location: "Film Room", desc: "Prepare for the next opponent" },
  ],
  "sl:rsvps": [{ id: "practice-rsvp", eventId: "team-practice", email: PLAYER_EMAIL, name: "Phase Two Player", teamId: TEAM_ID }],
  "sl:sc-sessions": [
    { id: "team-lift", teamId: TEAM_ID, sport: "Team Lift", date: isoOffset(2), time: "8:00 AM", sessionType: "School" },
    { id: "speed-session", teamId: TEAM_ID, sport: "Speed Session", date: isoOffset(3), time: "9:00 AM", sessionType: "School" },
  ],
  "sl:sc-rsvps": [{ id: "lift-rsvp", sessionId: "team-lift", email: PLAYER_EMAIL, name: "Phase Two Player", teamId: TEAM_ID }],
  "sl:sc-logs": [],
  "sl:season-archives": [],
  "sl:coach-priorities": { [TEAM_ID]: { todayFocusText: "Clean mechanics before volume", priorityDrillText: "Game Speed Reads", weeklyMakesTarget: 500, weeklyCheckinsTarget: 2 } },
};

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterSeededPlayer(page) {
  await enterSeededRegisteredPlayer(page, {
    storage: seedData,
    playerEmail: PLAYER_EMAIL,
    playerName: "Phase Two Player",
    teamId: TEAM_ID,
  });
}

async function openMoreDestination(page, key) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(sheet).toHaveCount(0);
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function expectButtonTouchTargets(root, minimum = 1) {
  const buttons = root.getByRole("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThanOrEqual(minimum);
  for (let index = 0; index < count; index += 1) {
    const box = await buttons.nth(index).boundingBox();
    expect(box).not.toBeNull();
    // Chromium can report a CSS 44px box as 43.99998px after device-pixel conversion.
    expect(box.height).toBeGreaterThanOrEqual(43.99);
  }
}

async function expectWorkspaceTouchTargets(page, testId) {
  const workspace = page.getByTestId(testId);
  await expect(workspace).toBeVisible({ timeout: 20_000 });
  await expect(workspace.locator("[data-interactive]")).toHaveCount(4);
  await expectButtonTouchTargets(workspace);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("At Home workspace filters drills and routes the Today metric to shot entry", async ({ page }) => {
  await enterSeededPlayer(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();

  await expectWorkspaceTouchTargets(page, "player-at-home-workspace");
  const filters = page.getByTestId("player-at-home-filter-rail");
  await filters.getByRole("button", { name: /Completed/i }).click();
  await expect(page.getByText("No completed drills yet", { exact: true })).toBeVisible();

  await filters.getByRole("button", { name: /Open/i }).click();
  await expect(page.getByText("Form Shooting", { exact: true })).toBeVisible();
  await expect(page.getByText("Corner Threes", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "LOG SHOTS", exact: true })).toBeVisible();

  await page.getByTestId("player-at-home-workspace").getByRole("button", { name: /Today/i }).click();
  const shotInput = page.getByText("SHOTS MADE", { exact: true }).locator("..").locator("input");
  await expect(shotInput).toBeFocused({ timeout: 3_000 });
  await expectNoHorizontalOverflow(page);
});

test("Program workspace filters the plan and launches the exact coach-priority drill", async ({ page }) => {
  await enterSeededPlayer(page);
  await openMoreDestination(page, "duels");

  await expectWorkspaceTouchTargets(page, "player-program-workspace");
  const filters = page.getByTestId("player-program-filter-rail");
  await filters.getByRole("button", { name: /Completed/i }).click();
  await expect(page.getByText("No completed Program drills yet", { exact: true })).toBeVisible();

  await filters.getByRole("button", { name: /Open/i }).click();
  await expect(page.getByText("Game Speed Reads", { exact: true })).toBeVisible();
  await page.getByTestId("player-program-workspace").getByRole("button", { name: /Start coach priority/i }).click();
  await expect(page.getByRole("heading", { name: "Game Speed Reads", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("spinbutton").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("Events and S&C commitment centers reveal the exact unresolved commitment", async ({ page }) => {
  await enterSeededPlayer(page);

  await openMoreDestination(page, "program");
  const eventCenter = page.getByTestId("player-commitment-center-events");
  await expect(eventCenter).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-commitment-route-header-events")).toBeVisible();
  await expect(eventCenter.getByText("Team Practice", { exact: true }).first()).toBeVisible();
  await expect(eventCenter.getByText("Film Session", { exact: true }).first()).toBeVisible();
  await expectButtonTouchTargets(eventCenter);
  await eventCenter.getByRole("button", { name: "Respond now", exact: true }).click();
  await expect(page.getByTestId("player-commitment-details-events")).toHaveAttribute("open", "");
  await expect(page.getByTestId("player-events-operational-list")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "RSVP NOW →", exact: true }).first()).toBeVisible();

  await openMoreDestination(page, "sc");
  const strengthCenter = page.getByTestId("player-commitment-center-strength");
  await expect(strengthCenter).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-commitment-route-header-strength")).toBeVisible();
  await expect(strengthCenter.getByText("Team Lift", { exact: true }).first()).toBeVisible();
  await expect(strengthCenter.getByText("Speed Session", { exact: true }).first()).toBeVisible();
  await expectButtonTouchTargets(strengthCenter);
  await strengthCenter.getByRole("button", { name: "Respond now", exact: true }).click();
  await expect(page.getByTestId("player-commitment-details-strength")).toHaveAttribute("open", "");
  const strengthPanel = page.getByTestId("player-strength-operational-panel");
  await expect(strengthPanel).toBeVisible({ timeout: 10_000 });
  await strengthPanel.getByRole("button", { name: /Speed Session/i }).click();
  await expect(strengthPanel.getByRole("button", { name: /RSVP NOW/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("Leaderboards and Progress retain the current operational hierarchy", async ({ page }) => {
  await enterSeededPlayer(page);

  await openMoreDestination(page, "leaderboards");
  await expectWorkspaceTouchTargets(page, "player-leaderboards-workspace");
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Progress", exact: true }).click();
  const profile = page.getByTestId("player-profile-workspace");
  await expect(profile).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-progress-story")).toBeVisible();
  await expect(page.getByTestId("player-progress-metrics")).toBeVisible();
  await expect(profile.locator("[data-interactive]")).toHaveCount(0);
  await expectButtonTouchTargets(profile, 2);

  await page.getByTestId("player-progress-open-profile").click();
  await expect(page.getByTestId("player-progress-full-profile")).toHaveAttribute("open", "");
  await expect(page.getByTestId("player-profile-readout")).toBeVisible({ timeout: 10_000 });
  await expectNoHorizontalOverflow(page);
});