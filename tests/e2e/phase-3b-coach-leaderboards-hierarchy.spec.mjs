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

test("Coach Leaderboards uses the accepted light editorial and dark decision hierarchy", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterCoachDemo(page);
  await openLeaderboards(page);

  const shell = page.getByTestId("coach-page-dashboard-leaderboards");
  const title = shell.locator(".secondaryPageIntro__title");
  const summary = shell.locator(".secondaryPageIntro__summary");
  const decision = page.getByTestId("coach-page-dashboard-leaderboards-decision-brief");
  await expect(decision).toHaveAttribute("data-surface", "dark");
  await expect(decision).toHaveAttribute("data-route-kind", "leaderboards");
  const decisionTitle = decision.locator("[data-route-stage-title]");
  const decisionDetail = decision.locator("[data-route-stage-detail]");
  const metricRail = decision.locator('[data-visual-role="performance-evidence"]');
  const metrics = metricRail.locator("[data-route-stage-metric]");
  await expect(metrics).toHaveCount(4);
  const titleContrast = await expectReadableContrast(decisionTitle, 4.5);
  const detailContrast = await expectReadableContrast(decisionDetail, 4.5);

  const outputPath = path.join(OUTPUT_DIR, "coach-leaderboards-390x844.png");
  await page.screenshot({ path: outputPath, animations: "disabled" });

  const visualState = await page.evaluate(() => {
    const rectOf = (node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const shellNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards"]');
    const pageSurfaceNode = shellNode?.closest(".pageShell");
    const titleNode = shellNode?.querySelector(".secondaryPageIntro__title");
    const summaryNode = shellNode?.querySelector(".secondaryPageIntro__summary");
    const decisionNode = document.querySelector('[data-testid="coach-page-dashboard-leaderboards-decision-brief"]');
    const metricRailNode = decisionNode?.querySelector('[data-visual-role="performance-evidence"]');
    const metricNodes = [...(metricRailNode?.querySelectorAll("[data-route-stage-metric]") || [])];
    const metricValueNode = metricRailNode?.querySelector("[data-route-stage-metric-value]");
    const metricLabelNode = metricRailNode?.querySelector("[data-route-stage-metric-label]");
    const pulseNode = document.querySelector('[data-testid="coach-leaderboard-operational-panel"] .coachLeaderboardPulse');
    const pulseCopyNode = pulseNode?.querySelector(".coachLeaderboardPulseCopy");
    const pulseMetricsNode = pulseNode?.querySelector(".coachLeaderboardPulseMetrics");
    const pulseCards = [...(pulseMetricsNode?.querySelectorAll(":scope > div") || [])];
    if (!pageSurfaceNode || !titleNode || !summaryNode || !decisionNode || !metricRailNode || !metricValueNode || !metricLabelNode || !pulseNode || !pulseCopyNode || !pulseMetricsNode) {
      throw new Error("Missing Coach Leaderboards visual-contract target");
    }
    const copyStyle = getComputedStyle(pulseCopyNode);
    const metricsStyle = getComputedStyle(pulseMetricsNode);
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
      metricGeometry: metricNodes.map(rectOf),
      pulseGeometry: [pulseNode, ...pulseCards].map(rectOf),
      pulseCopyGeometry: rectOf(pulseCopyNode),
      pulseMetricsGeometry: rectOf(pulseMetricsNode),
      pulseCopyStyle: { position: copyStyle.position, display: copyStyle.display, gridArea: copyStyle.gridArea, transform: copyStyle.transform, marginTop: copyStyle.marginTop, marginBottom: copyStyle.marginBottom, top: copyStyle.top, bottom: copyStyle.bottom },
      pulseMetricsStyle: { position: metricsStyle.position, display: metricsStyle.display, gridArea: metricsStyle.gridArea, transform: metricsStyle.transform, marginTop: metricsStyle.marginTop, marginBottom: metricsStyle.marginBottom, top: metricsStyle.top, bottom: metricsStyle.bottom },
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, "coach-leaderboards-390x844.json"), `${JSON.stringify({ ...visualState, titleContrast, detailContrast, pageErrors }, null, 2)}\n`);

  expect(visualState.pageBackground).toBe("rgb(247, 248, 242)");
  expect(visualState.titleFill).toBe("rgb(23, 26, 24)");
  expect(visualState.summaryColor).toBe("rgb(93, 102, 95)");
  expect(visualState.summaryBackground).toBe("rgba(0, 0, 0, 0)");
  const backgroundChannels = visualState.decisionBackgroundColor.match(/\d+/g)?.map(Number).slice(0, 3) || [];
  expect(Math.max(...backgroundChannels)).toBeLessThan(45);

  expect(visualState.metricCount).toBe(4);
  expect(visualState.metricDisplay).toBe("grid");
  expect(visualState.metricOverflowX).toBe("auto");
  for (const [index, box] of visualState.metricGeometry.entries()) {
    expect(box.width, `metric ${index + 1} width`).toBeGreaterThanOrEqual(118);
    expect(box.height, `metric ${index + 1} height`).toBeGreaterThanOrEqual(44);
  }

  const [pulse, ...pulseCards] = visualState.pulseGeometry;
  expect(pulse.width).toBeLessThanOrEqual(330);
  expect(pulseCards).toHaveLength(2);
  for (const [index, box] of pulseCards.entries()) {
    expect(box.left, `pulse card ${index + 1} left containment`).toBeGreaterThanOrEqual(pulse.left - 1);
    expect(box.right, `pulse card ${index + 1} right containment`).toBeLessThanOrEqual(pulse.right + 1);
    expect(box.width, `pulse card ${index + 1} useful width`).toBeGreaterThanOrEqual(120);
  }
  expect(pulseCards[1].left).toBeGreaterThanOrEqual(pulseCards[0].right - 1);
  expect(Math.abs(pulseCards[1].top - pulseCards[0].top)).toBeLessThanOrEqual(2);
  expect(visualState.pulseCopyGeometry.bottom + 6, `pulse copy must clear metric cards; copy=${JSON.stringify(visualState.pulseCopyGeometry)} metrics=${JSON.stringify(visualState.pulseMetricsGeometry)} styles=${JSON.stringify({ copy: visualState.pulseCopyStyle, metrics: visualState.pulseMetricsStyle })}`).toBeLessThanOrEqual(visualState.pulseMetricsGeometry.top);

  expect(visualState.overflow).toBeLessThanOrEqual(1);
  expect(pageErrors).toEqual([]);
  expect(fs.statSync(outputPath).size).toBeGreaterThan(20_000);
});
