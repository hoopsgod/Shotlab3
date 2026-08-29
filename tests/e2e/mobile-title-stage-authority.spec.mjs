import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const MODE = process.env.TITLE_STAGE_EVIDENCE_MODE || "after";
const STRICT = MODE !== "baseline";
const OUTPUT_DIR = path.resolve(process.cwd(), `artifacts/mobile-title-stage-authority-${MODE}`);
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 402, height: 874 },
  { width: 430, height: 932 },
];
const SCREENSHOT_WIDTHS = new Set([375, 390, 430]);
const metrics = [];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });
test.afterAll(() => fs.writeFileSync(path.join(OUTPUT_DIR, "title-stage-geometry.json"), JSON.stringify(metrics, null, 2)));

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function suppressMotion(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; caret-color: transparent !important; }
    html, body { scrollbar-width: none !important; }
    ::-webkit-scrollbar { display: none !important; }
  ` });
}

async function resetToAuth(page) {
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await suppressMotion(page);
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
}

async function enterDemo(page, role) {
  await resetToAuth(page);
  await page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(180);
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
  await page.waitForTimeout(180);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
  });
  await page.waitForTimeout(80);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  if (STRICT) {
    expect(geometry.documentWidth - geometry.viewport).toBeLessThanOrEqual(1);
    expect(geometry.bodyWidth - geometry.viewport).toBeLessThanOrEqual(1);
  }
  return geometry;
}

const expectedCrestWidth = (role, width) => {
  if (role === "coach") return width <= 390 ? 68 : Math.min(76, Math.max(68, width * 0.18));
  return width <= 390 ? 64 : Math.min(74, Math.max(64, width * 0.17));
};

async function inspectEditorialStage(page, { role, screen, width, expectedTitle, expectSingleLine = false }) {
  const stage = page.locator('[data-team-identity-stage="true"][data-title-stage-family="editorial"]').first();
  await expect(stage).toBeVisible({ timeout: 10_000 });
  const title = stage.locator('[data-identity-role="page-title"]');
  const crest = stage.locator('[data-identity-role="brand-panel"]');
  await expect(title).toBeVisible();
  await expect(title).toHaveText(expectedTitle);
  await expect(crest).toBeVisible();

  const geometry = await stage.evaluate((element) => {
    const rectJson = (rect) => rect ? ({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height }) : null;
    const title = element.querySelector('[data-identity-role="page-title"]');
    const text = title?.textContent || "";
    const range = document.createRange();
    if (title) range.selectNodeContents(title);
    const lineRects = title ? [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0) : [];
    const lineTops = [...new Set(lineRects.map((rect) => Math.round(rect.top * 2) / 2))];
    const textNode = title?.firstChild?.nodeType === Node.TEXT_NODE ? title.firstChild : null;
    const wordFragments = [];
    if (textNode) {
      for (const match of text.matchAll(/\S+/g)) {
        const wordRange = document.createRange();
        wordRange.setStart(textNode, match.index);
        wordRange.setEnd(textNode, match.index + match[0].length);
        const wordLines = [...new Set([...wordRange.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0).map((rect) => Math.round(rect.top * 2) / 2))];
        if (wordLines.length > 1) wordFragments.push(match[0]);
      }
    }
    return {
      stage: rectJson(element.getBoundingClientRect()),
      mark: rectJson(element.querySelector('[data-identity-role="brand-panel"]')?.getBoundingClientRect()),
      lineCount: lineTops.length,
      wordFragments,
      family: element.getAttribute('data-title-stage-family'),
      mobileStage: element.getAttribute('data-mobile-stage'),
    };
  });

  const overflow = await expectNoHorizontalOverflow(page);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const targetCrest = expectedCrestWidth(role, width);
  metrics.push({ mode: MODE, role, screen, width, expectedTitle, targetCrest, viewportWidth, ...geometry, overflow });

  if (STRICT) {
    expect(geometry.family).toBe("editorial");
    expect(geometry.mobileStage).toBe("editorial");
    expect(geometry.wordFragments, `${role} ${screen} ${width}px must wrap only at word boundaries`).toEqual([]);
    expect(geometry.stage.left, `${role} ${screen} ${width}px left rail`).toBeGreaterThanOrEqual(18.5);
    expect(geometry.stage.left, `${role} ${screen} ${width}px left rail`).toBeLessThanOrEqual(22.5);
    expect(viewportWidth - geometry.stage.right, `${role} ${screen} ${width}px right rail`).toBeGreaterThanOrEqual(18.5);
    expect(viewportWidth - geometry.stage.right, `${role} ${screen} ${width}px right rail`).toBeLessThanOrEqual(22.5);
    expect(geometry.mark.width, `${role} ${screen} ${width}px must use the compact editorial crest footprint`).toBeGreaterThanOrEqual(targetCrest - 1.5);
    expect(geometry.mark.width, `${role} ${screen} ${width}px must use the compact editorial crest footprint`).toBeLessThanOrEqual(targetCrest + 1.5);
    expect(geometry.mark.right, `${role} ${screen} ${width}px crest must remain in the right-side title slot`).toBeLessThanOrEqual(geometry.stage.right + 0.5);
    if (expectSingleLine) expect(geometry.lineCount, `${role} ${screen} ${width}px single-word title`).toBe(1);
    if (/leaderboards/i.test(expectedTitle)) expect(geometry.lineCount, `${role} ${screen} ${width}px Leaderboards must remain one line`).toBe(1);
  }
}

async function inspectPlayerHome(page, width) {
  const stage = page.getByTestId("player-dashboard-identity-header");
  await expect(stage).toBeVisible();
  if (STRICT) {
    await expect(stage).toHaveAttribute("data-title-stage-family", "identity");
    await expect(stage).toHaveAttribute("data-variant", "hero");
    await expect(stage).toHaveAttribute("data-surface", "dark");
  }
  metrics.push({ mode: MODE, role: "player", screen: "home", width, family: await stage.getAttribute("data-title-stage-family") });
  await expectNoHorizontalOverflow(page);
}

async function inspectCoachHome(page, width) {
  const stage = page.locator('[data-team-identity-stage="coach-mission-control"]');
  await expect(stage).toBeVisible();
  metrics.push({ mode: MODE, role: "coach", screen: "home", width, family: "identity" });
  await expectNoHorizontalOverflow(page);
}

async function capture(page, name) {
  const outputPath = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: outputPath, animations: "disabled" });
  expect(fs.statSync(outputPath).size).toBeGreaterThan(15_000);
}

const playerRoutes = [
  { key: "log-drill", screen: "train", title: "At Home Training" },
  { key: "profile", screen: "progress", title: "Progress", single: true },
  { key: "program", screen: "events", title: "Events & Attendance" },
  { key: "sc", screen: "strength", title: "Strength & Conditioning" },
  { key: "leaderboards", screen: "rankings", title: "Leaderboards", single: true },
];

const coachRoutes = [
  { key: "players", screen: "players", title: "Players", single: true },
  { key: "events", screen: "schedule", title: "Events", single: true },
  { key: "sc", screen: "strength", title: "S&C", single: true },
  { key: "leaderboards", screen: "leaderboards", title: "Leaderboards", single: true },
];

function shouldCapture(width) { return SCREENSHOT_WIDTHS.has(width); }

for (const role of ["player", "coach"]) {
  test(`${role} title stages preserve compact editorial branding across 375–430px`, async ({ page }) => {
    test.setTimeout(260_000);
    await installSafeRoutes(page);
    const routes = role === "player" ? playerRoutes : coachRoutes;
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await enterDemo(page, role);
      await resetScroll(page);
      if (role === "player") await inspectPlayerHome(page, viewport.width); else await inspectCoachHome(page, viewport.width);
      if (shouldCapture(viewport.width)) await capture(page, `${MODE}-${role}-home-${viewport.width}.png`);

      for (const route of routes) {
        await navigateByKey(page, route.key);
        await resetScroll(page);
        await inspectEditorialStage(page, { role, screen: route.screen, width: viewport.width, expectedTitle: route.title, expectSingleLine: route.single });
        if (shouldCapture(viewport.width)) await capture(page, `${MODE}-${role}-${route.screen}-${viewport.width}.png`);
      }
    }
  });
}
