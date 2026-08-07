import { test, expect } from "@playwright/test";

const TEAM_ID = "team-e2e-production-acceptance";
const COACH_EMAIL = "coach.demo@shotlab.app";
const PLAYER_EMAIL = "acceptance.player@example.com";
const REMOVAL_EMAIL = "removal.candidate@example.com";
const FULL_LOGO_URL = "https://example.test/shotlab-acceptance-full.svg";
const MARK_LOGO_URL = "https://example.test/shotlab-acceptance-mark.svg";

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Acceptance Test Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "SAFE26",
    createdAt: 1_750_000_000_000,
    branding: {
      name: "Acceptance Test Team",
      shortName: "ATT",
      wordmark: "ACCEPTANCE TEST TEAM",
      primaryColor: "#3B82F6",
      secondaryColor: "#93C5FD",
      accentColor: "#2563EB",
      textOnPrimary: "#EAF2FF",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
      logoMarkUrl: "/branding/titans-default-mark.svg",
      textScale: "standard",
      version: 1,
    },
  }],
  "sl:players": [
    { id: "coach-acceptance", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player-acceptance", playerId: "player-acceptance", email: PLAYER_EMAIL, name: "Acceptance Player", role: "player", teamId: TEAM_ID },
    { id: "player-removal", playerId: "player-removal", email: REMOVAL_EMAIL, name: "Removal Candidate", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "profile-acceptance", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Acceptance", lastName: "Player" },
    { id: "profile-removal", userId: REMOVAL_EMAIL, email: REMOVAL_EMAIL, teamId: TEAM_ID, firstName: "Removal", lastName: "Candidate" },
  ],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [
    { id: "shot-acceptance", playerId: "player-acceptance", email: PLAYER_EMAIL, name: "Acceptance Player", teamId: TEAM_ID, made: 87, attempted_shots: 120, date: "2026-07-25", sessionId: "acceptance-session" },
    { id: "shot-removal", playerId: "player-removal", email: REMOVAL_EMAIL, name: "Removal Candidate", teamId: TEAM_ID, made: 999, attempted_shots: 1000, date: "2026-07-25", sessionId: "removal-session" },
  ],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

const TEST_LOGO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#2563EB"/><path d="M28 54h44M50 28v44" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg>';

async function installSafeRoutes(page) {
  await page.route("https://example.test/*.svg*", (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: TEST_LOGO_SVG }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterSeededDemoCoach(page) {
  await page.addInitScript((payload) => {
    if (window.sessionStorage.getItem("shotlab-acceptance-seeded") === "1") return;
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem("shotlab-acceptance-seeded", "1");
  }, seedData);

  await page.goto("/");
  const demoButton = page.getByRole("button", { name: "Coach demo", exact: true });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function enterDemoPlayer(page) {
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: "Player demo", exact: true });
  await expect(demoButton).toBeVisible({ timeout: 20_000 });
  await demoButton.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openMore(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  return sheet;
}

async function openCoachDestination(page, key) {
  const sheet = await openMore(page);
  await sheet.locator(`[data-nav-key="${key}"]`).click();
  await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
}

const stripCacheBuster = (value = "") => String(value).split("?")[0];

async function readTeamBranding(page) {
  return page.evaluate((teamId) => {
    const teams = JSON.parse(window.localStorage.getItem("sl:teams") || "[]");
    return teams.find((team) => team.id === teamId)?.branding || null;
  }, TEAM_ID);
}

async function countDemoPlayerShotRows(page, made) {
  return page.evaluate((madeCount) => {
    const rows = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    return rows.filter((row) => {
      const rowEmail = String(row?.email || row?.player_email || row?.playerId || row?.player_id || "").trim().toLowerCase();
      const syncSource = String(row?.syncSource || row?.sync_source || "").trim().toLowerCase();
      const syncState = String(row?.syncState || row?.sync_state || "").trim().toLowerCase();
      const hasDemoSessionMarker = row?.demo === true || syncSource === "demo" || syncSource === "local" || syncState === "local_pending";
      return Number(row?.made) === Number(madeCount) && rowEmail === "demo@shotlab.app" && hasDemoSessionMarker;
    }).length;
  }, made);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("coach branding save persists and renders a cleaned prominent logo", async ({ page }) => {
  await enterSeededDemoCoach(page);
  await openCoachDestination(page, "branding");

  await page.getByLabel("Full logo URL").fill(FULL_LOGO_URL);
  await page.getByLabel("Logo mark URL").fill(MARK_LOGO_URL);
  await page.getByRole("button", { name: "Save team branding", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();

  const heroLogo = page.locator(".mcHeroTeamMark img");
  await expect(heroLogo).toBeVisible({ timeout: 20_000 });
  const savedBranding = await readTeamBranding(page);
  expect(stripCacheBuster(savedBranding?.logoUrl)).toBe(FULL_LOGO_URL);
  expect(stripCacheBuster(savedBranding?.logoMarkUrl)).toBe(MARK_LOGO_URL);
  expect(await heroLogo.getAttribute("src")).toMatch(/^data:image\/png;base64,/);

  await page.reload();
  await expect(page.getByRole("button", { name: "Coach demo", exact: true })).toBeVisible({ timeout: 20_000 });
  expect(await readTeamBranding(page)).toEqual(savedBranding);
});

test("coach removal creates a hidden tombstone and excludes the player from roster and leaderboards", async ({ page }) => {
  await enterSeededDemoCoach(page);

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
  await expect(page.getByText("Acceptance Player", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Removal Candidate", { exact: true }).first()).toBeVisible();

  const candidateRosterRow = page
    .locator('[role="button"]')
    .filter({ hasText: "Removal Candidate" })
    .filter({ has: page.getByRole("button", { name: "REMOVE", exact: true }) })
    .first();
  page.once("dialog", async (dialog) => dialog.accept());
  await candidateRosterRow.getByRole("button", { name: "REMOVE", exact: true }).click();
  await expect(page.getByText("Removal Candidate", { exact: true })).toHaveCount(0);

  await expect.poll(() => page.evaluate((email) => {
    const rows = JSON.parse(window.localStorage.getItem("sl:players") || "[]");
    const row = rows.find((player) => String(player.email || "").toLowerCase() === email);
    return {
      teamId: row?.teamId ?? null,
      hidden: row?.hideFromLeaderboards === true,
    };
  }, REMOVAL_EMAIL)).toEqual({ teamId: null, hidden: true });

  await openCoachDestination(page, "leaderboards");
  const hub = page.getByTestId("premium-leaderboards-hub");
  await expect(hub).toBeVisible({ timeout: 20_000 });
  const playerName = hub.getByText("Acceptance Player", { exact: true }).first();
  await expect(playerName).toBeVisible();
  await expect(playerName.locator("xpath=ancestor::*[self::div or self::li or self::tr][1]")).toContainText("87");
  await expect(hub.getByText("Removal Candidate", { exact: true })).toHaveCount(0);
});

test("coach-created strength session remains stored across refresh", async ({ page }) => {
  await enterSeededDemoCoach(page);
  await openCoachDestination(page, "sc");

  await page.getByRole("button", { name: /ADD SESSION/i }).first().click();
  const form = page.locator("#coach-sc-session-form");
  await expect(form).toBeVisible();
  await form.locator("input").first().fill("Acceptance Strength");
  await form.locator("select").selectOption("School");
  await form.locator('input[type="date"]').fill("2026-08-15");
  await form.getByPlaceholder("6:00 AM").fill("6:30 AM");
  await form.getByRole("button", { name: "CREATE SESSION", exact: true }).click();

  await expect(page.locator(".scSection").filter({ hasText: "Acceptance Strength" })).toBeVisible();
  const readSavedSession = () => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:sc-sessions") || "[]");
    return rows.find((row) => row.sport === "Acceptance Strength" && row.date === "2026-08-15" && row.time === "6:30 AM") || null;
  });
  const savedSession = await readSavedSession();
  expect(savedSession).not.toBeNull();

  await page.reload();
  await expect(page.getByRole("button", { name: "Coach demo", exact: true })).toBeVisible({ timeout: 20_000 });
  expect(await readSavedSession()).toEqual(savedSession);
});

test("Demo Player shot rows are removed on logout", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await enterDemoPlayer(page);

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Train", exact: true }).click();
  await page.getByRole("spinbutton").first().fill("33");
  await page.getByRole("button", { name: "LOG SHOTS", exact: true }).first().click();

  await expect.poll(() => countDemoPlayerShotRows(page, 33), { timeout: 15_000 }).toBe(1);

  await page.getByRole("button", { name: /^log out$/i }).click();
  await expect(page.getByRole("button", { name: "Player demo", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => countDemoPlayerShotRows(page, 33)).toBe(0);
});
