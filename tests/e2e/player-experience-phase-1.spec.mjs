import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-player-phase-one";
const PLAYER_EMAIL = "demo@shotlab.app";
const COACH_EMAIL = "coach.demo@shotlab.app";

const isoOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Player Experience Test Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "PLAYER1",
    createdAt: Date.now() - 86400000,
    branding: {
      name: "Player Experience Test Team",
      shortName: "PX",
      wordmark: "PLAYER EXPERIENCE",
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
    { id: "coach-player-phase-one", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "demo-player-phase-one", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Demo Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "profile-player-phase-one", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Demo", lastName: "Player" }],
  "sl:drills": [
    { id: "form-shooting", name: "Form Shooting", desc: "Clean mechanics and balanced feet", max: 50, icon: "ft" },
    { id: "corner-threes", name: "Corner Threes", desc: "Build repeatable corner volume", max: 40, icon: "3p" },
  ],
  "sl:program-drills": [{ id: "program-finishing", name: "Program Finishing", desc: "Finish through contact", max: 30, icon: "layup" }],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:events": [{ id: "team-practice", teamId: TEAM_ID, title: "Team Practice", type: "practice", date: isoOffset(1), time: "6:00 PM", location: "Main Gym", desc: "Team practice" }],
  "sl:rsvps": [],
  "sl:sc-sessions": [{ id: "team-lift", teamId: TEAM_ID, sport: "Team Lift", date: isoOffset(2), time: "8:00 AM", sessionType: "School" }],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
  "sl:coach-priorities": {
    [TEAM_ID]: {
      todayFocusText: "Clean mechanics before volume",
      focusEmphasis: "Mechanics",
      priorityDrillText: "Form Shooting",
      challengeText: "Complete Form Shooting and close the daily target.",
      weeklyMakesTarget: 500,
      weeklyCheckinsTarget: 2,
    },
  },
};

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterSeededDemoPlayer(page) {
  await page.addInitScript((payload) => {
    if (window.sessionStorage.getItem("player-phase-one-seeded") === "1") return;
    for (const [storageKey, value] of Object.entries(payload)) window.localStorage.setItem(storageKey, JSON.stringify(value));
    window.sessionStorage.setItem("player-phase-one-seeded", "1");
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Player", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("daily command center resolves urgent commitment then launches one bounded first result", async ({ page }) => {
  await enterSeededDemoPlayer(page);

  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(commandCenter.getByText(/First-week activation/)).toContainText("1/3 complete");
  const primary = page.getByTestId("player-daily-primary-action");
  await expect(primary).toHaveText(/Confirm attendance/i);
  await primary.click();

  await expect(page.getByText("UPCOMING EVENTS", { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Team Practice", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: /RSVP NOW/ }).first().click();
  const cue = page.getByTestId("player-completion-cue");
  await expect(cue).toBeVisible();
  await expect(cue).toContainText("Event participation confirmed");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Home", exact: true }).click();
  await expect(page.getByText("First session · Create your baseline", { exact: true })).toBeVisible();
  await expect(page.getByTestId("player-daily-primary-action")).toHaveText(/Log first result/i);
  await expect(commandCenter.getByText("Log your first shooting result", { exact: true })).toBeVisible();
  await expect(commandCenter).toContainText("Use Form Shooting as your focus");
  await page.getByTestId("player-daily-primary-action").click();

  await expect(page.getByRole("spinbutton").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "LOG SHOTS", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Form Shooting", exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("logging the first result activates progress and confirms the baseline", async ({ page }) => {
  await enterSeededDemoPlayer(page);

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "At Home", exact: true }).click();
  await page.getByRole("spinbutton").first().fill("33");
  await page.getByRole("button", { name: "LOG SHOTS", exact: true }).first().click();

  const cue = page.getByTestId("player-completion-cue");
  await expect(cue).toBeVisible({ timeout: 20_000 });
  await expect(cue).toContainText("33 makes added to today’s total");
  await cue.getByRole("button", { name: /CONTINUE/ }).click();

  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(commandCenter).toBeVisible();
  await expect(page.getByTestId("player-first-result-confirmation")).toBeVisible();
  await expect(page.getByTestId("player-first-result-confirmation")).toContainText("First result banked");
  await expect(commandCenter.getByText(/First-week activation/)).toContainText("2/3 complete");
  await expect(page.getByText("33/100", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    return rows.some((row) => Number(row.made) === 33 && String(row.email || "").toLowerCase() === "demo@shotlab.app");
  })).toBe(true);
  await expectNoHorizontalOverflow(page);
});