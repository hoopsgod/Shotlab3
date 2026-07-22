import { test, expect } from "@playwright/test";

const TEAM_ID = "team-e2e-hierarchy";
const COACH_EMAIL = "coach.hierarchy@shotlab.app";
const PLAYER_EMAIL = "player.hierarchy@shotlab.app";

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function futureDate(days = 2) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildSeedData() {
  const today = todayString();
  return {
    "sl:teams": [{ id: TEAM_ID, name: "Hierarchy Test Team", ownerCoachId: COACH_EMAIL, joinCode: "HIER26", createdAt: Date.now() }],
    "sl:players": [
      { id: "coach-hierarchy", email: COACH_EMAIL, name: "Hierarchy Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
      { id: "player-hierarchy", playerId: "player-hierarchy", email: PLAYER_EMAIL, name: "Hierarchy Player", role: "player", teamId: TEAM_ID },
    ],
    "sl:player-profiles": [{ id: "profile-hierarchy", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Hierarchy", lastName: "Player" }],
    "sl:scores": [
      { id: "home-score-hierarchy", playerId: "player-hierarchy", email: PLAYER_EMAIL, name: "Hierarchy Player", teamId: TEAM_ID, drillId: "form-shooting", score: 18, makes: 18, date: today, src: "home" },
    ],
    "sl:program-scores": [],
    "sl:shotlogs": [{ id: "shotlog-hierarchy", playerId: "player-hierarchy", email: PLAYER_EMAIL, name: "Hierarchy Player", teamId: TEAM_ID, made: 75, date: today, src: "home" }],
    "sl:events": [{ id: "event-hierarchy", teamId: TEAM_ID, title: "Team Workout", date: futureDate(2), time: "5:00 PM", location: "Main Gym", type: "run", desc: "Skill development" }],
    "sl:rsvps": [],
    "sl:sc-sessions": [],
    "sl:sc-rsvps": [],
    "sl:sc-logs": [],
    "sl:season-archives": [],
  };
}

async function installRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function seedSession(page, email) {
  const payload = buildSeedData();
  await page.addInitScript(({ data, sessionEmail }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(data)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify({ email: sessionEmail }));
    window.localStorage.setItem("sl:e2e-hierarchy-seeded", "true");
  }, { data: payload, sessionEmail: email });
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))).toMatchObject({
    innerWidth: await page.evaluate(() => window.innerWidth),
  });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectThreeMetrics(locator) {
  await expect(locator).toBeVisible();
  await expect(locator.locator(":scope > div")).toHaveCount(3);
}

test("player mobile home prioritizes one mission, three metrics, and collapsed support", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await seedSession(page, PLAYER_EMAIL);
  await page.goto("/");

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

test("coach desktop home prioritizes one command, three metrics, and collapsed operations", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await installRoutes(page);
  await seedSession(page, COACH_EMAIL);
  await page.goto("/");

  const objective = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  const secondaryTools = page.getByTestId("coach-secondary-tools");
  const standings = page.getByTestId("coach-team-standings");
  const setup = page.getByTestId("coach-setup-checklist");

  await expect(objective).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-primary-objective")).toHaveCount(1);
  await expectThreeMetrics(metrics);
  for (const disclosure of [secondaryTools, standings, setup]) {
    await expect(disclosure).toBeVisible();
    expect(await disclosure.evaluate((element) => element.open)).toBe(false);
  }

  const objectiveBox = await objective.boundingBox();
  const metricBox = await metrics.boundingBox();
  expect(objectiveBox).not.toBeNull();
  expect(metricBox).not.toBeNull();
  expect(objectiveBox.y).toBeLessThan(metricBox.y);

  await secondaryTools.locator("summary").click();
  expect(await secondaryTools.evaluate((element) => element.open)).toBe(true);
  await expectNoHorizontalOverflow(page);
});
