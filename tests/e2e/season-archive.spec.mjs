import { test, expect } from "@playwright/test";

const TEAM_ID = "team-e2e-archive";
const COACH_EMAIL = "coach.demo@shotlab.app";
const PLAYER_EMAIL = "demo@shotlab.app";

const LIVE_DATA_KEYS = [
  "sl:teams",
  "sl:players",
  "sl:player-profiles",
  "sl:scores",
  "sl:program-scores",
  "sl:shotlogs",
  "sl:events",
  "sl:rsvps",
  "sl:sc-sessions",
  "sl:sc-rsvps",
  "sl:sc-logs",
];

const seedData = {
  "sl:teams": [
    {
      id: TEAM_ID,
      name: "E2E Archive Team",
      ownerCoachId: COACH_EMAIL,
      joinCode: "E2E26",
      createdAt: 1_750_000_000_000,
    },
  ],
  "sl:players": [
    {
      id: "coach-e2e",
      email: COACH_EMAIL,
      name: "Demo Coach",
      role: "coach",
      teamId: TEAM_ID,
    },
    {
      id: "player-demo-primary",
      playerId: "player-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      role: "player",
      teamId: TEAM_ID,
    },
  ],
  "sl:player-profiles": [
    {
      id: "profile-demo-primary",
      userId: PLAYER_EMAIL,
      teamId: TEAM_ID,
      firstName: "Demo",
      lastName: "Player",
    },
  ],
  "sl:scores": [
    {
      id: "score-e2e-home-1",
      playerId: "player-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      teamId: TEAM_ID,
      drillId: "form-shooting",
      score: 18,
      makes: 18,
      date: "2026-02-10",
      src: "home",
    },
  ],
  "sl:program-scores": [
    {
      id: "score-e2e-program-1",
      playerId: "player-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      teamId: TEAM_ID,
      drillId: "program-form-shooting",
      score: 21,
      date: "2026-02-12",
      src: "program",
    },
  ],
  "sl:shotlogs": [
    {
      id: "shotlog-e2e-1",
      playerId: "player-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      teamId: TEAM_ID,
      made: 125,
      date: "2026-02-13",
    },
  ],
  "sl:events": [
    {
      id: "event-e2e-1",
      teamId: TEAM_ID,
      title: "Archive Test Practice",
      date: "2026-02-15",
      time: "5:00 PM",
      location: "Main Gym",
      type: "run",
    },
  ],
  "sl:rsvps": [
    {
      id: "rsvp-e2e-1",
      eventId: "event-e2e-1",
      playerId: "player-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      teamId: TEAM_ID,
      status: "yes",
      attended: true,
      date: "2026-02-15",
    },
  ],
  "sl:sc-sessions": [
    {
      id: "sc-session-e2e-1",
      teamId: TEAM_ID,
      sport: "Strength Circuit",
      sessionType: "School",
      date: "2026-02-16",
      time: "3:30 PM",
    },
  ],
  "sl:sc-rsvps": [
    {
      id: "sc-rsvp-e2e-1",
      sessionId: "sc-session-e2e-1",
      playerId: "player-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      teamId: TEAM_ID,
      status: "yes",
      date: "2026-02-16",
    },
  ],
  "sl:sc-logs": [
    {
      id: "sc-log-e2e-1",
      sessionId: "sc-session-e2e-1",
      playerId: "player-demo-primary",
      email: PLAYER_EMAIL,
      name: "Demo Player",
      teamId: TEAM_ID,
      date: "2026-02-16",
      completed: true,
    },
  ],
  "sl:season-archives": [],
};

async function readStoredCollections(page, keys = LIVE_DATA_KEYS) {
  return page.evaluate((storageKeys) =>
    Object.fromEntries(
      storageKeys.map((key) => {
        const raw = window.localStorage.getItem(key);
        return [key, raw == null ? null : JSON.parse(raw)];
      }),
    ),
  keys);
}

async function enterCoachDemo(page) {
  const demoCoachButton = page.getByRole("button", { name: "Demo Coach", exact: true });
  const playersButton = page.getByRole("button", { name: "Players", exact: true });

  await expect(
    page.getByRole("button", { name: /^(Demo Coach|Players)$/ }).first(),
  ).toBeVisible({ timeout: 15_000 });

  if (await demoCoachButton.isVisible()) await demoCoachButton.click();
  await expect(playersButton).toBeVisible({ timeout: 15_000 });
  return playersButton;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((payload) => {
    if (window.localStorage.getItem("sl:e2e-season-archive-seeded") === "true") return;

    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
    window.localStorage.setItem("sl:e2e-season-archive-seeded", "true");
  }, seedData);
});

test("coach can archive, reopen, refresh, and preserve all live team data", async ({ page }) => {
  await page.goto("/");

  const playersButton = await enterCoachDemo(page);
  await playersButton.click();

  const archivePanel = page.getByTestId("coach-season-archive");
  await expect(archivePanel).toBeVisible();

  const liveDataBeforeArchive = await readStoredCollections(page);
  const archiveName = "Playwright Archive Season";

  await archivePanel.getByPlaceholder("2026 Summer").fill(archiveName);
  const dateFields = archivePanel.locator('input[type="date"]');
  await expect(dateFields).toHaveCount(2);
  await dateFields.nth(0).fill("2026-01-01");
  await dateFields.nth(1).fill("2026-12-31");

  await archivePanel.getByRole("button", { name: "Archive Season", exact: true }).click();
  await archivePanel.getByRole("button", { name: /^confirm archive$/i }).click();

  await expect(archivePanel.getByRole("status")).toContainText(`Archived ${archiveName}.`);

  const storedArchives = await readStoredCollections(page, ["sl:season-archives"]);
  expect(storedArchives["sl:season-archives"]).toHaveLength(1);
  expect(storedArchives["sl:season-archives"][0]).toMatchObject({
    seasonName: archiveName,
    teamId: TEAM_ID,
    summary: {
      rosterCount: 1,
      homeScoreCount: 1,
      programScoreCount: 1,
      eventCount: 1,
      scSessionCount: 1,
    },
  });

  await archivePanel.getByTestId("season-archive-view-button").click();
  const detail = archivePanel.getByTestId("season-archive-detail");
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(archiveName);
  await expect(detail).toContainText("ROSTER SNAPSHOT");
  await expect(detail).toContainText("EVENT SNAPSHOT");
  await expect(detail).toContainText("S&C SNAPSHOT");
  await expect(detail.getByTestId("season-archive-player-summaries")).toContainText("Demo Player");

  expect(await readStoredCollections(page)).toEqual(liveDataBeforeArchive);

  await page.reload();
  const playersButtonAfterReload = await enterCoachDemo(page);
  await playersButtonAfterReload.click();

  const archivePanelAfterReload = page.getByTestId("coach-season-archive");
  await expect(archivePanelAfterReload).toBeVisible();
  await archivePanelAfterReload.getByTestId("season-archive-view-button").click();
  await expect(archivePanelAfterReload.getByTestId("season-archive-detail")).toContainText(archiveName);

  expect(await readStoredCollections(page)).toEqual(liveDataBeforeArchive);

  const archivesAfterReload = await readStoredCollections(page, ["sl:season-archives"]);
  expect(archivesAfterReload["sl:season-archives"]).toHaveLength(1);
  expect(archivesAfterReload["sl:season-archives"][0].seasonName).toBe(archiveName);
});
