import { test, expect } from "@playwright/test";

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
      id: "team-e2e-archive",
      name: "E2E Archive Team",
      ownerCoachId: "coach.demo@shotlab.app",
      joinCode: "E2E26",
      createdAt: 1_750_000_000_000,
    },
  ],
  "sl:players": [
    {
      id: "coach-e2e",
      email: "coach.demo@shotlab.app",
      name: "Demo Coach",
      role: "coach",
      teamId: "team-e2e-archive",
    },
    {
      id: "player-demo-primary",
      playerId: "player-demo-primary",
      email: "demo@shotlab.app",
      name: "Demo Player",
      role: "player",
      teamId: "team-e2e-archive",
    },
    {
      id: "player-e2e-second",
      playerId: "player-e2e-second",
      email: "second.player@demo.shotlab.app",
      name: "Second Player",
      role: "player",
      teamId: "team-e2e-archive",
    },
  ],
  "sl:player-profiles": [
    {
      id: "profile-demo-primary",
      userId: "demo@shotlab.app",
      teamId: "team-e2e-archive",
      firstName: "Demo",
      lastName: "Player",
    },
    {
      id: "profile-e2e-second",
      userId: "second.player@demo.shotlab.app",
      teamId: "team-e2e-archive",
      firstName: "Second",
      lastName: "Player",
    },
  ],
  "sl:scores": [
    {
      id: "score-e2e-home-1",
      playerId: "player-demo-primary",
      email: "demo@shotlab.app",
      name: "Demo Player",
      teamId: "team-e2e-archive",
      drillId: "form-shooting",
      score: 18,
      makes: 18,
      date: "2026-02-10",
      src: "home",
    },
    {
      id: "score-e2e-home-2",
      playerId: "player-e2e-second",
      email: "second.player@demo.shotlab.app",
      name: "Second Player",
      teamId: "team-e2e-archive",
      drillId: "form-shooting",
      score: 14,
      makes: 14,
      date: "2026-02-11",
      src: "home",
    },
  ],
  "sl:program-scores": [
    {
      id: "score-e2e-program-1",
      playerId: "player-demo-primary",
      email: "demo@shotlab.app",
      name: "Demo Player",
      teamId: "team-e2e-archive",
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
      email: "demo@shotlab.app",
      name: "Demo Player",
      teamId: "team-e2e-archive",
      made: 125,
      date: "2026-02-13",
    },
  ],
  "sl:events": [
    {
      id: "event-e2e-1",
      teamId: "team-e2e-archive",
      title: "Archive Test Practice",
      date: "2026-02-15",
      time: "5:00 PM",
      location: "Main Gym",
      type: "run",
    },
    {
      id: "event-e2e-2",
      teamId: "team-e2e-archive",
      title: "Archive Test Film",
      date: "2026-02-17",
      time: "4:00 PM",
      location: "Team Room",
      type: "recovery",
    },
  ],
  "sl:rsvps": [
    {
      id: "rsvp-e2e-1",
      eventId: "event-e2e-1",
      playerId: "player-demo-primary",
      email: "demo@shotlab.app",
      name: "Demo Player",
      teamId: "team-e2e-archive",
      status: "yes",
      attended: true,
      date: "2026-02-15",
    },
  ],
  "sl:sc-sessions": [
    {
      id: "sc-session-e2e-1",
      teamId: "team-e2e-archive",
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
      playerId: "player-e2e-second",
      email: "second.player@demo.shotlab.app",
      name: "Second Player",
      teamId: "team-e2e-archive",
      status: "yes",
      date: "2026-02-16",
    },
  ],
  "sl:sc-logs": [
    {
      id: "sc-log-e2e-1",
      sessionId: "sc-session-e2e-1",
      playerId: "player-demo-primary",
      email: "demo@shotlab.app",
      name: "Demo Player",
      teamId: "team-e2e-archive",
      date: "2026-02-16",
      completed: true,
    },
  ],
  "sl:season-archives": [],
};

async function readStoredCollections(page, keys = LIVE_DATA_KEYS) {
  return page.evaluate((storageKeys) => {
    return Object.fromEntries(
      storageKeys.map((key) => {
        const raw = window.localStorage.getItem(key);
        return [key, raw == null ? null : JSON.parse(raw)];
      }),
    );
  }, keys);
}

async function enterCoachDemo(page) {
  const demoCoachButton = page.getByRole("button", { name: "Demo Coach", exact: true });
  const playersButton = page.getByRole("button", { name: "Players", exact: true });

  await expect(
    page.getByRole("button", { name: /^(Demo Coach|Players)$/ }).first(),
  ).toBeVisible({ timeout: 15_000 });

  if (await demoCoachButton.isVisible()) {
    await demoCoachButton.click();
  }

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
  await archivePanel.getByRole("button", { name: "Confirm Archive", exact: true }).click();

  await expect(archivePanel.getByRole("status")).toContainText(`Archived ${archiveName}.`);

  const storedArchives = await readStoredCollections(page, ["sl:season-archives"]);
  expect(storedArchives["sl:season-archives"]).toHaveLength(1);
  expect(storedArchives["sl:season-archives"][0]).toMatchObject({
    seasonName: archiveName,
    teamId: "team-e2e-archive",
    summary: {
      rosterCount: 2,
      homeScoreCount: 2,
      programScoreCount: 1,
      eventCount: 2,
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

  const liveDataAfterArchive = await readStoredCollections(page);
  expect(liveDataAfterArchive).toEqual(liveDataBeforeArchive);

  await page.reload();
  const playersButtonAfterReload = await enterCoachDemo(page);
  await playersButtonAfterReload.click();

  const archivePanelAfterReload = page.getByTestId("coach-season-archive");
  await expect(archivePanelAfterReload).toBeVisible();
  await archivePanelAfterReload.getByTestId("season-archive-view-button").click();
  await expect(archivePanelAfterReload.getByTestId("season-archive-detail")).toContainText(archiveName);

  const liveDataAfterReload = await readStoredCollections(page);
  expect(liveDataAfterReload).toEqual(liveDataBeforeArchive);

  const archivesAfterReload = await readStoredCollections(page, ["sl:season-archives"]);
  expect(archivesAfterReload["sl:season-archives"]).toHaveLength(1);
  expect(archivesAfterReload["sl:season-archives"][0].seasonName).toBe(archiveName);
});
