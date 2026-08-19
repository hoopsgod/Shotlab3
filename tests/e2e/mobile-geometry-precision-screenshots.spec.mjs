import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-3a-cross-screen-visual-audit");
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 402, height: 874 },
  { width: 430, height: 932 },
];
const SCREENSHOT_WIDTHS = new Set([375, 390, 430]);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) });
  });
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      caret-color: transparent !important;
    }
    html, body { scrollbar-width: none !important; }
    ::-webkit-scrollbar { display: none !important; }
  ` });
}

async function resetToAuth(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
}

async function enterDemo(page, role) {
  await resetToAuth(page);
  const label = role === "coach" ? /Coach demo/i : /Player demo/i;
  await page.getByRole("button", { name: label }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(250);
}

async function navigateByKey(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    const item = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(item).toBeVisible();
    await item.click();
    await expect(sheet).toHaveCount(0);
  }
  await page.waitForTimeout(250);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
  });
  await page.waitForTimeout(100);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(geometry.documentWidth - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - geometry.viewport).toBeLessThanOrEqual(1);
}

async function expectTwentyPixelShellRail(page, role) {
  const selector = role === "coach" ? ".coach-scroll-container" : ".player-scroll-container";
  const rail = await page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element);
    return { left: Number.parseFloat(style.paddingLeft), right: Number.parseFloat(style.paddingRight) };
  });
  expect(rail.left).toBeGreaterThanOrEqual(19.5);
  expect(rail.left).toBeLessThanOrEqual(20.5);
  expect(rail.right).toBeGreaterThanOrEqual(19.5);
  expect(rail.right).toBeLessThanOrEqual(20.5);
}

async function capture(page, name) {
  await expectNoHorizontalOverflow(page);
  const outputPath = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: outputPath, animations: "disabled" });
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
}

async function expectPlayerHomeOpticalRails(page) {
  const coach = page.getByTestId("player-coach-priority-signal");
  await expect(coach).toBeVisible();
  const coachGeometry = await coach.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const heading = element.querySelector("h2")?.getBoundingClientRect();
    const accent = getComputedStyle(element, "::before");
    return {
      textInset: heading ? heading.left - rect.left : -1,
      accentLeft: Number.parseFloat(accent.left),
      accentWidth: Number.parseFloat(accent.width),
    };
  });
  expect(coachGeometry.textInset).toBeGreaterThanOrEqual(7);
  expect(coachGeometry.textInset).toBeLessThanOrEqual(10);
  expect(coachGeometry.accentLeft).toBeLessThanOrEqual(0);
  expect(coachGeometry.accentWidth).toBeGreaterThanOrEqual(2.5);

  const disclosure = page.getByTestId("player-progress-disclosure");
  await expect(disclosure).toBeVisible();
  const disclosureGeometry = await disclosure.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const summary = element.querySelector("summary");
    const copy = summary?.querySelector("span:first-child")?.getBoundingClientRect();
    const control = getComputedStyle(summary, "::after");
    return {
      copyInset: copy ? copy.left - rect.left : -1,
      controlRight: Number.parseFloat(control.right),
    };
  });
  expect(disclosureGeometry.copyInset).toBeGreaterThanOrEqual(1);
  expect(disclosureGeometry.copyInset).toBeLessThanOrEqual(4);
  expect(disclosureGeometry.controlRight).toBeGreaterThanOrEqual(1);
  expect(disclosureGeometry.controlRight).toBeLessThanOrEqual(4);

  const rows = page.locator('[data-command-role="next-actions"] [class*="taskRow"]');
  if (await rows.count()) {
    const root = page.getByTestId("player-daily-command-center");
    const grid = await Promise.all([
      root.evaluate((element) => element.getBoundingClientRect().right),
      rows.first().evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const button = element.querySelector("button")?.getBoundingClientRect();
        return { left: rect.left, right: rect.right, buttonRight: button?.right || rect.right };
      }),
    ]);
    expect(grid[1].buttonRight).toBeLessThanOrEqual(grid[0] + 0.5);
  }
}

async function expectTrainOpticalRails(page) {
  const workspace = page.locator('[data-team-workspace="at-home"]');
  await expect(workspace).toBeVisible();
  const relationship = await workspace.evaluate((element) => {
    const title = element.querySelector('[data-team-identity-stage="true"]')?.getBoundingClientRect();
    const metrics = element.querySelector('[data-layout-role="supporting-evidence"]')?.getBoundingClientRect();
    return {
      titleLeft: title?.left || 0,
      titleRight: title?.right || 0,
      metricsLeft: metrics?.left || 0,
      metricsRight: metrics?.right || 0,
    };
  });
  expect(Math.abs(relationship.titleLeft - relationship.metricsLeft)).toBeLessThanOrEqual(1);
  expect(Math.abs(relationship.titleRight - relationship.metricsRight)).toBeLessThanOrEqual(1);

  const tracker = page.locator(".player-primary-logging-region");
  const plan = page.locator(".player-training-plan");
  if (await tracker.count() && await plan.count()) {
    const [trackerRect, planRect] = await Promise.all([
      tracker.evaluate((element) => element.getBoundingClientRect().toJSON()),
      plan.evaluate((element) => element.getBoundingClientRect().toJSON()),
    ]);
    expect(Math.abs(trackerRect.left - planRect.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(trackerRect.right - planRect.right)).toBeLessThanOrEqual(1);

    const header = plan.locator(".player-training-plan__header");
    const row = plan.locator(".player-drill-row").first();
    if (await header.count() && await row.count()) {
      const [headerRect, rowRect] = await Promise.all([
        header.evaluate((element) => element.getBoundingClientRect().toJSON()),
        row.evaluate((element) => element.getBoundingClientRect().toJSON()),
      ]);
      expect(Math.abs(headerRect.left - rowRect.left)).toBeLessThanOrEqual(1);
    }
  }
}

test("candidate mobile geometry is optically disciplined from 375 through 430", async ({ page }) => {
  await installSafeRoutes(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await enterDemo(page, "player");
    await expectTwentyPixelShellRail(page, "player");
    await expectPlayerHomeOpticalRails(page);
    await resetScroll(page);
    if (SCREENSHOT_WIDTHS.has(viewport.width)) await capture(page, `precision-player-home-${viewport.width}.png`);

    await navigateByKey(page, "log-drill");
    await expectTwentyPixelShellRail(page, "player");
    await expectTrainOpticalRails(page);
    await resetScroll(page);
    if (SCREENSHOT_WIDTHS.has(viewport.width)) await capture(page, `precision-player-train-${viewport.width}.png`);

    if (viewport.width === 390) {
      await navigateByKey(page, "profile");
      await expectTwentyPixelShellRail(page, "player");
      await resetScroll(page);
      await capture(page, "precision-player-progress-390.png");
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "coach");
  await expectTwentyPixelShellRail(page, "coach");
  await resetScroll(page);
  await capture(page, "precision-coach-home-390.png");
  await navigateByKey(page, "players");
  await expectTwentyPixelShellRail(page, "coach");
  await resetScroll(page);
  await capture(page, "precision-coach-players-390.png");
});
