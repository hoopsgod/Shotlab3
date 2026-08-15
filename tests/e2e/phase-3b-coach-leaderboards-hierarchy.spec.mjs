import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-3b-coach-leaderboards-hierarchy");
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

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openLeaderboards(page) {
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-nav-key="leaderboards"]').click();
  await expect(page.getByTestId("coach-page-dashboard-leaderboards")).toBeVisible();
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(300);
}

test("Coach Leaderboards uses the accepted light editorial and dark decision hierarchy", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterCoachDemo(page);
  await openLeaderboards(page);

  const shell = page.getByTestId("coach-page-dashboard-leaderboards");
  const pageSurface = shell.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " pageShell ")][1]');
  const title = shell.locator(".secondaryPageIntro__title");
  const summary = shell.locator(".secondaryPageIntro__summary");
  const decision = page.getByTestId("coach-page-dashboard-leaderboards-decision-brief");
  await expect(decision).toHaveAttribute("data-surface", "dark");
  await expect(decision).toHaveAttribute("data-route-kind", "leaderboards");
  const decisionTitle = decision.locator("[data-route-stage-title]");
  const decisionDetail = decision.locator("[data-route-stage-detail]");
  const metricRail = decision.locator('[data-visual-role="performance-evidence"]');
  const metrics = metricRail.locator("[data-route-stage-metric]");

  await expect(decisionTitle).toBeVisible();
  await expect(decisionDetail).toBeVisible();
  await expect(metricRail).toBeVisible();
  await expect(metrics).toHaveCount(4);

  const outputPath = path.join(OUTPUT_DIR, "coach-leaderboards-390x844.png");
  await page.screenshot({ path: outputPath, animations: "disabled" });

  const visualState = await page.evaluate(() => {
    const shellNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards"]');
    const pageSurfaceNode = shellNode?.closest(".pageShell");
    const titleNode = shellNode?.querySelector(".secondaryPageIntro__title");
    const summaryNode = shellNode?.querySelector(".secondaryPageIntro__summary");
    const decisionNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards-decision-brief"]');
    const decisionTitleNode = decisionNode?.querySelector("[data-route-stage-title]");
    const decisionDetailNode = decisionNode?.querySelector("[data-route-stage-detail]");
    const metricRailNode = decisionNode?.querySelector('[data-visual-role="performance-evidence"]');
    const metricNodes = [...(metricRailNode?.querySelectorAll("[data-route-stage-metric]") || [])];
    const metricValueNode = metricRailNode?.querySelector("[data-route-stage-metric-value]");
    const metricLabelNode = metricRailNode?.querySelector("[data-route-stage-metric-label]");
    if (!pageSurfaceNode || !titleNode || !summaryNode || !decisionNode || !decisionTitleNode || !decisionDetailNode || !metricRailNode || !metricValueNode || !metricLabelNode) {
      throw new Error("Missing Coach Leaderboards visual-contract target");
    }
    const metricGeometry = metricNodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    return {
      pageBackground: getComputedStyle(pageSurfaceNode).backgroundColor,
      titleFill: getComputedStyle(titleNode).webkitTextFillColor,
      titleColor: getComputedStyle(titleNode).color,
      summaryColor: getComputedStyle(summaryNode).color,
      summaryBackground: getComputedStyle(summaryNode).backgroundColor,
      decisionTitleColor: getComputedStyle(decisionTitleNode).color,
      decisionDetailColor: getComputedStyle(decisionDetailNode).color,
      decisionBackgroundImage: getComputedStyle(decisionNode).backgroundImage,
      firstMetricValueFill: getComputedStyle(metricValueNode).webkitTextFillColor,
      firstMetricLabelFill: getComputedStyle(metricLabelNode).webkitTextFillColor,
      metricCount: metricNodes.length,
      metricDisplay: getComputedStyle(metricRailNode).display,
      metricOverflowX: getComputedStyle(metricRailNode).overflowX,
      metricGeometry,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, "coach-leaderboards-390x844.json"), `${JSON.stringify({ ...visualState, pageErrors }, null, 2)}\n`);

  expect(visualState.pageBackground).toBe("rgb(247, 248, 242)");
  expect(visualState.titleFill).toBe("rgb(23, 26, 24)");
  const titleChannels = visualState.titleColor.match(/\d+/g)?.map(Number) || [];
  expect(titleChannels.slice(0, 3).every((value) => value <= 40)).toBeTruthy();
  expect(visualState.summaryColor).toBe("rgb(93, 102, 95)");
  expect(visualState.summaryBackground).toBe("rgba(0, 0, 0, 0)");

  const decisionTitleChannels = visualState.decisionTitleColor.match(/\d+/g)?.map(Number).slice(0, 3) || [];
  expect(decisionTitleChannels).toHaveLength(3);
  expect(decisionTitleChannels.every((value) => value >= 240)).toBeTruthy();
  const decisionDetailChannels = visualState.decisionDetailColor.match(/\d+/g)?.map(Number).slice(0, 3) || [];
  expect(decisionDetailChannels).toHaveLength(3);
  expect(decisionDetailChannels.every((value) => value >= 170)).toBeTruthy();
  expect(visualState.decisionBackgroundImage).not.toBe("none");

  const metricValueChannels = visualState.firstMetricValueFill.match(/\d+/g)?.map(Number).slice(0, 3) || [];
  expect(metricValueChannels).toHaveLength(3);
  expect(metricValueChannels.every((value) => value >= 230)).toBeTruthy();
  const metricLabelChannels = visualState.firstMetricLabelFill.match(/\d+/g)?.map(Number).slice(0, 3) || [];
  expect(metricLabelChannels).toHaveLength(3);
  expect(metricLabelChannels.every((value) => value >= 145)).toBeTruthy();
  expect(visualState.metricCount).toBe(4);
  expect(visualState.metricDisplay).toBe("grid");
  expect(visualState.metricOverflowX).toBe("auto");

  for (const [index, box] of visualState.metricGeometry.entries()) {
    expect(box.width, `metric ${index + 1} width`).toBeGreaterThanOrEqual(118);
    expect(box.height, `metric ${index + 1} height`).toBeGreaterThanOrEqual(44);
  }
  for (let index = 1; index < visualState.metricGeometry.length; index += 1) {
    const previous = visualState.metricGeometry[index - 1];
    const current = visualState.metricGeometry[index];
    expect(Math.abs(current.top - previous.top)).toBeLessThanOrEqual(2);
    expect(current.left).toBeGreaterThanOrEqual(previous.right - 2);
  }

  expect(visualState.overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
});
