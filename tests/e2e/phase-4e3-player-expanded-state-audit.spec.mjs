import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e3-player-expanded-state-audit");
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
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/leaderboards/participation**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leaderboards: {} }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function resetScroll(page) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
  });
  await settle(page);
}

async function sweepScrollableContent(page) {
  await page.evaluate(async () => {
    const root = document.querySelector(".player-scroll-container");
    const target = root || document.scrollingElement || document.documentElement;
    const viewport = root?.clientHeight || window.innerHeight;
    const scrollHeight = root?.scrollHeight || document.documentElement.scrollHeight;
    const step = Math.max(320, Math.floor(viewport * 0.65));
    for (let top = 0; top <= scrollHeight; top += step) {
      if (root) root.scrollTo(0, top);
      else window.scrollTo(0, top);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 24));
    }
    if (root) root.scrollTo(0, 0);
    else window.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(120);
}

async function enterPlayerDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await resetScroll(page);
}

async function navigate(page, key) {
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
    await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  }
  await resetScroll(page);
}

async function collectAudit(page, surface, state) {
  return page.evaluate(({ selector, surface, state, minTarget }) => {
    const round = (value) => Math.round(value * 10) / 10;
    const describe = (node) => {
      const aria = node.getAttribute("aria-label") || "";
      const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      const placeholder = node.getAttribute("placeholder") || "";
      const testId = node.getAttribute("data-testid") || "";
      const navKey = node.getAttribute("data-nav-key") || "";
      return (aria || text || placeholder || testId || navKey || node.tagName).slice(0, 120);
    };
    const findHorizontalScroller = (node) => {
      let parent = node.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        const overflowX = String(style.overflowX || "").toLowerCase();
        if (["auto", "scroll", "overlay"].includes(overflowX) && parent.scrollWidth > parent.clientWidth + 1) {
          return {
            tag: parent.tagName.toLowerCase(),
            className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 140) : "",
            overflowX,
            clientWidth: round(parent.clientWidth),
            scrollWidth: round(parent.scrollWidth),
          };
        }
        parent = parent.parentElement;
      }
      return null;
    };
    const findAncestorClip = (node, rect, preserveHorizontalScroll) => {
      const hardClip = new Set(["hidden", "clip"]);
      let parent = node.parentElement;
      while (parent && parent !== document.documentElement) {
        const style = getComputedStyle(parent);
        const parentRect = parent.getBoundingClientRect();
        const hiddenByState = parent.hidden || parent.hasAttribute("inert") || parent.getAttribute("aria-hidden") === "true";
        const hiddenByStyle = style.display === "none"
          || style.visibility === "hidden"
          || Number(style.opacity || 1) === 0
          || style.contentVisibility === "hidden";
        if (hiddenByState || hiddenByStyle) {
          return {
            reason: hiddenByState ? "ancestor-state" : "ancestor-style",
            tag: parent.tagName.toLowerCase(),
            className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 140) : "",
            ancestorRect: { width: round(parentRect.width), height: round(parentRect.height), top: round(parentRect.top), bottom: round(parentRect.bottom) },
          };
        }
        const overflowX = String(style.overflowX || "").toLowerCase();
        const overflowY = String(style.overflowY || "").toLowerCase();
        if (!preserveHorizontalScroll && hardClip.has(overflowX)) {
          const width = Math.min(rect.right, parentRect.right) - Math.max(rect.left, parentRect.left);
          if (width <= 1) return { reason: "ancestor-x-clip", tag: parent.tagName.toLowerCase(), className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 140) : "" };
        }
        if (hardClip.has(overflowY)) {
          const height = Math.min(rect.bottom, parentRect.bottom) - Math.max(rect.top, parentRect.top);
          if (height <= 1) return { reason: "ancestor-y-clip", tag: parent.tagName.toLowerCase(), className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 140) : "", ancestorHeight: round(parentRect.height) };
        }
        parent = parent.parentElement;
      }
      return null;
    };

    const visible = [];
    const excluded = [];
    for (const node of document.querySelectorAll(selector)) {
      if (node.disabled || node.getAttribute("aria-disabled") === "true") continue;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0 || rect.width <= 0 || rect.height <= 0) continue;
      const offViewportHorizontally = rect.left < -1 || rect.right > innerWidth + 1;
      const horizontalScroller = offViewportHorizontally ? findHorizontalScroller(node) : null;
      const ancestorClip = findAncestorClip(node, rect, Boolean(horizontalScroller));
      const item = {
        tag: node.tagName.toLowerCase(),
        label: describe(node),
        testId: node.getAttribute("data-testid") || "",
        width: round(rect.width),
        height: round(rect.height),
        left: round(rect.left),
        right: round(rect.right),
        top: round(rect.top),
        bottom: round(rect.bottom),
      };
      if (ancestorClip) {
        excluded.push({ ...item, ancestorClip });
        continue;
      }
      visible.push({
        ...item,
        subTarget: rect.width < minTarget || rect.height < minTarget,
        criticallyTiny: rect.width < 32 || rect.height < 32,
        scrollDependent: Boolean(offViewportHorizontally && horizontalScroller),
        clippedHorizontally: Boolean(offViewportHorizontally && !horizontalScroller),
      });
    }

    const overlaps = [];
    for (let i = 0; i < visible.length; i += 1) {
      for (let j = i + 1; j < visible.length; j += 1) {
        const a = visible[i];
        const b = visible[j];
        const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (width > 2 && height > 2) {
          overlaps.push({
            a: a.label,
            b: b.label,
            width: round(width),
            height: round(height),
            area: round(width * height),
          });
        }
      }
    }

    return {
      surface,
      state,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      visibleCount: visible.length,
      excludedCount: excluded.length,
      subTarget: visible.filter((item) => item.subTarget),
      criticallyTiny: visible.filter((item) => item.criticallyTiny),
      clippedHorizontally: visible.filter((item) => item.clippedHorizontally),
      scrollDependent: visible.filter((item) => item.scrollDependent),
      overlaps,
      visible,
      excluded,
    };
  }, { selector: INTERACTIVE_SELECTOR, surface, state, minTarget: MIN_TOUCH_TARGET });
}

async function expandReachableWorkspaces(page, surface) {
  const opened = [];

  if (surface === "profile") {
    const profileOpener = page.getByTestId("player-progress-open-profile");
    if (await profileOpener.count() && await profileOpener.isVisible()) {
      opened.push({ type: "profile-opener", label: String(await profileOpener.textContent() || "").replace(/\s+/g, " ").trim() });
      await profileOpener.click();
      await settle(page);
    }
  }

  for (let pass = 0; pass < 18; pass += 1) {
    const summaries = page.locator("details:not([open]) > summary:visible");
    if ((await summaries.count()) === 0) break;
    const summary = summaries.first();
    const label = String(await summary.textContent() || "").replace(/\s+/g, " ").trim();
    opened.push({ type: "details", label });
    await summary.click();
    await settle(page);
  }

  await sweepScrollableContent(page);
  await resetScroll(page);
  return opened;
}

function identity(item) {
  return `${item.tag}|${item.label}|${item.testId}|${item.width}|${item.height}`;
}

for (const surface of ["home", "profile", "program", "leaderboards"]) {
  test(`Phase 4E.3 audits Player ${surface} after reachable workspace expansion`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await enterPlayerDemo(page);
    if (surface !== "home") await navigate(page, surface);

    await sweepScrollableContent(page);
    await resetScroll(page);
    const baseline = await collectAudit(page, surface, "default");
    const opened = await expandReachableWorkspaces(page, surface);
    const expanded = await collectAudit(page, surface, "expanded");

    const baselineIds = new Set(baseline.visible.map(identity));
    const newlyReachable = expanded.visible.filter((item) => !baselineIds.has(identity(item)));
    const result = {
      surface,
      opened,
      baseline: {
        visibleCount: baseline.visibleCount,
        excludedCount: baseline.excludedCount,
        subTargetCount: baseline.subTarget.length,
        overlapCount: baseline.overlaps.length,
      },
      expanded: {
        visibleCount: expanded.visibleCount,
        excludedCount: expanded.excludedCount,
        subTargetCount: expanded.subTarget.length,
        criticallyTinyCount: expanded.criticallyTiny.length,
        clippedHorizontallyCount: expanded.clippedHorizontally.length,
        scrollDependentCount: expanded.scrollDependent.length,
        overlapCount: expanded.overlaps.length,
        subTarget: expanded.subTarget,
        overlaps: expanded.overlaps,
        clippedHorizontally: expanded.clippedHorizontally,
      },
      newlyReachable,
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, `player-${surface}-expanded.json`), JSON.stringify(result, null, 2));
    await page.screenshot({
      path: path.join(OUTPUT_DIR, `player-${surface}-expanded.png`),
      fullPage: true,
      animations: "disabled",
    });

    expect(pageErrors).toEqual([]);
    expect(opened.length, `${surface} must expose at least one user-reachable disclosure/open action`).toBeGreaterThan(0);
    expect(expanded.visibleCount, `${surface} expansion must expose additional interaction surface`).toBeGreaterThanOrEqual(baseline.visibleCount);
  });
}
