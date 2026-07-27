import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-player-phase-two";
const PLAYER_EMAIL = "demo@shotlab.app";
const COACH_EMAIL = "coach.demo@shotlab.app";

const isoOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const seedData = {
  "sl:teams": [{ id: TEAM_ID, name: "Player Phase Two Team", ownerCoachId: COACH_EMAIL, joinCode: "PLAYER2", createdAt: Date.now() - 86400000 }],
  "sl:players": [
    { id: "coach-phase-two", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player-phase-two", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Demo Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "profile-phase-two", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Demo", lastName: "Player" }],
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
  "sl:events": [{ id: "team-practice", teamId: TEAM_ID, title: "Team Practice", type: "practice", date: isoOffset(1), time: "6:00 PM", location: "Main Gym", desc: "Team practice" }],
  "sl:rsvps": [],
  "sl:sc-sessions": [{ id: "team-lift", teamId: TEAM_ID, sport: "Team Lift", date: isoOffset(2), time: "8:00 AM", sessionType: "School" }],
  "sl:sc-rsvps": [],
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

async function enterSeededDemoPlayer(page) {
  await page.addInitScript((payload) => {
    if (window.sessionStorage.getItem("player-phase-two-seeded") === "1") return;
    for (const [storageKey, value] of Object.entries(payload)) window.localStorage.setItem(storageKey, JSON.stringify(value));
    window.sessionStorage.setItem("player-phase-two-seeded", "1");
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Player", exact: true }).click();
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
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

async function expectWorkspaceTouchTargets(page, testId) {
  const workspace = page.getByTestId(testId);
  await expect(workspace).toBeVisible({ timeout: 20_000 });
  const buttons = workspace.getByRole("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThanOrEqual(5);
  for (let index = 0; index < count; index += 1) {
    const box = await buttons.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("At Home workspace filters open and completed drills without breaking shot logging", async ({ page }) => {
  await enterSeededDemoPlayer(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "At Home", exact: true }).click();

  await expectWorkspaceTouchTargets(page, "player-at-home-workspace");
  const filters = page.getByTestId("player-at-home-filter-rail");
  await filters.getByRole("button", { name: /Completed/i }).click();
  await expect(page.getByText("No completed drills yet", { exact: true })).toBeVisible();

  await filters.getByRole("button", { name: /Open/i }).click();
  await expect(page.getByText("Form Shooting", { exact: true })).toBeVisible();
  await expect(page.getByText("Corner Threes", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "LOG SHOTS", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("Program workspace filters the plan and launches the exact coach-priority drill", async ({ page }) => {
  await enterSeededDemoPlayer(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Program", exact: true }).click();

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

test("Events, S&C, Leaderboards, and Profile share the operational workspace system", async ({ page }) => {
  await enterSeededDemoPlayer(page);

  await openMoreDestination(page, "program");
  await expectWorkspaceTouchTargets(page, "player-events-workspace");
  await expect(page.getByText("Team Practice", { exact: true }).first()).toBeVisible();

  await openMoreDestination(page, "sc");
  await expectWorkspaceTouchTargets(page, "player-strength-workspace");
  await expect(page.getByText("Team Lift", { exact: true }).first()).toBeVisible();

  await openMoreDestination(page, "leaderboards");
  await expectWorkspaceTouchTargets(page, "player-leaderboards-workspace");
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });

  await openMoreDestination(page, "profile");
  await expectWorkspaceTouchTargets(page, "player-profile-workspace");
  await expectNoHorizontalOverflow(page);
});
