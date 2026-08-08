import { expect, test } from "@playwright/test";

const TEAM_ID = "team-e2e-career";
const COACH_EMAIL = "coach.demo@shotlab.app";
const PLAYER_EMAIL = "demo@shotlab.app";

const archive = {
  id: "archive-e2e-career",
  teamId: TEAM_ID,
  seasonName: "2026 Completed Season",
  seasonStartDate: "2026-01-01",
  seasonEndDate: "2026-06-30",
  createdAt: "2026-07-01T12:00:00.000Z",
  playerSeasonSummaries: [{
    email: PLAYER_EMAIL,
    playerId: "player-demo-primary",
    profileId: "profile-demo-primary",
    name: "Demo Player",
    totalHomeMakes: 100,
    programScoreCount: 2,
    totalProgramScore: 40,
    totalShotLogMakes: 60,
    eventRsvpCount: 4,
    scRsvpCount: 2,
    scLogCount: 1,
    bestProgramScore: 22,
  }],
  summary: {
    rosterCount: 1,
    totalHomeMakes: 100,
    totalProgramScore: 40,
    totalShotLogMakes: 60,
  },
};

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Career Test Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "CAREER",
    createdAt: 1_750_000_000_000,
  }],
  "sl:players": [
    {
      id: "coach-e2e",
      email: COACH_EMAIL,
      name: "Demo Coach",
      role: "coach",
      teamId: TEAM_ID,
      isCoach: true,
    },
    {
      id: "player-demo-primary",
      playerId: "player-demo-primary",
      profileId: "profile-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      role: "player",
      teamId: TEAM_ID,
    },
  ],
  "sl:player-profiles": [{
    id: "profile-demo-primary",
    userId: PLAYER_EMAIL,
    teamId: TEAM_ID,
    firstName: "Demo",
    lastName: "Player",
  }],
  "sl:scores": [{
    id: "score-career-home",
    playerId: "player-demo-primary",
    email: PLAYER_EMAIL,
    name: "Demo Player",
    teamId: TEAM_ID,
    drillId: "form-shooting",
    score: 18,
    date: "2026-07-10",
    src: "home",
  }],
  "sl:program-scores": [{
    id: "score-career-program",
    playerId: "player-demo-primary",
    email: PLAYER_EMAIL,
    name: "Demo Player",
    teamId: TEAM_ID,
    drillId: "program-form-shooting",
    score: 21,
    date: "2026-07-11",
    src: "program",
  }],
  "sl:shotlogs": [{
    id: "shotlog-career",
    playerId: "player-demo-primary",
    email: PLAYER_EMAIL,
    name: "Demo Player",
    teamId: TEAM_ID,
    made: 125,
    date: "2026-07-12",
  }],
  "sl:events": [{ id: "event-career", teamId: TEAM_ID, title: "Open Gym", date: "2026-07-13" }],
  "sl:rsvps": [{
    eventId: "event-career",
    playerId: "player-demo-primary",
    email: PLAYER_EMAIL,
    name: "Demo Player",
    teamId: TEAM_ID,
  }],
  "sl:sc-sessions": [{ id: "sc-career", teamId: TEAM_ID, sport: "Basketball", date: "2026-07-14" }],
  "sl:sc-rsvps": [{
    sessionId: "sc-career",
    playerId: "player-demo-primary",
    email: PLAYER_EMAIL,
    name: "Demo Player",
    teamId: TEAM_ID,
  }],
  "sl:sc-logs": [{
    sessionId: "sc-career",
    playerId: "player-demo-primary",
    email: PLAYER_EMAIL,
    name: "Demo Player",
    teamId: TEAM_ID,
  }],
  "sl:season-archives": [archive],
};

async function seed(page) {
  await page.route("**/v1/season-archives*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, archives: [archive] }),
      });
      return;
    }
    await route.fulfill({
      status: 405,
      contentType: "application/json",
      body: JSON.stringify({ error: "method_not_allowed" }),
    });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await page.addInitScript(({ payload }) => {
    window.localStorage.clear();
    for (const [storageKey, value] of Object.entries(payload)) {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    }
  }, { payload: seedData });
}

async function enterDemo(page, roleName) {
  const currentLabel = roleName === "Demo Coach"
    ? "Coach demo"
    : roleName === "Demo Player"
      ? "Player demo"
      : roleName;
  const button = page.getByRole("button", { name: currentLabel, exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

async function openFullProgressProfileIfPresent(page) {
  const fullProfile = page.getByTestId("player-progress-full-profile");
  if (!(await fullProfile.count())) return;
  await expect(fullProfile).toBeVisible();
  if (!(await fullProfile.getAttribute("open"))) {
    await fullProfile.locator(":scope > summary").click();
  }
  await expect(fullProfile).toHaveAttribute("open", "");
}

async function expectCareerSeasons(career, viewerRole) {
  await expect(career).toBeVisible();
  await expect(career).toHaveAttribute("data-viewer-role", viewerRole);
  const seasonList = career.getByTestId("career-season-list");
  await expect(seasonList.getByText("2026 Completed Season", { exact: true })).toBeVisible();
  await expect(seasonList.getByText("Current Season", { exact: true })).toBeVisible();
  const seasonRows = seasonList.locator("article");
  await expect(seasonRows).toHaveCount(2);
  await expect(seasonRows.nth(0)).toContainText("2026 Completed Season");
  await expect(seasonRows.nth(1)).toContainText("Current Season");
  await expect(career.getByTestId("career-improvement")).toContainText("2026 Completed Season");
}

test.beforeEach(async ({ page }) => {
  await seed(page);
});

test("player sees current and archived career history on Profile without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page, "Demo Player");
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toHaveAttribute("data-navigation-intent", "development-first");
  await dock.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await openFullProgressProfileIfPresent(page);

  const careerDisclosure = page.getByTestId("player-profile-career-disclosure");
  const career = page.getByTestId("player-career-history");
  await expect(careerDisclosure).toBeVisible();
  await expect(career).toBeHidden();

  await careerDisclosure.locator(":scope > summary").click();
  await expect(careerDisclosure).toHaveAttribute("open", "");
  await expect(career).toBeVisible();

  const detailDisclosure = career.getByTestId("player-career-detail-disclosure");
  await detailDisclosure.locator(":scope > summary").click();
  await expect(detailDisclosure).toHaveAttribute("open", "");
  await expectCareerSeasons(career, "player");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("coach sees the shared career record and can open its immutable archive", async ({ page }) => {
  await page.goto("/");
  await enterDemo(page, "Demo Coach");
  await page.getByRole("button", { name: "Players", exact: true }).first().click();

  const rosterManagement = page.getByTestId("coach-player-roster-management");
  await expect(rosterManagement).toBeVisible({ timeout: 20_000 });
  await expect(rosterManagement).not.toHaveAttribute("open", "");
  await rosterManagement.locator(":scope > summary").click();
  await expect(rosterManagement).toHaveAttribute("open", "");

  await page.getByText("DEMO PLAYER", { exact: true }).last().click();
  await page.getByRole("button", { name: "Open Full Profile", exact: true }).click();
  const career = page.getByTestId("player-career-history");
  await expectCareerSeasons(career, "coach");
  await career.getByRole("button", { name: "View archive 2026 Completed Season" }).click();
  const archiveDetail = page.getByTestId("season-archive-detail");
  await expect(archiveDetail).toBeVisible();
  await expect(archiveDetail.getByText("2026 Completed Season", { exact: true })).toBeVisible();
});
