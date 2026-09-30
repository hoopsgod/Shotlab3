import { test, expect } from "@playwright/test";

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function installDemoRestoreRoutes(page, role, existingFixture = null) {
  const fixture = existingFixture || await page.evaluate((requestedRole) => {
    const read = (key, fallback) => {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    };
    const email = requestedRole === "coach" ? "coach.demo@shotlab.app" : "demo@shotlab.app";
    const players = read("sl:players", []);
    const teams = read("sl:teams", []);
    const session = read("sl:session", {});
    const person = (Array.isArray(players) ? players : []).find((candidate) => String(candidate?.email || candidate?.id || "").trim().toLowerCase() === email) || {};
    const teamId = person.teamId || person.team_id || session?.teamId || session?.team_id || (Array.isArray(teams) ? teams[0]?.id : null) || null;
    const team = (Array.isArray(teams) ? teams : []).find((candidate) => candidate?.id === teamId) || (Array.isArray(teams) ? teams[0] : null) || (teamId ? { id: teamId, name: "Demo Team" } : null);
    return {
      profile: {
        email,
        name: person.name || (requestedRole === "coach" ? "Demo Coach" : "Demo Player"),
        role: requestedRole,
        team_id: teamId,
        hide_from_leaderboards: requestedRole === "coach",
      },
      team,
    };
  }, role);

  if (!fixture?.profile?.team_id || !fixture?.team?.id) {
    throw new Error(`Unable to capture ${role} demo team context for route restoration`);
  }

  await page.route("**/v1/legacy-auth/restore", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      profile: fixture.profile,
      session: { authenticated: true, expires_at: Math.floor(Date.now() / 1000) + 3600 },
    }),
  }));
  await page.route("**/v1/teams/restore-context", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, team: fixture.team }),
  }));
  return fixture;
}

async function enterCoachDemo(page) {
  const home = page.getByTestId("coach-command-center-full");
  const sidebar = page.getByRole("complementary", { name: "Coach navigation" });
  const demo = page.getByRole("button", { name: "Coach demo", exact: true });
  const coachReady = async () => (await home.isVisible().catch(() => false)) || (await sidebar.isVisible().catch(() => false));
  await expect.poll(async () => (await coachReady()) || (await demo.isVisible().catch(() => false)), { timeout: 20_000 }).toBe(true);
  if (await demo.isVisible().catch(() => false)) await demo.click();
  await expect.poll(coachReady, { timeout: 20_000 }).toBe(true);
  return installDemoRestoreRoutes(page, "coach");
}

async function enterPlayerDemo(page) {
  const home = page.getByTestId("player-daily-command-center");
  const demo = page.getByRole("button", { name: "Player demo", exact: true });
  await expect.poll(async () => (await home.isVisible().catch(() => false)) || (await demo.isVisible().catch(() => false)), { timeout: 20_000 }).toBe(true);
  if (await demo.isVisible().catch(() => false)) await demo.click();
  await expect(home).toBeVisible({ timeout: 20_000 });
  return installDemoRestoreRoutes(page, "player");
}

async function reloadExplicitDemoRoute(page) {
  await page.evaluate(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("demo", "1");
    window.history.replaceState(window.history.state, "", url);
  });
  await page.reload();
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
  const geometry = await page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const documentWidth = document.documentElement.scrollWidth;
    const offenders = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || "",
          className: typeof element.className === "string" ? element.className : "",
          testId: element.getAttribute("data-testid") || "",
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          position: style.position,
          overflowX: style.overflowX,
        };
      })
      .filter((entry) => entry.width > 0 && (entry.right > viewportWidth + 1 || entry.left < -1 || entry.scrollWidth > entry.clientWidth + 1))
      .sort((a, b) => Math.max(b.right - viewportWidth, b.scrollWidth - b.clientWidth) - Math.max(a.right - viewportWidth, a.scrollWidth - a.clientWidth))
      .slice(0, 30);
    return { viewportWidth, documentWidth, offenders };
  });

  if (geometry.documentWidth > geometry.viewportWidth + 1) {
    console.log(`[horizontal-overflow] ${JSON.stringify(geometry)}`);
  }
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth + 1);
}

async function documentNavigationCount(page) {
  return page.evaluate(() => performance.getEntriesByType("navigation").length);
}

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("desktop Coach workspace owns marked player history and restores valid routes", async ({ page }) => {
  const pageErrors=[];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/");
  const demoRestoreFixture = await enterCoachDemo(page);
  expect(new URL(page.url()).pathname).toBe("/");
  const initialDocumentNavigations = await documentNavigationCount(page);

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
  expect(await documentNavigationCount(page)).toBe(initialDocumentNavigations);

  await reloadExplicitDemoRoute(page);
  await expect(page.getByTestId("coach-events-interactive-dashboard")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/coach/events");

  await page.goto("/coach/settings?demo=1");
  await expect(page.getByTestId("coach-season-archive")).toBeVisible({ timeout: 20_000 });
  await page.reload();
  await expect(page.getByTestId("coach-season-archive")).toBeVisible({ timeout: 20_000 });
  expect(new URL(page.url()).pathname).toBe("/coach/settings");

  const direct = await page.context().newPage();
  await installSafeRoutes(direct);
  await installDemoRestoreRoutes(direct, "coach", demoRestoreFixture);
  await direct.setViewportSize({ width: 1280, height: 900 });
  await direct.goto(`${playerPath}?demo=1`);
  const directDrawer = direct.getByTestId("coach-player-intelligence-drawer");
  await expect(directDrawer).toBeVisible({ timeout: 20_000 });
  expect(await direct.evaluate(() => window.history.state?.slp || null)).not.toBe(1);
  await directDrawer.getByRole("button", { name: "Close details", exact: true }).last().click();
  await expect(directDrawer).toHaveCount(0);
  expect(new URL(direct.url()).pathname).toBe("/coach/players");

  await direct.goto("/coach/not-a-real-route?demo=1");
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
  const demoRestoreFixture = await enterPlayerDemo(page);
  expect(new URL(page.url()).pathname).toBe("/");
  const initialDocumentNavigations = await documentNavigationCount(page);

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
  expect(await documentNavigationCount(page)).toBe(initialDocumentNavigations);

  await reloadExplicitDemoRoute(page);
  await expect.poll(() => new URL(page.url()).pathname).toBe("/events");
  await expect(page.getByTestId("player-events-operational-list")).toBeVisible({ timeout: 20_000 });

  const direct = await page.context().newPage();
  await installSafeRoutes(direct);
  await installDemoRestoreRoutes(direct, "player", demoRestoreFixture);
  await direct.setViewportSize({ width: 1280, height: 900 });
  await direct.goto("/events?demo=1");
  await expect(direct.getByTestId("player-events-operational-list")).toBeVisible({ timeout: 20_000 });
  expect(new URL(direct.url()).pathname).toBe("/events");
  await direct.reload();
  await expect(direct.getByTestId("player-events-operational-list")).toBeVisible({ timeout: 20_000 });
  expect(new URL(direct.url()).pathname).toBe("/events");
  await direct.close();
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
