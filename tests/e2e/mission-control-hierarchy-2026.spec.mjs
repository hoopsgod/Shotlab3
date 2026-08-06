import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "artifacts/mission-control-phase-2";

test.use({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
});

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
}

test.beforeAll(() => mkdirSync(SCREENSHOT_DIR, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await installSafeRoutes(page);
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("Coach Mission Control presents one premium mobile hierarchy", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();

  const commandCenter = page.getByTestId("coach-command-center-full");
  const hero = page.getByTestId("coach-primary-objective");
  const metrics = page.getByTestId("coach-primary-metrics");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  await expect(hero).toBeVisible();
  await expect(metrics).toBeVisible();

  await expect(page.locator(".mcHeader")).toBeVisible();
  await expect(page.locator(".mcHeroTeamMark")).toBeVisible();
  await expect(page.locator(".mcTeamSelect")).toBeVisible();
  await expect(page.locator(".mcBell")).toBeVisible();
  await expect(page.locator(".mcMobileMenu")).toBeVisible();
  await expect(page.locator(".mcPrimary")).toBeVisible();
  await expect(metrics.locator("button")).toHaveCount(3);

  const presentation = await page.evaluate(() => {
    const hero = document.querySelector(".mcHero");
    const mark = document.querySelector(".mcHeroTeamMark");
    const primary = document.querySelector(".mcPrimary");
    const section = document.querySelector(".mcSection");
    const reality = document.querySelector(".mcRealityStrip");
    const heroStyle = getComputedStyle(hero);
    const markStyle = getComputedStyle(mark);
    const primaryStyle = getComputedStyle(primary);
    const sectionStyle = section ? getComputedStyle(section) : null;
    const realityStyle = getComputedStyle(reality);
    return {
      heroBackground: heroStyle.backgroundImage,
      heroMaxHeight: heroStyle.maxHeight,
      heroRadius: parseFloat(heroStyle.borderRadius),
      markBackground: markStyle.backgroundColor,
      markWidth: parseFloat(markStyle.width),
      primaryBackground: primaryStyle.backgroundColor,
      primaryHeight: parseFloat(primaryStyle.minHeight),
      supportingBackground: sectionStyle?.backgroundColor || "",
      metricColumns: realityStyle.gridTemplateColumns.split(" ").filter(Boolean).length,
    };
  });

  expect(presentation.heroBackground).toContain("linear-gradient");
  expect(["none", "0px"]).toContain(presentation.heroMaxHeight);
  expect(presentation.heroRadius).toBeGreaterThanOrEqual(20);
  expect(presentation.markBackground).toBe("rgba(0, 0, 0, 0)");
  expect(presentation.markWidth).toBeGreaterThanOrEqual(60);
  expect(presentation.primaryBackground).toBe("rgb(200, 255, 26)");
  expect(presentation.primaryHeight).toBeGreaterThanOrEqual(44);
  expect(presentation.supportingBackground).toBe("rgb(255, 255, 255)");
  expect(presentation.metricColumns).toBe(3);

  await expectNoHorizontalOverflow(page);
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/coach-mission-control-390x844.png` });
});
