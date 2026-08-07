import { test, expect } from "@playwright/test";

const TEAM_ID = "team-e2e-rollover";
const COACH_EMAIL = "coach.demo@shotlab.app";
const PLAYER_EMAIL = "demo@shotlab.app";

const archive = {
  id: "archive-e2e-rollover",
  teamId: TEAM_ID,
  seasonName: "2026 Completed Season",
  seasonStartDate: "2026-01-01",
  seasonEndDate: "2026-06-30",
  createdAt: "2026-07-01T12:00:00.000Z",
  rosterSnapshot: [
    { id: "player-demo-primary", playerId: "player-demo-primary", profileId: "profile-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", role: "player", teamId: TEAM_ID, status: "active" },
  ],
  programDrillSnapshot: [{ id: "program-form-shooting", name: "Program Form Shooting" }],
  eventSnapshot: [{ id: "event-template-1", title: "Team Practice" }],
  scSessionSnapshot: [{ id: "strength-template-1", title: "Strength Circuit", sessionType: "School" }],
  summary: { rosterCount: 1, totalHomeMakes: 143, totalShotLogMakes: 125 },
};

const seedData = {
  "sl:teams": [{ id: TEAM_ID, name: "E2E Rollover Team", ownerCoachId: COACH_EMAIL, joinCode: "ROLL26", createdAt: 1_750_000_000_000 }],
  "sl:players": [
    { id: "coach-e2e", email: COACH_EMAIL, name: "Demo Coach", role: "coach", teamId: TEAM_ID },
    { id: "player-demo-primary", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "profile-demo-primary", userId: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Demo", lastName: "Player" }],
  "sl:scores": [{ id: "score-e2e-home-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, drillId: "form-shooting", score: 18, makes: 18, date: "2026-02-10", src: "home" }],
  "sl:program-scores": [{ id: "score-e2e-program-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, drillId: "program-form-shooting", score: 21, date: "2026-02-12", src: "program" }],
  "sl:shotlogs": [{ id: "shotlog-e2e-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, made: 125, date: "2026-02-13" }],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [archive],
  "sl:active-seasons": [],
};

async function waitForHydration(page) {
  await expect.poll(() => page.evaluate(({ teamId, coachEmail, playerEmail }) => {
    const parse = (key) => { try { return JSON.parse(window.localStorage.getItem(key) || "[]"); } catch { return []; } };
    const teams = parse("sl:teams");
    const players = parse("sl:players");
    const profiles = parse("sl:player-profiles");
    const drills = parse("sl:drills");
    const programDrills = parse("sl:program-drills");
    return drills.length > 0 && programDrills.length > 0
      && teams.some((team) => team.id === teamId)
      && players.some((player) => player.email === coachEmail && player.teamId === teamId)
      && players.some((player) => player.email === playerEmail && player.teamId === teamId)
      && profiles.some((profile) => profile.userId === playerEmail && profile.teamId === teamId);
  }, { teamId: TEAM_ID, coachEmail: COACH_EMAIL, playerEmail: PLAYER_EMAIL }), { timeout: 20_000 }).toBe(true);
}

async function firstVisiblePlayersButton(page) {
  const candidates = page.getByRole("button", { name: "Players", exact: true });
  await expect.poll(async () => {
    const count = await candidates.count();
    for (let index = 0; index < count; index += 1) {
      if (await candidates.nth(index).isVisible().catch(() => false)) return true;
    }
    return false;
  }, { timeout: 20_000 }).toBe(true);

  const count = await candidates.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  throw new Error("No visible Players navigation control was found.");
}

async function enterCoachDemo(page) {
  const demoCoachButton = page.getByRole("button", { name: "Coach demo", exact: true });
  const commandCenter = page.getByTestId("coach-command-center-full");

  await expect.poll(async () => {
    const demoReady = await demoCoachButton.isVisible().catch(() => false);
    const coachReady = await commandCenter.isVisible().catch(() => false);
    return demoReady || coachReady;
  }, { timeout: 20_000 }).toBe(true);

  if (await demoCoachButton.isVisible().catch(() => false)) {
    await waitForHydration(page);
    await demoCoachButton.click();
  }

  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-command-center-loading")).toHaveCount(0);
  return firstVisiblePlayersButton(page);
}

let postedPlan = null;
let seasonPostCount = 0;

test.beforeEach(async ({ page }) => {
  postedPlan = null;
  seasonPostCount = 0;
  await page.route("**/v1/season-archives", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [archive] }) });
      return;
    }
    await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ error: "method_not_allowed" }) });
  });
  await page.route("**/v1/seasons", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, seasons: [] }) });
      return;
    }
    if (request.method() === "POST") {
      seasonPostCount += 1;
      postedPlan = request.postDataJSON()?.plan || null;
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, seasonId: "season-e2e-new", idempotent: false }) });
      return;
    }
    await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ error: "method_not_allowed" }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.addInitScript(({ payload, coachEmail }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify({ email: coachEmail }));
    window.localStorage.setItem("sl:e2e-season-archive-seeded", "true");
  }, { payload: seedData, coachEmail: COACH_EMAIL });
});

test("coach completes all four new-season steps with zero historical carry-forward", async ({ page }) => {
  await page.goto("/");
  const playersButton = await enterCoachDemo(page);
  await playersButton.click();

  const seasonTools = page.getByTestId("coach-player-season-tools");
  await expect(seasonTools).toBeVisible({ timeout: 20_000 });
  await expect(seasonTools).not.toHaveAttribute("open", "");
  await seasonTools.locator(":scope > summary").click();
  await expect(seasonTools).toHaveAttribute("open", "");

  const wizard = page.getByTestId("new-season-wizard");
  await expect(wizard).toBeVisible();

  // Step 1: choose immutable archive.
  await wizard.getByText("2026 Completed Season", { exact: true }).click();
  await wizard.getByRole("button", { name: "Continue", exact: true }).click();

  // Step 2: define the new active season.
  await wizard.getByTestId("new-season-name").fill("2027 Summer Season");
  await wizard.getByTestId("new-season-start").fill("2027-06-01");
  await wizard.locator('input[type="date"]').nth(1).fill("2027-08-31");
  await wizard.getByRole("button", { name: "Continue", exact: true }).click();

  // Step 3: explicitly return only the selected player.
  await wizard.getByLabel("Status for Demo Player").selectOption("returning");
  await wizard.getByRole("button", { name: "Continue", exact: true }).click();

  // Step 4: select reusable structure, then create.
  await wizard.getByText("Program Form Shooting", { exact: true }).click();
  await wizard.getByText("Team Practice", { exact: true }).click();
  await wizard.getByText("Strength Circuit", { exact: true }).click();
  await wizard.getByTestId("create-new-season").click();

  await expect(wizard.getByRole("status")).toContainText("New season created. Historical results were not copied.");
  expect(seasonPostCount).toBe(1);
  expect(postedPlan).toBeTruthy();
  expect(postedPlan.activeSeason).toMatchObject({
    teamId: TEAM_ID,
    name: "2027 Summer Season",
    startDate: "2027-06-01",
    projectedEndDate: "2027-08-31",
    sourceArchiveId: archive.id,
    lifecycleStatus: "active",
  });
  expect(postedPlan.returningMemberships).toHaveLength(1);
  expect(postedPlan.returningMemberships[0]).toMatchObject({
    identity: "profile-demo-primary",
    status: "returning",
    membershipStatus: "active",
    statistics: {
      homeMakes: 0,
      programScore: 0,
      attendance: 0,
      eventRsvps: 0,
      strengthAttendance: 0,
      streak: 0,
    },
  });
  expect(postedPlan.reusableStructure).toEqual({
    programDrillIds: ["program-form-shooting"],
    eventTemplateIds: ["event-template-1"],
    strengthTemplateIds: ["strength-template-1"],
  });
  expect(postedPlan.carryForwardPolicy).toEqual({
    historicalScores: false,
    attendance: false,
    rsvps: false,
    completedEvents: false,
    completedStrengthSessions: false,
    streaks: false,
  });

  const cached = await page.evaluate(() => JSON.parse(window.localStorage.getItem("sl:active-seasons") || "[]"));
  expect(cached).toHaveLength(1);
  expect(cached[0]).toMatchObject({ id: "season-e2e-new", teamId: TEAM_ID, name: "2027 Summer Season", lifecycleStatus: "active" });
});
