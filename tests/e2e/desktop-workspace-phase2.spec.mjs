import { test, expect } from "@playwright/test";

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", route => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, route => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
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

async function readRosterScrollOwner(roster) {
  return roster.evaluate(node => {
    const canScroll = element => {
      if (!element) return false;
      const style = getComputedStyle(element);
      return /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
    };
    let owner = node;
    while (owner && owner !== document.body && owner !== document.documentElement && !canScroll(owner)) owner = owner.parentElement;
    if (!owner || !canScroll(owner)) owner = document.scrollingElement || document.documentElement;
    const isDocument = owner === document.scrollingElement || owner === document.documentElement || owner === document.body;
    return {
      kind: isDocument ? "document" : "element",
      top: owner.scrollTop,
      marker: isDocument ? "document" : (owner.id || String(owner.className || owner.tagName)),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("Coach desktop shell preserves one document, real IA history, active state, and roster context", async ({ page }) => {
  await page.goto("/");
  await enterCoachDemo(page);
  const token = await installDocumentToken(page);
  const homeSidebar = page.getByRole("complementary", { name: "Coach navigation" });
  await expect(homeSidebar).toHaveCount(1);
  await expect(homeSidebar.getByRole("button", { name: "Mission Control", exact: true })).toHaveAttribute("aria-current", "page");
  expect(new URL(page.url()).pathname).toBe("/");

  await coachNav(page, "Players");
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await expectDocumentToken(page, token);
  const workspaceSidebar = page.getByRole("complementary", { name: "Coach navigation" });
  await expect(workspaceSidebar).toHaveCount(1);
  await expect(workspaceSidebar.getByRole("button", { name: "Players", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(workspaceSidebar.getByRole("button", { name: "Feed", exact: true })).not.toHaveAttribute("aria-current", "page");

  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  const profile = roster.locator('[data-phase1-open-profile="true"]').last();
  await expect(profile).toBeVisible();
  await profile.scrollIntoViewIfNeeded();
  const rosterScroll = await readRosterScrollOwner(roster);
  expect(rosterScroll.top).toBeGreaterThan(0);
  await test.info().attach("coach-roster-scroll-owner", { body: JSON.stringify(rosterScroll), contentType: "application/json" });
  await profile.click();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toBeVisible();
  const playerPath = new URL(page.url()).pathname;
  expect(playerPath).toMatch(/^\/coach\/players\/.+/);
  expect(await page.evaluate(() => window.history.state?.slp)).toBe(1);
  await expectDocumentToken(page, token);

  await page.goBack();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toHaveCount(0);
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await expect.poll(async () => (await readRosterScrollOwner(roster)).top).toBe(rosterScroll.top);
  const restoredScroll = await readRosterScrollOwner(roster);
  expect(restoredScroll.kind).toBe(rosterScroll.kind);
  expect(restoredScroll.marker).toBe(rosterScroll.marker);
  await expectDocumentToken(page, token);

  await page.goForward();
  await expect(page.getByTestId("coach-player-intelligence-drawer")).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(playerPath);
  await page.goBack();
  await expect(page.getByTestId("coach-players-interactive-dashboard")).toBeVisible();

  await coachNav(page, "Feed");
  expect(new URL(page.url()).pathname).toBe("/");
  await coachNav(page, "Players");
  await coachNav(page, "Events");
  expect(new URL(page.url()).pathname).toBe("/coach/events");
  await page.goBack();
  expect(new URL(page.url()).pathname).toBe("/coach/players");
  await page.goForward();
  expect(new URL(page.url()).pathname).toBe("/coach/events");
  await expectDocumentToken(page, token);

  await coachNav(page, "Leaderboards");
  expect(new URL(page.url()).pathname).toBe("/coach/leaderboards");
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("complementary", { name: "Coach navigation" }).getByRole("button", { name: "Leaderboards", exact: true })).toHaveAttribute("aria-current", "page");
  await page.goBack();
  expect(new URL(page.url()).pathname).toBe("/coach/events");
  await page.goForward();
  expect(new URL(page.url()).pathname).toBe("/coach/leaderboards");
  await expectDocumentToken(page, token);

  const sameRouteLength = await page.evaluate(() => history.length);
  await coachNav(page, "Leaderboards");
  expect(await page.evaluate(() => history.length)).toBe(sameRouteLength);

  await page.reload();
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/coach/leaderboards");
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
      await expect(sidebar).toHaveCount(1);
      await expect(sidebar).toBeVisible();
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});
