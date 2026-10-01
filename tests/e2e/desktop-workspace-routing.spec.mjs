import { test, expect } from "@playwright/test";

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page) {
  const home = page.getByTestId("coach-command-center-full");
  const sidebar = page.getByRole("complementary", { name: "Coach navigation" });
  const demo = page.getByRole("button", { name: "Coach demo", exact: true });
  const coachReady = async () => (await home.isVisible().catch(() => false)) || (await sidebar.isVisible().catch(() => false));
  await expect.poll(async () => (await coachReady()) || (await demo.isVisible().catch(() => false)), { timeout: 20_000 }).toBe(true);
  if (await demo.isVisible().catch(() => false)) await demo.click();
  await expect.poll(coachReady, { timeout: 20_000 }).toBe(true);
}

async function enterPlayerDemo(page) {
  const home = page.getByTestId("player-daily-command-center");
  const demo = page.getByRole("button", { name: "Player demo", exact: true });
  await expect.poll(async () => (await home.isVisible().catch(() => false)) || (await demo.isVisible().catch(() => false)), { timeout: 20_000 }).toBe(true);
  if (await demo.isVisible().catch(() => false)) await demo.click();
  await expect(home).toBeVisible({ timeout: 20_000 });
}

async function openFirstPlayerDrawer(page) {
  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const profile = roster.locator('[data-phase1-open-profile="true"]').first();
  await expect(profile).toBeVisible();
  await profile.scrollIntoViewIfNeeded();
  await profile.click();
  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  return { profile, drawer };
}

async function clickDesktopNav(page, name) {
  const sidebar = page.getByRole("complementary", { name: "Coach navigation" });
  await expect(sidebar).toBeVisible();
  await sidebar.getByRole("button", { name, exact: true }).click();
}

async function clickPlayerNav(page, name) {
  const button = page.getByRole("button", { name, exact: true }).first();
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
}

async function expectNoHorizontalPagePan(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("desktop Coach workspace owns marked player history and restores valid routes", async ({ page }) => {
  const pageErrors=[];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  await enterCoachDemo(page);
  expect(new URL(page.url()).pathname).toBe("/");

  await clickDesktopNav(page, "Players");
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/players");

  const { profile, drawer } = await openFirstPlayerDrawer(page);
  const playerPath = new URL(page.url()).pathname;
  expect(playerPath).toMatch(/^\/coach\/players\/.+/);
  expect(await page.evaluate(() => window.history.state?.slp)).toBe(1);
  await expect(drawer.getByRole("button", { name: "Close details", exact: true }).last()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await expect(profile).toBeFocused();

  await page.goForward();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(playerPath);
  await page.goBack();
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/players");

  await clickDesktopNav(page, "Events");
  await expect(page.getByTestId("coach-events-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/events");
  await page.goBack();
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await page.goForward();
  await expect(page.getByTestId("coach-events-interactive-dashboard")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("coach-events-interactive-dashboard")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/coach/events");

  await page.goto("/coach/settings");
  await expect(page.getByTestId("coach-season-archive")).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(page.getByTestId("coach-season-archive")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/coach/settings");

  const direct = await page.context().newPage();
  await installSafeRoutes(direct);
  await direct.setViewportSize({ width: 1280, height: 900 });
  await direct.goto(playerPath);
  const directDrawer = direct.getByTestId("coach-player-intelligence-drawer");
  await expect(directDrawer).toBeVisible({ timeout: 20_000 });
  expect(await direct.evaluate(() => window.history.state?.slp || null)).not.toBe(1);
  await directDrawer.getByRole("button", { name: "Close details", exact: true }).last().click();
  await expect(directDrawer).toHaveCount(0);
  expect(new URL(direct.url()).pathname).toBe("/coach/players");

  await direct.goto("/coach/not-a-real-route");
  await expect(direct.getByRole("complementary", { name: "Coach navigation" })).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => new URL(direct.url()).pathname).toBe("/");
  await direct.close();
  expect(pageErrors).toEqual([]);
});

test("mobile Coach navigation remains authoritative and does not write desktop routes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await enterCoachDemo(page);
  const historyLength = await page.evaluate(() => window.history.length);
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  await dock.getByRole("button", { name: "Players", exact: true }).click();
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/");
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength);
  await expectNoHorizontalPagePan(page);
});

test("desktop Player workspace preserves route, refresh, back, forward, and same-route history", async ({ page }) => {
  const pageErrors=[];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  await enterPlayerDemo(page);
  expect(new URL(page.url()).pathname).toBe("/");

  await clickPlayerNav(page, "AT Home Log");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/quick-menu");
  const sameRouteLength=await page.evaluate(() => history.length);
  await clickPlayerNav(page, "AT Home Log");
  expect(await page.evaluate(() => history.length)).toBe(sameRouteLength);

  await clickPlayerNav(page, "Events");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/quick-menu");
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await page.goForward();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/quick-menu");
  await page.goForward();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");

  await page.reload();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  expect(pageErrors).toEqual([]);
});

test("mobile Player primary navigation remains usable without horizontal pan", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await enterPlayerDemo(page);
  const dock=page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  await dock.getByRole("button", { name: "Train", exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/quick-menu");
  await expectNoHorizontalPagePan(page);
});

for (const width of [320,375,390,430,768,1024,1280,1440]) {
  for (const role of ["Coach","Player"]) {
    test(`${role} ${width}px workspace has no horizontal page pan`, async ({ page }) => {
      await page.setViewportSize({ width, height: width>=768?900:844 });
      await page.goto("/");
      if(role==="Coach") await enterCoachDemo(page); else await enterPlayerDemo(page);
      await expectNoHorizontalPagePan(page);
      if(width<1024) await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
      if(width>=1024) await expect(page.getByTestId("mobile-navigation-dock")).toHaveCount(0);
    });
  }
}