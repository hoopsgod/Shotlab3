import { test, expect } from "@playwright/test";

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, route => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page) {
  const sidebar = page.getByRole("complementary", { name: "Coach navigation" });
  const demo = page.getByRole("button", { name: "Coach demo", exact: true });
  await expect.poll(async () => (await sidebar.isVisible().catch(() => false)) || (await demo.isVisible().catch(() => false)), { timeout: 20_000 }).toBe(true);
  if (await demo.isVisible().catch(() => false)) await demo.click();
  await expect(sidebar).toBeVisible({ timeout: 20_000 });
}

async function enterPlayerDemo(page) {
  const home = page.getByTestId("player-daily-command-center");
  const demo = page.getByRole("button", { name: "Player demo", exact: true });
  await expect.poll(async () => (await home.isVisible().catch(() => false)) || (await demo.isVisible().catch(() => false)), { timeout: 20_000 }).toBe(true);
  if (await demo.isVisible().catch(() => false)) await demo.click();
  await expect(home).toBeVisible({ timeout: 20_000 });
}

async function coachNav(page, name) {
  const sidebar = page.getByRole("complementary", { name: "Coach navigation" });
  const button = sidebar.getByRole("button", { name, exact: true });
  await expect(button).toBeVisible();
  await button.click();
  return button;
}

async function playerNav(page, name) {
  const nav = page.getByRole("complementary", { name: "Player navigation" });
  const button = nav.getByRole("button", { name, exact: true });
  await expect(button).toBeVisible();
  await button.click();
  return button;
}

async function installDocumentToken(page) {
  const token = `phase2-${Date.now()}-${Math.random()}`;
  await page.evaluate(value => { window.__shotlabPhase2DocumentToken = value; }, token);
  return token;
}

async function expectDocumentToken(page, token) {
  expect(await page.evaluate(() => window.__shotlabPhase2DocumentToken)).toBe(token);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("Coach desktop shell preserves one document, history, active state, and roster context", async ({ page }) => {
  await page.goto("/");
  await enterCoachDemo(page);
  const token = await installDocumentToken(page);
  const sidebar = page.getByRole("complementary", { name: "Coach navigation" });
  await expect(sidebar.getByRole("button", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");

  await coachNav(page, "Players");
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await expectDocumentToken(page, token);
  await expect(sidebar.getByRole("button", { name: "Players", exact: true })).toHaveAttribute("aria-current", "page");

  const roster = page.locator("#coach-roster-operations");
  const profile = roster.locator('[data-phase1-open-profile="true"]').first();
  await profile.scrollIntoViewIfNeeded();
  const rosterScrollY = await page.evaluate(() => window.scrollY);
  await profile.click();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toBeVisible();
  expect(new URL(page.url()).pathname).toMatch(/^\/coach\/players\/.+/);
  await expectDocumentToken(page, token);

  await page.goBack();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toHaveCount(0);
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(rosterScrollY);
  await expectDocumentToken(page, token);

  await coachNav(page, "Home");
  expect(new URL(page.url()).pathname).toBe("/coach");
  await coachNav(page, "Events");
  expect(new URL(page.url()).pathname).toBe("/coach/events");
  await page.goBack();
  expect(new URL(page.url()).pathname).toBe("/coach");
  await expectDocumentToken(page, token);

  await coachNav(page, "Analytics");
  expect(new URL(page.url()).pathname).toBe("/coach/analytics");
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  await page.goBack();
  expect(new URL(page.url()).pathname).toBe("/coach");
  await page.goForward();
  expect(new URL(page.url()).pathname).toBe("/coach/analytics");
  await expectDocumentToken(page, token);

  const sameRouteLength = await page.evaluate(() => history.length);
  await coachNav(page, "Analytics");
  expect(await page.evaluate(() => history.length)).toBe(sameRouteLength);

  await page.reload();
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/coach/analytics");
});

test("Player desktop shell preserves one document through Train, Progress, Events, and history", async ({ page }) => {
  await page.goto("/");
  await enterPlayerDemo(page);
  const token = await installDocumentToken(page);
  const nav = page.getByRole("complementary", { name: "Player navigation" });
  await expect(nav.getByRole("button", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");

  await playerNav(page, "AT Home Log");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/quick-menu");
  await expectDocumentToken(page, token);
  await expect(nav.getByRole("button", { name: "AT Home Log", exact: true })).toHaveAttribute("aria-current", "page");

  await playerNav(page, "Profile");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/profile");
  await expect(page.getByText("Progress", { exact: false }).first()).toBeVisible({ timeout: 20_000 });
  await expectDocumentToken(page, token);
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/quick-menu");
  await expectDocumentToken(page, token);

  await playerNav(page, "Home");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await playerNav(page, "Events");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await page.goForward();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");
  await expectDocumentToken(page, token);

  const sameRouteLength = await page.evaluate(() => history.length);
  await playerNav(page, "Events");
  expect(await page.evaluate(() => history.length)).toBe(sameRouteLength);

  await page.reload();
  await expect(page.getByTestId("player-commitment-center-events")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/events");
});

test("workspace authority flips intentionally at 1024px without shell duplication", async ({ page }) => {
  for (const width of [768, 1023, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    await enterCoachDemo(page);
    const dock = page.getByTestId("mobile-navigation-dock");
    const sidebar = page.getByRole("complementary", { name: "Coach navigation" });
    if (width < 1024) {
      await expect(dock).toBeVisible();
      await expect(sidebar).toHaveCount(0);
    } else {
      await expect(dock).toHaveCount(0);
      await expect(sidebar).toBeVisible();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});
