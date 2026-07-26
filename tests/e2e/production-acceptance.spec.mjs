import { test, expect } from "@playwright/test";

const TEAM_ID = "team-e2e-production-acceptance";
const COACH_EMAIL = "coach.demo@shotlab.app";
const PLAYER_EMAIL = "acceptance.player@example.com";
const REMOVED_EMAIL = "removed.acceptance@example.com";
const FULL_LOGO_URL = "https://example.test/shotlab-acceptance-full.svg";
const MARK_LOGO_URL = "https://example.test/shotlab-acceptance-mark.svg";

const seedData = {
  "sl:teams": [
    {
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
    },
  ],
  "sl:players": [
    { id: "coach-acceptance", email: COACH_EMAIL, name: "Demo Coach", role: "coach", teamId: TEAM_ID },
    { id: "player-acceptance", playerId: "player-acceptance", email: PLAYER_EMAIL, name: "Acceptance Player", role: "player", teamId: TEAM_ID },
    {
      id: "player-removed",
      playerId: "player-removed",
      email: REMOVED_EMAIL,
      name: "Removed Acceptance",
      role: "player",
      teamId: TEAM_ID,
      removedFromTeamId: TEAM_ID,
      removed: true,
      rosterStatus: "removed",
      removedAt: "2026-07-25T12:00:00.000Z",
    },
  ],
  "sl:player-profiles": [
    { id: "profile-acceptance", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Acceptance", lastName: "Player" },
    {
      id: "profile-removed",
      userId: REMOVED_EMAIL,
      email: REMOVED_EMAIL,
      teamId: TEAM_ID,
      firstName: "Removed",
      lastName: "Acceptance",
      removed: true,
      rosterStatus: "removed",
      removedAt: "2026-07-25T12:00:00.000Z",
    },
  ],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [
    { id: "shot-acceptance", playerId: "player-acceptance", email: PLAYER_EMAIL, name: "Acceptance Player", teamId: TEAM_ID, made: 87, attempted_shots: 120, date: "2026-07-25", sessionId: "acceptance-session" },
    { id: "shot-removed", playerId: "player-removed", email: REMOVED_EMAIL, name: "Removed Acceptance", teamId: TEAM_ID, made: 999, attempted_shots: 1000, date: "2026-07-25", sessionId: "removed-session" },
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
  await page.route("https://example.test/*.svg*", async (route) => {
    await route.fulfill({ status: 200, contentType: "image/svg+xml", body: TEST_LOGO_SVG });
  });
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route("**/v1/coach/players/provision**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function seedCoachStorage(page) {
  await page.addInitScript(({ payload, coachEmail }) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify({ email: coachEmail }));
  }, { payload: seedData, coachEmail: COACH_EMAIL });
}

async function enterDemo(page, role) {
  await page.goto("/");
  const demoButton = page.getByRole("button", { name: role === "coach" ? "Demo Coach" : "Demo Player", exact: true });
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(page.getByRole("button", { name: role === "coach" ? /^(Demo Coach|Players)$/ : /^(Demo Player|At Home)$/ }).first()).toBeVisible({ timeout: 20_000 });
  if (await demoButton.isVisible()) await demoButton.click();
  await expect(dock).toBeVisible({ timeout: 20_000 });
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

const withoutCacheBuster = (value = "") => String(value).split("?")[0];

async function expectHeroLogoSource(page, expectedSource) {
  const heroLogo = page.locator(".mcHeroTeamMark img");
  await expect(heroLogo).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => withoutCacheBuster(await heroLogo.getAttribute("src")), { timeout: 15_000 }).toBe(expectedSource);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
});

test("coach branding save survives refresh and remains prominent in Mission Control", async ({ page }) => {
  await seedCoachStorage(page);
  await enterDemo(page, "coach");
  await openCoachDestination(page, "branding");

  await expect(page.getByText("TEAM BRANDING", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Full logo URL").fill(FULL_LOGO_URL);
  await page.getByLabel("Logo mark URL").fill(MARK_LOGO_URL);
  await page.getByRole("button", { name: "Save team branding", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();

  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  await expectHeroLogoSource(page, MARK_LOGO_URL);

  await page.reload();
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  await expectHeroLogoSource(page, MARK_LOGO_URL);
});

test("active roster player appears in coach roster and leaderboards while removed player stays excluded", async ({ page }) => {
  await seedCoachStorage(page);
  await enterDemo(page, "coach");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
  await expect(page.getByText("Acceptance Player", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Removed Acceptance", { exact: true })).toHaveCount(0);

  await openCoachDestination(page, "leaderboards");
  const hub = page.getByTestId("premium-leaderboards-hub");
  await expect(hub).toBeVisible({ timeout: 20_000 });
  const activePlayerRow = hub.getByText("Acceptance Player", { exact: true }).first().locator("xpath=ancestor::*[self::div or self::li or self::tr][1]");
  await expect(activePlayerRow).toBeVisible();
  await expect(activePlayerRow).toContainText("87");
  await expect(hub.getByText("Removed Acceptance", { exact: true })).toHaveCount(0);
});

test("coach-created strength session persists after refresh", async ({ page }) => {
  await seedCoachStorage(page);
  await enterDemo(page, "coach");
  await openCoachDestination(page, "sc");

  await page.getByRole("button", { name: /ADD SESSION/i }).first().click();
  const form = page.locator("#coach-sc-session-form");
  await expect(form).toBeVisible();
  await form.locator("input").first().fill("Acceptance Strength");
  await form.locator("select").selectOption("School");
  await form.locator('input[type="date"]').fill("2026-08-15");
  await form.getByPlaceholder("6:00 AM").fill("6:30 AM");
  await form.getByRole("button", { name: "CREATE SESSION", exact: true }).click();

  const savedSession = page.locator(".scSection").filter({ hasText: "Acceptance Strength" });
  await expect(savedSession).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:sc-sessions") || "[]");
    return rows.some((row) => row.sport === "Acceptance Strength" && row.date === "2026-08-15" && row.time === "6:30 AM");
  }), { timeout: 15_000 }).toBe(true);

  await page.goto("/");
  await enterDemo(page, "coach");
  await openCoachDestination(page, "sc");
  await expect(page.locator(".scSection").filter({ hasText: "Acceptance Strength" })).toBeVisible({ timeout: 20_000 });
});

test("Demo Player shot rows are removed on logout without touching non-demo rows", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await enterDemo(page, "player");

  await page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    rows.push({ id: "registered-keep", email: "registered@example.com", teamId: "registered-team", made: 71, syncState: "remote_saved", syncSource: "remote" });
    window.localStorage.setItem("sl:shotlogs", JSON.stringify(rows));
  });

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "At Home", exact: true }).click();
  await page.getByRole("spinbutton").first().fill("33");
  await page.getByRole("button", { name: "LOG SHOTS", exact: true }).first().click();

  await expect.poll(() => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    return rows.some((row) => Number(row.made) === 33 && row.demo === true);
  }), { timeout: 15_000 }).toBe(true);

  await page.getByRole("button", { name: /^logout$/i }).click();
  await expect(page.getByRole("button", { name: "Demo Player", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    return {
      demoRowExists: rows.some((row) => Number(row.made) === 33 && row.demo === true),
      registeredRowExists: rows.some((row) => row.id === "registered-keep" && Number(row.made) === 71),
    };
  })).toEqual({ demoRowExists: false, registeredRowExists: true });
});
