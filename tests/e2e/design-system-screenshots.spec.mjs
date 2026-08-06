import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterDemo(page, role) {
  await installRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: role === "coach" ? "Demo Coach" : "Demo Player", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function noOverflow(page) {
  const amount = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(amount).toBeLessThanOrEqual(1);
}

async function capture(page, name) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  await noOverflow(page);
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true, animations: "disabled" });
}

async function captureViewport(page, name) {
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
  await noOverflow(page);
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false, animations: "disabled" });
}

async function more(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  return sheet;
}

test("Phase 1 fixed mobile viewport presents one coherent visual system", async ({ browser }) => {
  const openPage = async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      screen: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "en-US",
      timezoneId: "America/New_York",
    });
    const page = await context.newPage();
    await installRoutes(page);
    return { context, page };
  };

  {
    const { context, page } = await openPage();
    await page.goto("/");
    await expect(page.getByTestId("auth-workspace")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Demo Player", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Demo Coach", exact: true })).toBeVisible();
    const canvas = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg-0").trim().toLowerCase());
    expect(canvas).toBe("#f3f0e8");
    await captureViewport(page, "phase-1-00-sign-in-390x844");
    await context.close();
  }

  {
    const { context, page } = await openPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Demo Player", exact: true }).click();
    await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
    await captureViewport(page, "phase-1-01-player-home-390x844");
    await context.close();
  }

  {
    const { context, page } = await openPage();
    await page.goto("/");
    await page.getByRole("button", { name: "Demo Coach", exact: true }).click();
    await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("coach-primary-objective")).toBeVisible();
    await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible();
    await captureViewport(page, "phase-1-02-coach-home-390x844");
    await context.close();
  }
});

test("Player visual system remains integrated across core and secondary pages", async ({ page }) => {
  await enterDemo(page, "player");
  await capture(page, "01-player-home");

  let sheet = await more(page);
  await sheet.locator('[data-nav-key="leaderboards"]').click();
  await expect(page.getByTestId("premium-leaderboards-hub")).toBeVisible({ timeout: 20_000 });
  await capture(page, "02-player-leaderboards");

  sheet = await more(page);
  await sheet.locator('[data-nav-key="profile"]').click();
  await expect(page.getByTestId("player-career-history")).toBeVisible({ timeout: 20_000 });
  await capture(page, "03-player-profile-career");

  sheet = await more(page);
  await sheet.locator('[data-nav-key="team-store"]').click();
  const store = page.getByRole("dialog", { name: "Team Store" });
  await expect(store).toBeVisible();
  await capture(page, "04-player-team-store");
});

test("Coach visual system remains integrated across command and management pages", async ({ page }) => {
  await enterDemo(page, "coach");
  await capture(page, "05-coach-home");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
  await capture(page, "06-coach-players");

  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Events", exact: true }).click();
  await capture(page, "07-coach-events");

  let sheet = await more(page);
  await sheet.locator('[data-nav-key="drills"]').click();
  await expect(page.locator("#coach-drills-management")).toBeVisible({ timeout: 20_000 });
  await capture(page, "08-coach-drills");

  sheet = await more(page);
  await sheet.locator('[data-nav-key="team-store"]').click();
  await expect(page.getByRole("dialog", { name: "Team Store" })).toBeVisible();
  await capture(page, "09-coach-team-store");
});
