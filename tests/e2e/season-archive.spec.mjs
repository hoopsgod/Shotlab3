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
  "sl:teams": [{ id: TEAM_ID, name: "E2E Archive Team", ownerCoachId: COACH_EMAIL, joinCode: "E2E26", createdAt: 1_750_000_000_000 }],
  "sl:players": [
    { id: "coach-e2e", email: COACH_EMAIL, name: "Demo Coach", role: "coach", teamId: TEAM_ID },
    { id: "player-demo-primary", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "profile-demo-primary", userId: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Demo", lastName: "Player" }],
  "sl:scores": [{ id: "score-e2e-home-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, drillId: "form-shooting", score: 18, makes: 18, date: "2026-02-10", src: "home" }],
  "sl:program-scores": [{ id: "score-e2e-program-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, drillId: "program-form-shooting", score: 21, date: "2026-02-12", src: "program" }],
  "sl:shotlogs": [{ id: "shotlog-e2e-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, made: 125, date: "2026-02-13" }],
  "sl:events": [{ id: "event-e2e-1", teamId: TEAM_ID, title: "Archive Test Practice", date: "2026-02-15", time: "5:00 PM", location: "Main Gym", type: "run" }],
  "sl:rsvps": [{ id: "rsvp-e2e-1", eventId: "event-e2e-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, status: "yes", attended: true }],
  "sl:sc-sessions": [{ id: "sc-session-e2e-1", teamId: TEAM_ID, sport: "Strength Circuit", sessionType: "School", date: "2026-02-16", time: "3:30 PM" }],
  "sl:sc-rsvps": [{ id: "sc-rsvp-e2e-1", sessionId: "sc-session-e2e-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, status: "yes" }],
  "sl:sc-logs": [{ id: "sc-log-e2e-1", sessionId: "sc-session-e2e-1", playerId: "player-demo-primary", email: PLAYER_EMAIL, name: "Demo Player", teamId: TEAM_ID, completed: true }],
  "sl:season-archives": [],
};

let remoteArchives = [];
let archivePostCount = 0;
let failArchiveWrites = false;

function archiveRouteHandler() {
  return async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: remoteArchives }) });
      return;
    }
    if (request.method() === "POST") {
      archivePostCount += 1;
      if (failArchiveWrites) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "archive_write_failed" }) });
        return;
      }
      const payload = request.postDataJSON();
      const incoming = payload.archive;
      const duplicate = remoteArchives.some((row) => row.teamId === incoming.teamId && row.seasonName.toLowerCase() === incoming.seasonName.toLowerCase() && row.seasonStartDate === incoming.seasonStartDate && row.seasonEndDate === incoming.seasonEndDate);
      if (duplicate) {
        await route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: "duplicate_archive" }) });
        return;
      }
      const saved = { ...incoming, createdAt: new Date().toISOString(), archivedBy: { ...incoming.archivedBy, email: COACH_EMAIL, role: "coach" } };
      remoteArchives.push(saved);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, archive: saved }) });
      return;
    }
    await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ error: "method_not_allowed" }) });
  };
}

async function seedBrowserStorage(page, { includeSession = false } = {}) {
  await page.addInitScript(({ payload, coachEmail, includeSessionValue }) => {
    if (window.localStorage.getItem("sl:e2e-season-archive-seeded") === "true") return;
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    if (includeSessionValue) window.localStorage.setItem("sl:session", JSON.stringify({ email: coachEmail }));
    window.localStorage.setItem("sl:e2e-season-archive-seeded", "true");
  }, { payload: seedData, coachEmail: COACH_EMAIL, includeSessionValue: includeSession });
}

async function readStoredCollections(page, keys = LIVE_DATA_KEYS) {
  return page.evaluate((storageKeys) => Object.fromEntries(storageKeys.map((key) => {
    const raw = window.localStorage.getItem(key);
    let value = raw == null ? null : JSON.parse(raw);
    if (key === "sl:program-scores" && Array.isArray(value)) {
      value = value.map((row) => {
        const drillName = row.drill_name || row.drillName || "";
        return { ...row, drillName, drill_name: drillName };
      });
    }
    return [key, value];
  })), keys);
}

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
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function enterCoachDemo(page) {
  const demoCoachButton = page.getByRole("button", { name: "Demo Coach", exact: true });
  const playersButton = page.getByRole("button", { name: "Players", exact: true });
  await expect(page.getByRole("button", { name: /^(Demo Coach|Players)$/ }).first()).toBeVisible({ timeout: 15_000 });
  if (await demoCoachButton.isVisible()) {
    await waitForHydration(page);
    await demoCoachButton.click();
  }
  await expect(playersButton).toBeVisible({ timeout: 15_000 });
  return playersButton;
}

async function openSeasonArchivePanel(page) {
  const panel = page.getByTestId("coach-season-archive");
  if (!(await panel.isVisible().catch(() => false))) {
    const seasonToolsButton = page.getByRole("button", { name: "Season Tools", exact: true });
    await expect(seasonToolsButton).toBeVisible({ timeout: 15_000 });
    await seasonToolsButton.click();
  }
  await expect(panel).toBeVisible({ timeout: 15_000 });
  return panel;
}

async function installRoutes(target) {
  await target.route("**/v1/season-archives", archiveRouteHandler());
  await target.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

test.beforeEach(async ({ page }) => {
  remoteArchives = [];
  archivePostCount = 0;
  failArchiveWrites = false;
  await installRoutes(page);
  await seedBrowserStorage(page);
});

test("coach archive survives refresh and a second browser while live data stays unchanged", async ({ page, browser }) => {
  await page.goto("/");
  const playersButton = await enterCoachDemo(page);
  await playersButton.click();

  const archivePanel = await openSeasonArchivePanel(page);
  const liveDataBeforeArchive = await readStoredCollections(page);
  const archiveName = "Playwright Archive Season";

  await archivePanel.getByPlaceholder("2026 Summer").fill(archiveName);
  const dateFields = archivePanel.locator('input[type="date"]');
  await dateFields.nth(0).fill("2026-01-01");
  await dateFields.nth(1).fill("2026-12-31");
  await archivePanel.getByRole("button", { name: "Archive Season", exact: true }).click();
  await archivePanel.getByRole("button", { name: /^confirm archive$/i }).click();

  await expect(archivePanel.getByRole("status")).toContainText(`Archived ${archiveName}.`);
  expect(archivePostCount).toBe(1);
  expect(remoteArchives).toHaveLength(1);
  expect(remoteArchives[0]).toMatchObject({
    seasonName: archiveName,
    teamId: TEAM_ID,
    summary: { rosterCount: 1, homeScoreCount: 1, programScoreCount: 1, eventCount: 1, scSessionCount: 1 },
  });

  await archivePanel.getByTestId("season-archive-view-button").click();
  const detail = archivePanel.getByTestId("season-archive-detail");
  await expect(detail).toContainText(archiveName);
  await expect(detail.getByTestId("season-archive-player-summaries")).toContainText("Demo Player");
  expect(await readStoredCollections(page)).toEqual(liveDataBeforeArchive);

  await page.evaluate(() => window.localStorage.removeItem("sl:season-archives"));
  await page.reload();
  const playersAfterReload = await enterCoachDemo(page);
  await playersAfterReload.click();
  const reloadedPanel = await openSeasonArchivePanel(page);
  await reloadedPanel.getByTestId("season-archive-view-button").click();
  await expect(reloadedPanel.getByTestId("season-archive-detail")).toContainText(archiveName);
  expect(await readStoredCollections(page)).toEqual(liveDataBeforeArchive);

  const secondContext = await browser.newContext();
  await installRoutes(secondContext);
  await secondContext.addInitScript(({ payload, coachEmail }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) {
      if (key !== "sl:season-archives") window.localStorage.setItem(key, JSON.stringify(value));
    }
    window.localStorage.setItem("sl:session", JSON.stringify({ email: coachEmail }));
    window.localStorage.setItem("sl:e2e-season-archive-seeded", "true");
  }, { payload: seedData, coachEmail: COACH_EMAIL });
  const secondPage = await secondContext.newPage();
  await secondPage.goto("/");
  const secondPlayers = await enterCoachDemo(secondPage);
  await secondPlayers.click();
  const secondPanel = await openSeasonArchivePanel(secondPage);
  await secondPanel.getByTestId("season-archive-view-button").click();
  await expect(secondPanel.getByTestId("season-archive-detail")).toContainText(archiveName);
  await secondContext.close();
});

test("server write failure shows an error and creates no local archive", async ({ page }) => {
  failArchiveWrites = true;
  await page.goto("/");
  const playersButton = await enterCoachDemo(page);
  await playersButton.click();
  const archivePanel = await openSeasonArchivePanel(page);

  await archivePanel.getByPlaceholder("2026 Summer").fill("Failed Archive");
  const dateFields = archivePanel.locator('input[type="date"]');
  await dateFields.nth(0).fill("2026-01-01");
  await dateFields.nth(1).fill("2026-12-31");
  await archivePanel.getByRole("button", { name: "Archive Season", exact: true }).click();
  await archivePanel.getByRole("button", { name: /^confirm archive$/i }).click();

  await expect(archivePanel.getByRole("status")).toContainText("Could not save the season archive to the server");
  expect(archivePostCount).toBe(1);
  expect(remoteArchives).toHaveLength(0);
  const localArchives = await page.evaluate(() => JSON.parse(window.localStorage.getItem("sl:season-archives") || "[]"));
  expect(localArchives).toHaveLength(0);
  await expect(archivePanel.getByText("No archived seasons yet.")).toBeVisible();
});
