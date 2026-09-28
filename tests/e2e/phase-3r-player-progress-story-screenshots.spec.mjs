import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");
const clarityWidths = [320, 360, 375, 390, 402, 430, 468];

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function captureViewport(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function noOverflow(page) {
  const amount = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(amount).toBeLessThanOrEqual(1);
}

async function openPlayerProgress(page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await dock.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const story = page.getByTestId("player-progress-story");
  await expect(story).toBeVisible({ timeout: 20_000 });
  return { dock, story };
}

test("player progress opens with ShotLab Target Court before deep analytics", async ({ page }) => {
  await installRoutes(page);
  const { story } = await openPlayerProgress(page);
  await expect(story.getByText("DEVELOPMENT STORY", { exact: true })).toBeVisible();
  await expect(story.getByTestId("player-progress-target-court")).toBeVisible();
  await expect(story.getByTestId("player-progress-target-summary")).toBeVisible();
  const targetVisual = story.getByTestId("player-progress-target-visual");
  await expect(targetVisual).toBeVisible();
  await expect(targetVisual).toHaveAttribute("data-performance-visual", "shotlab-target-court");
  await expect(targetVisual).toHaveAttribute("role", "img");
  await expect(targetVisual).toHaveAttribute("aria-label", /made today|target/i);
  await expect(story.getByTestId("player-progress-metrics")).toBeVisible();
  await expect(story.getByTestId("player-progress-strongest-signal")).toBeVisible();
  await expect(story.getByTestId("player-progress-opportunity")).toBeVisible();
  await expect(story.getByTestId("player-progress-next-focus")).toBeVisible();
  await expect(story.getByTestId("player-progress-start-focus")).toBeVisible();
  await expect(story.getByTestId("player-progress-open-profile")).toBeVisible();
  await expect(page.getByTestId("player-progress-full-profile")).toBeVisible();
  await expect(page.getByTestId("player-profile-readout")).toBeHidden();
  await expect(story.getByTestId("player-progress-trend-chart")).toHaveCount(0);

  const heroStyle = await story.getByTestId("player-progress-story-hero").evaluate((node) => {
    const probe = document.createElement("span");
    probe.style.backgroundColor = "var(--team-brand-surface-deep)";
    node.appendChild(probe);
    const brandSurfaceDeep = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      backgroundColor: getComputedStyle(node).backgroundColor,
      backgroundImage: getComputedStyle(node).backgroundImage,
      radius: getComputedStyle(node).borderRadius,
      titleColor: getComputedStyle(node.querySelector("h2")).color,
      brandSurfaceDeep,
    };
  });
  expect(heroStyle.brandSurfaceDeep).not.toBe("rgba(0, 0, 0, 0)");
  expect(heroStyle.backgroundColor).toBe(heroStyle.brandSurfaceDeep);
  expect(heroStyle.backgroundColor).not.toBe("rgb(15, 20, 18)");
  expect(heroStyle.backgroundImage).toContain("gradient");
  expect(parseFloat(heroStyle.radius)).toBe(18);
  expect(heroStyle.titleColor).toBe("rgb(248, 250, 245)");

  const transparentHeroSeams = [
    "player-progress-story-topline",
    "player-progress-story-hero-grid",
    "player-progress-story-copy",
    "player-progress-target-court",
  ];
  for (const testId of transparentHeroSeams) {
    const style = await story.getByTestId(testId).evaluate((node) => ({
      backgroundColor: getComputedStyle(node).backgroundColor,
      backgroundImage: getComputedStyle(node).backgroundImage,
    }));
    expect(style.backgroundColor, `${testId} must stay transparent inside dark hero`).toBe("rgba(0, 0, 0, 0)");
    expect(style.backgroundImage, `${testId} must not receive demo background art`).toBe("none");
  }

  const courtBox = await targetVisual.boundingBox();
  const heroBox = await story.getByTestId("player-progress-story-hero").boundingBox();
  expect(courtBox).not.toBeNull();
  expect(heroBox).not.toBeNull();
  expect(courtBox.x).toBeGreaterThanOrEqual(heroBox.x - 1);
  expect(courtBox.x + courtBox.width).toBeLessThanOrEqual(heroBox.x + heroBox.width + 1);

  const focusStyle = await story.getByTestId("player-progress-start-focus").evaluate((node) => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    color: getComputedStyle(node).color,
  }));
  expect(focusStyle.backgroundColor).toBe("rgb(200, 255, 26)");
  expect(focusStyle.color).toBe("rgb(16, 19, 16)");
  await noOverflow(page);

  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  await page.waitForTimeout(120);
  await captureViewport(page, "04v-player-progress-target-court.png");

  await story.getByTestId("player-progress-open-profile").click();
  const readout = page.getByTestId("player-profile-readout");
  await expect(readout).toBeVisible({ timeout: 10_000 });
  await expect(readout).not.toContainText(/demo-(?:home|program)-/i);
  await expect(page.getByTestId("player-profile-performance-intelligence")).toBeVisible();
  await expect(page.getByTestId("player-profile-drill-development")).toBeVisible();
  await readout.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await noOverflow(page);
  await captureViewport(page, "04w-player-progress-full-profile.png");
});

test("player progress metrics remain readable and clear of the mobile dock across the phone matrix", async ({ browser }) => {
  for (const width of clarityWidths) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      colorScheme: "dark",
      locale: "en-US",
      timezoneId: "America/New_York",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await installRoutes(page);
    const { story } = await openPlayerProgress(page);
    const metrics = story.getByTestId("player-progress-metrics");
    await expect(metrics).toBeVisible();

    const geometry = await metrics.evaluate((node) => {
      const items = [...node.children].map((item) => {
        const label = item.querySelector("[data-performance-kind] span");
        const detail = item.querySelector("[data-performance-kind] small");
        const box = item.getBoundingClientRect();
        const labelStyle = label ? getComputedStyle(label) : null;
        const detailStyle = detail ? getComputedStyle(detail) : null;
        const lineHeight = (style) => style ? Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2 : 0;
        return {
          width: box.width,
          x: box.x,
          label: label?.textContent?.trim() || "",
          detail: detail?.textContent?.trim() || "",
          labelHeight: label?.getBoundingClientRect().height || 0,
          detailHeight: detail?.getBoundingClientRect().height || 0,
          labelLineHeight: lineHeight(labelStyle),
          detailLineHeight: lineHeight(detailStyle),
        };
      });
      return { items, viewport: window.innerWidth, scrollWidth: document.documentElement.scrollWidth };
    });

    expect(geometry.items, `${width}px should keep all three progress metrics`).toHaveLength(3);
    expect(geometry.items[0].width, `${width}px first metric should retain usable width`).toBeGreaterThan(100);
    expect(geometry.items[1].width, `${width}px second metric should retain usable width`).toBeGreaterThan(100);
    expect(geometry.items[2].width, `${width}px third metric should span the mobile row`).toBeGreaterThan(geometry.items[0].width * 1.8);
    expect(Math.abs(geometry.items[0].x - geometry.items[2].x), `${width}px third metric should return to the left rail`).toBeLessThanOrEqual(1);
    for (const item of geometry.items) {
      expect(item.label, `${width}px metric label should stay present`).not.toBe("");
      expect(item.detail, `${width}px metric detail should stay present`).not.toBe("");
      expect(item.labelHeight, `${width}px ${item.label} should not wrap word-by-word`).toBeLessThanOrEqual(item.labelLineHeight * 2.15);
      expect(item.detailHeight, `${width}px ${item.detail} should not wrap word-by-word`).toBeLessThanOrEqual(item.detailLineHeight * 2.15);
    }
    expect(geometry.scrollWidth - geometry.viewport, `${width}px should not horizontally overflow`).toBeLessThanOrEqual(1);

    await page.evaluate(() => {
      const scroller = document.querySelector(".player-scroll-container");
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
      window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "auto" });
    });
    await page.waitForTimeout(80);
    const landing = await page.evaluate(() => {
      const action = document.querySelector('[data-testid="player-progress-open-profile"]')?.getBoundingClientRect();
      const dockNode = document.querySelector('[data-testid="mobile-navigation-dock"]')?.getBoundingClientRect();
      return action && dockNode ? { actionBottom: action.bottom, dockTop: dockNode.top } : null;
    });
    expect(landing, `${width}px should expose both final action and dock geometry`).not.toBeNull();
    expect(landing.actionBottom, `${width}px final Progress action must remain above the fixed dock`).toBeLessThanOrEqual(landing.dockTop - 4);
    await context.close();
  }
});
