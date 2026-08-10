import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e-compact-control-readiness-audit");
const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[role='button']",
  "[role='tab']",
  "[role='switch']",
  "[role='checkbox']",
].join(",");
const MIN_TOUCH_TARGET = 43.5;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

async function navigate(page, key) {
  const direct = page.getByTestId("mobile-navigation-dock").locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await settle(page);
}

async function simulate44pt(page, role, surface) {
  const result = await page.evaluate(async ({ selector, role, surface }) => {
    const round = (value) => Math.round(value * 10) / 10;
    const describe = (node) => {
      const aria = node.getAttribute("aria-label") || "";
      const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      const placeholder = node.getAttribute("placeholder") || "";
      const testId = node.getAttribute("data-testid") || "";
      return (aria || text || placeholder || testId || node.tagName).slice(0, 120);
    };
    const visibleTargets = () => [...document.querySelectorAll(selector)].filter((node) => {
      if (node.disabled || node.getAttribute("aria-disabled") === "true") return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    });

    const beforeTargets = visibleTargets();
    const before = beforeTargets.map((node, index) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        index,
        label: describe(node),
        tag: node.tagName.toLowerCase(),
        className: typeof node.className === "string" ? node.className.replace(/\s+/g, " ").trim() : "",
        testId: node.getAttribute("data-testid") || "",
        styleAttribute: node.getAttribute("style") || "",
        width: round(rect.width),
        height: round(rect.height),
        fontSize: style.fontSize,
        borderRadius: style.borderRadius,
        display: style.display,
        sub44: rect.width < 44 || rect.height < 44,
      };
    });

    const targetIndexes = before.filter((target) => target.sub44).map((target) => target.index);
    const beforeScrollHeight = document.documentElement.scrollHeight;
    const beforeDocumentWidth = document.documentElement.scrollWidth;

    targetIndexes.forEach((index) => {
      const node = beforeTargets[index];
      node.dataset.phase4eSimulated44 = "true";
      node.style.setProperty("min-height", "44px", "important");
      node.style.setProperty("min-width", "44px", "important");
      node.style.setProperty("box-sizing", "border-box", "important");
      node.style.setProperty("touch-action", "manipulation", "important");
    });

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const afterTargets = visibleTargets();
    const simulated = afterTargets
      .filter((node) => node.dataset.phase4eSimulated44 === "true")
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          label: describe(node),
          width: round(rect.width),
          height: round(rect.height),
          left: round(rect.left),
          right: round(rect.right),
          top: round(rect.top),
          bottom: round(rect.bottom),
        };
      });

    const rects = afterTargets.map((node, index) => {
      const rect = node.getBoundingClientRect();
      return { index, node, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    const overlaps = [];
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        if (a.node.contains(b.node) || b.node.contains(a.node)) continue;
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (width > 1 && height > 1) {
          overlaps.push({
            a: describe(a.node),
            b: describe(b.node),
            overlapWidth: round(width),
            overlapHeight: round(height),
          });
        }
      }
    }

    const afterScrollHeight = document.documentElement.scrollHeight;
    return {
      role,
      surface,
      baselineSub44Count: targetIndexes.length,
      before: before.filter((target) => target.sub44),
      simulated,
      overlapCount: overlaps.length,
      overlaps,
      viewportWidth: innerWidth,
      beforeDocumentWidth,
      afterDocumentWidth: document.documentElement.scrollWidth,
      afterBodyWidth: document.body.scrollWidth,
      beforeScrollHeight,
      afterScrollHeight,
      scrollHeightDelta: afterScrollHeight - beforeScrollHeight,
    };
  }, { selector: INTERACTIVE_SELECTOR, role, surface });

  expect(result.simulated).toHaveLength(result.baselineSub44Count);
  for (const target of result.simulated) {
    expect(target.width, `${role}/${surface}/${target.label} simulated width`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(target.height, `${role}/${surface}/${target.label} simulated height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  }
  expect(result.afterDocumentWidth - result.viewportWidth, `${role}/${surface} simulated document overflow`).toBeLessThanOrEqual(1);
  expect(result.afterBodyWidth - result.viewportWidth, `${role}/${surface} simulated body overflow`).toBeLessThanOrEqual(1);
  expect(result.overlaps, `${role}/${surface} simulated controls must not overlap`).toEqual([]);

  fs.writeFileSync(path.join(OUTPUT_DIR, `${role}-${surface}.json`), JSON.stringify(result, null, 2));
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${role}-${surface}-simulated-44pt.png`), fullPage: true, animations: "disabled" });
  return result;
}

function writeSummary(results) {
  const summary = {
    surfaces: results.length,
    baselineSub44Count: results.reduce((sum, result) => sum + result.baselineSub44Count, 0),
    maxScrollHeightDelta: Math.max(...results.map((result) => result.scrollHeightDelta)),
    totalScrollHeightDelta: results.reduce((sum, result) => sum + result.scrollHeightDelta, 0),
    bySurface: Object.fromEntries(results.map((result) => [`${result.role}:${result.surface}`, {
      baselineSub44Count: result.baselineSub44Count,
      scrollHeightDelta: result.scrollHeightDelta,
      overlapCount: result.overlapCount,
    }])),
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
}

test("Phase 4E simulates 44pt readiness for all remaining compact core controls", async ({ browser }) => {
  const results = [];

  const coachContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const coachPage = await coachContext.newPage();
  await enterDemo(coachPage, "coach");
  for (const key of ["players", "events", "leaderboards"]) {
    await navigate(coachPage, key);
    results.push(await simulate44pt(coachPage, "coach", key));
  }
  await coachContext.close();

  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerPage = await playerContext.newPage();
  await enterDemo(playerPage, "player");
  results.push(await simulate44pt(playerPage, "player", "home"));
  for (const key of ["profile", "program"]) {
    await navigate(playerPage, key);
    results.push(await simulate44pt(playerPage, "player", key));
  }
  await playerContext.close();

  expect(results.reduce((sum, result) => sum + result.baselineSub44Count, 0)).toBeGreaterThan(0);
  writeSummary(results);
});
