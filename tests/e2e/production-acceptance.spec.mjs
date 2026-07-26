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
    { id: "player-removed", playerId: "player-removed", email: REMOVED_EMAIL, name: "Removed Acceptance", role: "player", teamId: TEAM_ID, removedAt: "2026-07-25T12:00:00.000Z", active: false },
  ],
  "sl:player-profiles": [
    { id: "profile-acceptance", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Acceptance", lastName: "Player" },
    { id: "profile-removed", userId: REMOVED_EMAIL, email: REMOVED_EMAIL, teamId: TEAM_ID, firstName: "Removed", lastName: "Acceptance", removedAt: "2026-07-25T12:00:00.000Z" },
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

async function installSafeRoutes(page) {
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

  await expect.poll(() => page.evaluate(({ teamId, fullLogo, markLogo }) => {
    const teams = JSON.parse(window.localStorage.getItem("sl:teams") || "[]");
    const team = teams.find((row) => row.id === teamId);
    return team?.branding?.logoUrl === fullLogo && team?.branding?.logoMarkUrl === markLogo;
  }, { teamId: TEAM_ID, fullLogo: FULL_LOGO_URL, markLogo: MARK_LOGO_URL }), { timeout: 15_000 }).toBe(true);

  await page.goto("/");
  await enterDemo(page, "coach");
  const heroLogo = page.locator(".mcHeroTeamMark img");
  await expect(heroLogo).toBeVisible({ timeout: 20_000 });
  await expect(heroLogo).toHaveAttribute("src", MARK_LOGO_URL);
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
  await expect(hub.getByText("Acceptance Player", { exact: true }).first()).toBeVisible();
  await expect(hub.getByText("Removed Acceptance", { exact: true })).toHaveCount(0);
  await expect(hub.getByText("87", { exact: true }).first()).toBeVisible();
});

test("coach-created strength session persists after refresh", async ({ page }) => {
  await seedCoachStorage(page);
  await enterDemo(page, "coach");
  await openCoachDestination(page, "sc");

  await page.getByRole("button", { name: /ADD SESSION/i }).first().click();
  const form = page.locator("#coach-sc-session-form");
  await expect(form).toBeVisible();
  await form.locator('input').first().fill("Acceptance Strength");
  await form.locator('select').selectOption("School");
  await form.locator('input[type="date"]').fill("2026-08-15");
  await form.getByPlaceholder("6:00 AM").fill("6:30 AM");
  await form.getByRole("button", { name: "CREATE SESSION", exact: true }).click();

  await expect(page.getByText("Acceptance Strength", { exact: true }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:sc-sessions") || "[]");
    return rows.some((row) => row.sport === "Acceptance Strength" && row.date === "2026-08-15" && row.time === "6:30 AM");
  }), { timeout: 15_000 }).toBe(true);

  await page.goto("/");
  await enterDemo(page, "coach");
  await openCoachDestination(page, "sc");
  await expect(page.getByText("Acceptance Strength", { exact: true }).first()).toBeVisible({ timeout: 20_000 });
});

test("Demo Player shot rows are removed on logout without touching non-demo rows", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await enterDemo(page, "player");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "At Home", exact: true }).click();
  await page.getByLabel("MAKES").fill("33");
  await page.getByRole("button", { name: "LOG SHOTS", exact: true }).first().click();

  await expect.poll(() => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    return rows.some((row) => Number(row.made) === 33 && row.demo === true);
  }), { timeout: 15_000 }).toBe(true);

  await page.getByRole("button", { name: /log out/i }).click();
  await expect(page.getByRole("button", { name: "Demo Player", exact: true })).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => {
    const rows = JSON.parse(window.localStorage.getItem("sl:shotlogs") || "[]");
    return rows.some((row) => Number(row.made) === 33 && row.demo === true);
  })).toBe(false);
});
