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

test.afterAll(() => {
  fs.writeFileSync(path.join(OUTPUT_DIR, "title-stage-geometry.json"), JSON.stringify(metrics, null, 2));
});

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
  const geometry = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  if (STRICT) {
    expect(geometry.documentWidth - geometry.viewport).toBeLessThanOrEqual(1);
    expect(geometry.bodyWidth - geometry.viewport).toBeLessThanOrEqual(1);
  }
  return geometry;
}

async function visibleLegacyBack(page) {
  const candidate = page.getByRole("button", { name: /(?:Back to )?Dashboard/i });
  const count = await candidate.count();
  for (let index = 0; index < count; index += 1) {
    if (await candidate.nth(index).isVisible()) return candidate.nth(index);
  }
  return null;
}

async function inspectEditorialStage(page, { role, screen, width, expectedTitle, expectSingleLine = false }) {
  const stage = page.locator('[data-team-identity-stage="true"][data-title-stage-family="editorial"]').first();
  await expect(stage).toBeVisible({ timeout: 10_000 });
  const title = stage.locator('[data-identity-role="page-title"]');
  await expect(title).toBeVisible();
  await expect(title).toHaveText(expectedTitle);

  const geometry = await stage.evaluate((element) => {
    const rectJson = (rect) => rect ? ({ x: rect.x, y: rect.y, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height }) : null;
    const title = element.querySelector('[data-identity-role="page-title"]');
    const titleRect = title?.getBoundingClientRect();
    const range = document.createRange();
    if (title) range.selectNodeContents(title);
    const lineRects = title ? [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0) : [];
    const lineTops = [...new Set(lineRects.map((rect) => Math.round(rect.top * 2) / 2))];
    const text = title?.textContent || "";
    const textNode = title?.firstChild?.nodeType === Node.TEXT_NODE ? title.firstChild : null;
    const wordFragments = [];
    if (textNode) {
      for (const match of text.matchAll(/\S+/g)) {
        const wordRange = document.createRange();
        wordRange.setStart(textNode, match.index);
        wordRange.setEnd(textNode, match.index + match[0].length);
        const wordRects = [...wordRange.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
        const wordLines = [...new Set(wordRects.map((rect) => Math.round(rect.top * 2) / 2))];
        if (wordLines.length > 1) wordFragments.push(match[0]);
      }
    }
    const mark = element.querySelector('[data-identity-role="brand-panel"]')?.getBoundingClientRect();
    const support = element.querySelector('[data-identity-role="title-support"]')?.getBoundingClientRect();
    const frame = element.closest('.teamIdentityTitleStageFrame') || element;
    const firstContent = frame.nextElementSibling?.getBoundingClientRect() || element.parentElement?.nextElementSibling?.getBoundingClientRect();
    return {
      stage: rectJson(element.getBoundingClientRect()),
      title: rectJson(titleRect),
      titleText: text,
      lineCount: lineTops.length,
      wordFragments,
      mark: rectJson(mark),
      support: rectJson(support),
      firstContent: rectJson(firstContent),
      family: element.getAttribute('data-title-stage-family'),
      mobileStage: element.getAttribute('data-mobile-stage'),
    };
  });

  const overflow = await expectNoHorizontalOverflow(page);
  const back = await visibleLegacyBack(page);
  const backRect = back ? await back.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
  }) : null;
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const combinedTop = backRect ? Math.min(backRect.top, geometry.stage.top) : geometry.stage.top;
  const compositeHeight = geometry.stage.bottom - combinedTop;
  const backGap = backRect ? geometry.stage.top - backRect.bottom : null;
  const row = {
    mode: MODE,
    role,
    screen,
    width,
    expectedTitle,
    viewportWidth,
    ...geometry,
    overflow,
    back: backRect,
    backGap,
    compositeHeight,
    leftRail: geometry.stage.left,
    rightRail: viewportWidth - geometry.stage.right,
  };
  metrics.push(row);

  if (STRICT) {
    expect(geometry.family).toBe("editorial");
    expect(geometry.mobileStage).toBe("editorial");
    expect(geometry.wordFragments, `${role} ${screen} ${width}px must wrap only at word boundaries`).toEqual([]);
    expect(geometry.stage.left, `${role} ${screen} ${width}px left rail`).toBeGreaterThanOrEqual(18.5);
    expect(geometry.stage.left, `${role} ${screen} ${width}px left rail`).toBeLessThanOrEqual(22.5);
    expect(viewportWidth - geometry.stage.right, `${role} ${screen} ${width}px right rail`).toBeGreaterThanOrEqual(18.5);
    expect(viewportWidth - geometry.stage.right, `${role} ${screen} ${width}px right rail`).toBeLessThanOrEqual(22.5);
    if (geometry.mark) expect(geometry.mark.width, `${role} ${screen} ${width}px secondary team mark`).toBeLessThanOrEqual(70.5);
    if (expectSingleLine) expect(geometry.lineCount, `${role} ${screen} ${width}px single-word title`).toBe(1);
    if (/leaderboards/i.test(expectedTitle)) expect(geometry.lineCount, `${role} ${screen} ${width}px Leaderboards must be one line`).toBe(1);
    if (backRect) {
      expect(backRect.width).toBeGreaterThanOrEqual(44);
      expect(backRect.height).toBeGreaterThanOrEqual(44);
      expect(Math.abs(backGap), `${role} ${screen} ${width}px Back must optically attach to the title stage`).toBeLessThanOrEqual(8);
    }
    expect(compositeHeight, `${role} ${screen} ${width}px editorial stage must preserve first-view efficiency`).toBeLessThanOrEqual(290);
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
  metrics.push({ mode: MODE, role: "coach", screen: "home", width, family: "identity", testId: await stage.getAttribute("data-testid") });
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
  { key: "leaderboards", screen: "leaderboards", title: "Leaderboards", single: true },
];

function shouldCapturePlayer(width, screen) {
  if (!SCREENSHOT_WIDTHS.has(width)) return false;
  if (width === 375) return ["home", "train", "progress", "events", "rankings"].includes(screen);
  if (width === 390) return ["home", "train", "progress", "events", "strength", "rankings"].includes(screen);
  if (width === 430) return ["home", "train", "progress", "rankings"].includes(screen);
  return false;
}

function shouldCaptureCoach(width, screen) {
  return SCREENSHOT_WIDTHS.has(width) && ["home", "players", "schedule", "leaderboards"].includes(screen);
}

test("Player title stages preserve identity Home and certify editorial routes from 375 through 430", async ({ page }) => {
  test.setTimeout(240_000);
  await installSafeRoutes(page);
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await enterDemo(page, "player");
    await resetScroll(page);
    await inspectPlayerHome(page, viewport.width);
    if (shouldCapturePlayer(viewport.width, "home")) await capture(page, `${MODE}-player-home-${viewport.width}.png`);

    for (const route of playerRoutes) {
      await navigateByKey(page, route.key);
      await resetScroll(page);
      await inspectEditorialStage(page, { role: "player", screen: route.screen, width: viewport.width, expectedTitle: route.title, expectSingleLine: route.single });
      if (shouldCapturePlayer(viewport.width, route.screen)) await capture(page, `${MODE}-player-${route.screen}-${viewport.width}.png`);
    }
  }
});

test("Coach title stages preserve cinematic Home and certify editorial Players, Schedule and Leaderboards", async ({ page }) => {
  test.setTimeout(210_000);
  await installSafeRoutes(page);
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await enterDemo(page, "coach");
    await resetScroll(page);
    await inspectCoachHome(page, viewport.width);
    if (shouldCaptureCoach(viewport.width, "home")) await capture(page, `${MODE}-coach-home-${viewport.width}.png`);

    for (const route of coachRoutes) {
      await navigateByKey(page, route.key);
      await resetScroll(page);
      await inspectEditorialStage(page, { role: "coach", screen: route.screen, width: viewport.width, expectedTitle: route.title, expectSingleLine: route.single });
      if (shouldCaptureCoach(viewport.width, route.screen)) await capture(page, `${MODE}-coach-${route.screen}-${viewport.width}.png`);
    }
  }
});
