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

async function expectReadableContrast(locator, minimum = 4.5) {
  const result = await locator.evaluate((element) => {
    const parse = (value) => {
      const raw = String(value || "").trim().toLowerCase();
      if (raw.startsWith("color(srgb")) {
        const body = raw.slice(raw.indexOf(" ") + 1, raw.lastIndexOf(")")).trim();
        const [channelsPart, alphaPart] = body.split("/").map((part) => part.trim());
        return { rgb: channelsPart.split(/\s+/).slice(0, 3).map((part) => Number(part) * 255), alpha: alphaPart ? Number(alphaPart) : 1 };
      }
      const numbers = (raw.match(/\d+(?:\.\d+)?/g) || []).map(Number);
      return { rgb: [numbers[0] || 0, numbers[1] || 0, numbers[2] || 0], alpha: Number.isFinite(numbers[3]) ? numbers[3] : 1 };
    };
    const blend = (foreground, background) => foreground.rgb.map((channel, index) => channel * foreground.alpha + background[index] * (1 - foreground.alpha));
    const layers = [];
    let node = element;
    while (node instanceof HTMLElement) {
      const layer = parse(getComputedStyle(node).backgroundColor);
      if (layer.alpha > 0) layers.push(layer);
      node = node.parentElement;
    }
    let background = [255, 255, 255];
    for (const layer of layers.reverse()) background = blend(layer, background);
    const foreground = blend(parse(getComputedStyle(element).color), background);
    const linear = (channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (rgb) => 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
    const foregroundLuminance = luminance(foreground);
    const backgroundLuminance = luminance(background);
    return { ratio: (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05), foreground, background, text: element.textContent?.trim() || "text" };
  });
  expect(result.ratio, `${result.text} contrast ${result.ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minimum);
  return result;
}

test("Coach Leaderboards uses the accepted shared title and dark decision hierarchy", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterCoachDemo(page);
  await openLeaderboards(page);

  const shell = page.getByTestId("coach-page-dashboard-leaderboards");
  const title = shell.locator('[data-identity-role="page-title"]');
  const summary = shell.locator(".teamIdentityTitleStage__summary");
  await expect(title).toHaveText("Leaderboards");
  await expect(summary).toContainText("Recognize the standard");

  const decision = page.getByTestId("coach-page-dashboard-leaderboards-decision-brief");
  await expect(decision).toHaveAttribute("data-surface", "dark");
  await expect(decision).toHaveAttribute("data-route-kind", "leaderboards");
  const decisionTitle = decision.locator("[data-route-stage-title]");
  const decisionDetail = decision.locator("[data-route-stage-detail]");
  const metricRail = decision.locator('[data-visual-role="performance-evidence"]');
  const metrics = metricRail.locator("[data-route-stage-metric]");
  await expect(metrics).toHaveCount(3);
  await expect(metricRail.getByRole("button", { name: /^Ranked Players:/ })).toBeVisible();
  await expect(metricRail.getByRole("button", { name: /^Current Leader:/ })).toBeVisible();
  await expect(metricRail.getByRole("button", { name: /^Archived Seasons:/ })).toBeVisible();
  await expect(metrics.nth(0).locator("[data-route-stage-metric-label]")).toHaveText("Ranked");
  await expect(metrics.nth(1).locator("[data-route-stage-metric-label]")).toHaveText("Leader");
  await expect(metrics.nth(2).locator("[data-route-stage-metric-label]")).toHaveText("Archives");
  const summaryContrast = await expectReadableContrast(summary, 4.5);
  const titleContrast = await expectReadableContrast(decisionTitle, 4.5);
  const detailContrast = await expectReadableContrast(decisionDetail, 4.5);

  const pulse = page.getByTestId("coach-leaderboard-pulse");
  await expect(pulse).toBeVisible();
  await expect(pulse).toContainText("This week");
  await expect(pulse).not.toContainText("Open rank");

  const outputPath = path.join(OUTPUT_DIR, "coach-leaderboards-390x844.png");
  await page.screenshot({ path: outputPath, animations: "disabled" });

  const visualState = await page.evaluate(() => {
    const rectOf = (node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const shellNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards"]');
    const pageSurfaceNode = shellNode?.closest(".pageShell");
    const titleNode = shellNode?.querySelector('[data-identity-role="page-title"]');
    const summaryNode = shellNode?.querySelector(".teamIdentityTitleStage__summary");
    const decisionNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards-decision-brief"]');
    const metricRailNode = decisionNode?.querySelector('[data-visual-role="performance-evidence"]');
    const metricNodes = [...(metricRailNode?.querySelectorAll("[data-route-stage-metric]") || [])];
    const metricValueNode = metricRailNode?.querySelector("[data-route-stage-metric-value]");
    const metricLabelNode = metricRailNode?.querySelector("[data-route-stage-metric-label]");
    const pulseNode = document.querySelector('[data-testid="coach-leaderboard-operational-panel"] .coachLeaderboardPulse');
    const pulseCopyNode = pulseNode?.querySelector(".coachLeaderboardPulseCopy");
    const pulseMetricsNode = pulseNode?.querySelector(".coachLeaderboardPulseMetrics");
    const pulseCards = [...(pulseMetricsNode?.querySelectorAll(":scope > div") || [])];
    const operationalRows = [...document.querySelectorAll('[data-testid="coach-leaderboard-operational-results"] .coachLeaderboardRow')];
    if (!pageSurfaceNode || !titleNode || !summaryNode || !decisionNode || !metricRailNode || !metricValueNode || !metricLabelNode || !pulseNode || !pulseCopyNode || !pulseMetricsNode) {
      throw new Error("Missing Coach Leaderboards visual-contract target");
    }
    const copyStyle = getComputedStyle(pulseCopyNode);
    const metricsStyle = getComputedStyle(pulseMetricsNode);
    const pulseStyle = getComputedStyle(pulseNode);
    return {
      pageBackground: getComputedStyle(pageSurfaceNode).backgroundColor,
      titleFill: getComputedStyle(titleNode).webkitTextFillColor,
      titleColor: getComputedStyle(titleNode).color,
      summaryColor: getComputedStyle(summaryNode).color,
      summaryBackground: getComputedStyle(summaryNode).backgroundColor,
      decisionBackgroundColor: getComputedStyle(decisionNode).backgroundColor,
      firstMetricValueFill: getComputedStyle(metricValueNode).webkitTextFillColor,
      firstMetricLabelFill: getComputedStyle(metricLabelNode).webkitTextFillColor,
      metricCount: metricNodes.length,
      metricDisplay: getComputedStyle(metricRailNode).display,
      metricOverflowX: getComputedStyle(metricRailNode).overflowX,
      metricScrollWidth: metricRailNode.scrollWidth,
      metricClientWidth: metricRailNode.clientWidth,
      metricGeometry: metricNodes.map(rectOf),
      pulseGeometry: [pulseNode, ...pulseCards].map(rectOf),
      pulseCopyGeometry: rectOf(pulseCopyNode),
      pulseMetricsGeometry: rectOf(pulseMetricsNode),
      pulseCopyStyle: { position: copyStyle.position, display: copyStyle.display, gridArea: copyStyle.gridArea, transform: copyStyle.transform, marginTop: copyStyle.marginTop, marginBottom: copyStyle.marginBottom, top: copyStyle.top, bottom: copyStyle.bottom },
      pulseMetricsStyle: { position: metricsStyle.position, display: metricsStyle.display, gridArea: metricsStyle.gridArea, transform: metricsStyle.transform, marginTop: metricsStyle.marginTop, marginBottom: metricsStyle.marginBottom, top: metricsStyle.top, bottom: metricsStyle.bottom },
      pulseStyle: { borderRadius: pulseStyle.borderRadius, boxShadow: pulseStyle.boxShadow, backgroundColor: pulseStyle.backgroundColor },
      placeholderCount: document.querySelectorAll('[data-leaderboard-placeholder="true"]').length,
      operationalRowCount: operationalRows.length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, "coach-leaderboards-390x844.json"), `${JSON.stringify({ ...visualState, summaryContrast, titleContrast, detailContrast, pageErrors }, null, 2)}\n`);

  expect(visualState.pageBackground).toBe("rgb(247, 248, 242)");
  expect(visualState.titleFill).toBe("rgb(23, 26, 24)");
  expect(visualState.summaryBackground).toBe("rgba(0, 0, 0, 0)");
  const summaryChannels = visualState.summaryColor.match(/\d+/g)?.map(Number).slice(0, 3) || [];
  expect(summaryChannels).toHaveLength(3);
  expect(Math.max(...summaryChannels) - Math.min(...summaryChannels)).toBeLessThanOrEqual(12);
  const backgroundChannels = visualState.decisionBackgroundColor.match(/\d+/g)?.map(Number).slice(0, 3) || [];
  expect(backgroundChannels).toHaveLength(3);
  const linearBackgroundChannels = backgroundChannels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const decisionLuminance = 0.2126 * linearBackgroundChannels[0] + 0.7152 * linearBackgroundChannels[1] + 0.0722 * linearBackgroundChannels[2];
  expect(decisionLuminance, `decision stage must remain a genuinely dark semantic surface; background=${visualState.decisionBackgroundColor}`).toBeLessThanOrEqual(0.08);

  expect(visualState.metricCount).toBe(3);
  expect(visualState.metricDisplay).toBe("grid");
  expect(visualState.metricScrollWidth - visualState.metricClientWidth, `metric rail must fit without hidden horizontal content; overflow-x=${visualState.metricOverflowX}`).toBeLessThanOrEqual(1);
  for (const [index, box] of visualState.metricGeometry.entries()) {
    expect(box.width, `metric ${index + 1} useful width`).toBeGreaterThanOrEqual(95);
    expect(box.height, `metric ${index + 1} height`).toBeGreaterThanOrEqual(44);
  }

  const [pulseBox, ...pulseCards] = visualState.pulseGeometry;
  expect(pulseBox.width).toBeLessThanOrEqual(330);
  expect(pulseCards).toHaveLength(2);
  expect(parseFloat(visualState.pulseStyle.borderRadius)).toBeLessThanOrEqual(1);
  expect(visualState.pulseStyle.boxShadow).toBe("none");
  for (const [index, box] of pulseCards.entries()) {
    expect(box.left, `pulse metric ${index + 1} left containment`).toBeGreaterThanOrEqual(pulseBox.left - 1);
    expect(box.right, `pulse metric ${index + 1} right containment`).toBeLessThanOrEqual(pulseBox.right + 1);
    expect(box.width, `pulse metric ${index + 1} useful width`).toBeGreaterThanOrEqual(120);
  }
  expect(pulseCards[1].left).toBeGreaterThanOrEqual(pulseCards[0].right - 1);
  expect(Math.abs(pulseCards[1].top - pulseCards[0].top)).toBeLessThanOrEqual(2);
  expect(visualState.pulseCopyGeometry.bottom + 6, `pulse copy must clear metrics; copy=${JSON.stringify(visualState.pulseCopyGeometry)} metrics=${JSON.stringify(visualState.pulseMetricsGeometry)} styles=${JSON.stringify({ copy: visualState.pulseCopyStyle, metrics: visualState.pulseMetricsStyle })}`).toBeLessThanOrEqual(visualState.pulseMetricsGeometry.top);
  expect(visualState.placeholderCount).toBe(0);

  expect(visualState.overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
});