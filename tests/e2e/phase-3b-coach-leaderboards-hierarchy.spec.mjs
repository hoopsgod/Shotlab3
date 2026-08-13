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
  const metricStrip = page.getByTestId("coach-page-dashboard-leaderboards-metric-strip");
  const metrics = metricStrip.locator("[data-premium-metric]");

  const outputPath = path.join(OUTPUT_DIR, "coach-leaderboards-390x844.png");
  await page.screenshot({ path: outputPath, animations: "disabled" });

  const visualState = await page.evaluate(() => {
    const shellNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards"]');
    const pageSurfaceNode = shellNode?.closest(".pageShell");
    const titleNode = shellNode?.querySelector(".secondaryPageIntro__title");
    const summaryNode = shellNode?.querySelector(".secondaryPageIntro__summary");
    const decisionNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards-decision-brief"]');
    const decisionTitleNode = decisionNode?.querySelector("h2");
    const metricStripNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards-metric-strip"]');
    const metricNodes = [...(metricStripNode?.querySelectorAll("[data-premium-metric]") || [])];
    const metricValueNode = metricStripNode?.querySelector("[data-premium-metric-value]");
    const metricLabelNode = metricStripNode?.querySelector("[data-premium-metric-label]");
    if (!pageSurfaceNode || !titleNode || !summaryNode || !decisionNode || !decisionTitleNode || !metricStripNode || !metricValueNode || !metricLabelNode) {
      throw new Error("Missing Coach Leaderboards visual-contract target");
    }
    const metricGeometry = metricNodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, width: rect.width };
    });
    return {
      pageBackground: getComputedStyle(pageSurfaceNode).backgroundColor,
      titleFill: getComputedStyle(titleNode).webkitTextFillColor,
      titleColor: getComputedStyle(titleNode).color,
      summaryColor: getComputedStyle(summaryNode).color,
      summaryBackground: getComputedStyle(summaryNode).backgroundColor,
      decisionTitleColor: getComputedStyle(decisionTitleNode).color,
      decisionBackgroundImage: getComputedStyle(decisionNode).backgroundImage,
      firstMetricValueFill: getComputedStyle(metricValueNode).webkitTextFillColor,
      firstMetricLabelFill: getComputedStyle(metricLabelNode).webkitTextFillColor,
      metricCount: metricNodes.length,
      metricDisplay: getComputedStyle(metricStripNode).display,
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
  expect(visualState.decisionTitleColor).toBe("rgb(245, 247, 244)");
  expect(visualState.decisionBackgroundImage).toContain("linear-gradient");
  expect(visualState.firstMetricValueFill).toBe("rgb(23, 26, 24)");
  expect(visualState.firstMetricLabelFill).toBe("rgb(82, 96, 89)");
  expect(visualState.metricCount).toBe(4);
  expect(visualState.metricDisplay).toBe("grid");

  const metricGeometry = visualState.metricGeometry;
  expect(metricGeometry[0].right).toBeLessThanOrEqual(374);
  expect(metricGeometry[1].right).toBeLessThanOrEqual(374);
  expect(Math.abs(metricGeometry[0].top - metricGeometry[1].top)).toBeLessThanOrEqual(1);
  expect(metricGeometry[2].top).toBeGreaterThan(metricGeometry[0].top + 60);
  expect(Math.abs(metricGeometry[0].width - metricGeometry[1].width)).toBeLessThanOrEqual(2);

  expect(visualState.overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
});