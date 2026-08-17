import { expect, test } from "@playwright/test";

const OUTPUT_DIR = "artifacts/phase-3a-cross-screen-visual-audit";

async function installSafeRoutes(page) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();
    if (url.includes("supabase.co") || url.includes("api.cloudinary.com")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      return;
    }
    await route.continue();
  });
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}" });
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  await page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function navigateByKey(page, key) {
  const nav = page.getByTestId("mobile-navigation-dock");
  const button = nav.locator(`[data-nav-key="${key}"]`);
  await expect(button).toBeVisible({ timeout: 10_000 });
  await button.click();
  await page.waitForTimeout(250);
}

async function capture(page, fileName, { authenticated = true } = {}) {
  if (authenticated) await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 10_000 });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `${OUTPUT_DIR}/${fileName}`, fullPage: true });
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);
}

async function expectPlayerIdentityInsideViewport(page) {
  const identity = page.getByTestId("player-dashboard-identity-header");
  if (!(await identity.count())) return;
  const geometry = await identity.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, height: rect.height, viewportWidth: window.innerWidth };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-0.5);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 0.5);
  expect(geometry.width).toBeGreaterThan(300);
  expect(geometry.height).toBeLessThanOrEqual(100);
}

async function expectCompactFunctionalIntro(page) {
  const sharedIntro = page.locator('[data-visual-role="page-intro"]').first();
  const specializedIntro = page.locator('[data-page-hierarchy="editorial"] [data-layout-role="editorial-header"]').first();
  const eventsIntro = page.locator('[data-testid$="-events-title-stage"]').first();
  const intro = await sharedIntro.count() ? sharedIntro : await specializedIntro.count() ? specializedIntro : eventsIntro;
  await expect(intro).toBeVisible();
  const geometry = await intro.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const title = element.querySelector("h1");
    return {
      height: rect.height,
      titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      right: rect.right,
      viewportWidth: window.innerWidth,
    };
  });
  expect(geometry.height).toBeLessThanOrEqual(200);
  expect(geometry.titleSize).toBeLessThanOrEqual(44);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
}

async function expectProgressStoryCommandSurface(page) {
  const story = page.locator('[data-page-hierarchy="command-story"]');
  await expect(story).toBeVisible();
  const hero = story.locator('[data-layout-role="command-story-header"]');
  await expect(hero).toBeVisible();
  const geometry = await hero.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const title = element.querySelector("h2");
    return {
      height: rect.height,
      titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      right: rect.right,
      viewportWidth: window.innerWidth,
    };
  });
  expect(geometry.height).toBeLessThanOrEqual(390);
  expect(geometry.titleSize).toBeLessThanOrEqual(42);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
  await expect(page.getByTestId("player-progress-metrics")).toBeVisible();
  await expect(page.getByText("What the work says now", { exact: true })).toBeVisible();
}

async function expectReadablePlayerMetrics(page, testId) {
  const workspace = page.getByTestId(testId);
  await expect(workspace).toBeVisible({ timeout: 10_000 });
  const metrics = workspace.locator('[data-layout-role="metric-strip"]');
  if (!(await metrics.count())) return;
  const geometry = await metrics.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, viewportWidth: window.innerWidth };
  });
  expect(geometry.left).toBeGreaterThanOrEqual(-0.5);
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth + 0.5);
}

async function expectPersistentFeedbackRestored(page) {
  const layer = page.getByTestId("app-feedback-layer");
  if (!(await layer.count())) return;
  await expect(layer).toHaveAttribute("data-persistent-ready", "true");
}

async function openFirstCoachPlayerDetail(page) {
  const row = page.locator('[data-testid="coach-players-interactive-dashboard"] button').filter({ hasText: /Open|View|Review/ }).first();
  if (await row.count()) {
    await row.click();
    await page.waitForTimeout(250);
    return;
  }
  const fallback = page.locator('[data-testid="coach-players-interactive-dashboard"] button').last();
  if (await fallback.count()) {
    await fallback.click();
    await page.waitForTimeout(250);
  }
}

async function validateResponsivePage(page, role, navKey, width) {
  await page.setViewportSize({ width, height: 844 });
  await enterDemo(page, role);
  if (navKey) await navigateByKey(page, navKey);
  await expectNoHorizontalOverflow(page);
  if (role === "player") await expectPlayerIdentityInsideViewport(page);
}

test("Phase 3A captures auth and the complete Coach mobile hierarchy at iPhone width", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await installSafeRoutes(page);
  await page.goto("/");
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
  await expectPersistentFeedbackRestored(page);
  await capture(page, "01-auth-entry.png", { authenticated: false });

  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await capture(page, "02-coach-home.png");

  await navigateByKey(page, "players");
  await expectCompactFunctionalIntro(page);
  await capture(page, "03-coach-players.png");

  await openFirstCoachPlayerDetail(page);
  await expectCompactFunctionalIntro(page);
  await capture(page, "04-coach-player-detail.png");

  await navigateByKey(page, "events");
  await expectCompactFunctionalIntro(page);
  await capture(page, "05-coach-schedule.png");

  await navigateByKey(page, "drills");
  await expectCompactFunctionalIntro(page);
  await capture(page, "06-coach-drills.png");

  await navigateByKey(page, "sc");
  await expectCompactFunctionalIntro(page);
  await capture(page, "07-coach-strength.png");

  await navigateByKey(page, "activity");
  await expectCompactFunctionalIntro(page);
  await capture(page, "08-coach-activity.png");

  await navigateByKey(page, "leaderboards");
  await expectCompactFunctionalIntro(page);
  await capture(page, "09-coach-leaderboards.png");

  await navigateByKey(page, "settings");
  await expectCompactFunctionalIntro(page);
  await capture(page, "10-coach-team-account.png");

  await page.getByTestId("coach-administration-header").getByRole("button", { name: "Team Branding", exact: true }).click();
  await expect(page.getByTestId("coach-branding-workspace")).toBeVisible({ timeout: 10_000 });
  await expectCompactFunctionalIntro(page);
  await capture(page, "11-coach-program-branding.png", { authenticated: false });

  expect(pageErrors).toEqual([]);
});

test("Phase 3A captures the complete Player training and progress hierarchy at iPhone width", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterDemo(page, "player");
  await capture(page, "12-player-home.png");

  await navigateByKey(page, "log-drill");
  await expectReadablePlayerMetrics(page, "player-at-home-workspace");
  await expectCompactFunctionalIntro(page);
  await capture(page, "13-player-train.png");

  await navigateByKey(page, "duels");
  await expectCompactFunctionalIntro(page);
  await capture(page, "14-player-program-training.png");

  await navigateByKey(page, "program");
  await expectCompactFunctionalIntro(page);
  await capture(page, "15-player-events.png");

  await navigateByKey(page, "sc");
  await expectCompactFunctionalIntro(page);
  await capture(page, "16-player-lifting.png");

  await navigateByKey(page, "leaderboards");
  await expectReadablePlayerMetrics(page, "player-leaderboards-workspace");
  await expectCompactFunctionalIntro(page);
  await capture(page, "17-player-rankings.png");

  await navigateByKey(page, "profile");
  await expectProgressStoryCommandSurface(page);
  await capture(page, "18-player-progress.png");

  expect(pageErrors).toEqual([]);
});

test("Phase 3A validates first-impression geometry at 375, 390, 393, 402, and 430px", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const width of [375, 390, 393, 402, 430]) {
    await validateResponsivePage(page, "coach", "players", width);
    await capture(page, `responsive-coach-players-${width}.png`);
    await validateResponsivePage(page, "player", "leaderboards", width);
    await capture(page, `responsive-player-rankings-${width}.png`);
  }

  expect(pageErrors).toEqual([]);
});
