import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4a-interaction-state-audit");
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
const MIN_FRACTIONAL_44_TARGET = 43.5;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function stabilize(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(120);
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await stabilize(page);
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
    await expect(page.getByTestId("mobile-navigation-sheet")).toHaveCount(0);
  }
  await stabilize(page);
}

async function collectSurfaceAudit(page, role, key) {
  const result = await page.evaluate(({ selector, role, key, minTarget }) => {
    const round = (value) => Math.round(value * 10) / 10;
    const describe = (node) => {
      const aria = node.getAttribute("aria-label") || "";
      const text = String(node.textContent || "").replace(/\s+/g, " ").trim();
      const placeholder = node.getAttribute("placeholder") || "";
      const testId = node.getAttribute("data-testid") || "";
      const navKey = node.getAttribute("data-nav-key") || "";
      return (aria || text || placeholder || testId || navKey || node.tagName).slice(0, 100);
    };
    const findHorizontalScroller = (node) => {
      let parent = node.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = getComputedStyle(parent);
        const overflowX = String(parentStyle.overflowX || "").toLowerCase();
        const scrollable = ["auto", "scroll", "overlay"].includes(overflowX) && parent.scrollWidth > parent.clientWidth + 1;
        if (scrollable) {
          return {
            tag: parent.tagName.toLowerCase(),
            testId: parent.getAttribute("data-testid") || "",
            className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 160) : "",
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
        const parentStyle = getComputedStyle(parent);
        const parentRect = parent.getBoundingClientRect();
        const hiddenByState = parent.hidden || parent.hasAttribute("inert") || parent.getAttribute("aria-hidden") === "true";
        const hiddenByStyle = parentStyle.display === "none"
          || parentStyle.visibility === "hidden"
          || Number(parentStyle.opacity || 1) === 0
          || parentStyle.contentVisibility === "hidden";
        if (hiddenByState || hiddenByStyle) {
          return {
            reason: hiddenByState ? "ancestor-state" : "ancestor-style",
            tag: parent.tagName.toLowerCase(),
            className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 160) : "",
            overflowX: String(parentStyle.overflowX || "").toLowerCase(),
            overflowY: String(parentStyle.overflowY || "").toLowerCase(),
            ancestorRect: {
              left: round(parentRect.left),
              right: round(parentRect.right),
              top: round(parentRect.top),
              bottom: round(parentRect.bottom),
              width: round(parentRect.width),
              height: round(parentRect.height),
            },
          };
        }

        const overflowX = String(parentStyle.overflowX || "").toLowerCase();
        const overflowY = String(parentStyle.overflowY || "").toLowerCase();
        if (!preserveHorizontalScroll && hardClip.has(overflowX)) {
          const intersectionWidth = Math.min(rect.right, parentRect.right) - Math.max(rect.left, parentRect.left);
          if (intersectionWidth <= 1) {
            return {
              reason: "ancestor-x-clip",
              tag: parent.tagName.toLowerCase(),
              className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 160) : "",
              overflowX,
              overflowY,
              ancestorRect: {
                left: round(parentRect.left),
                right: round(parentRect.right),
                top: round(parentRect.top),
                bottom: round(parentRect.bottom),
                width: round(parentRect.width),
                height: round(parentRect.height),
              },
            };
          }
        }
        if (hardClip.has(overflowY)) {
          const intersectionHeight = Math.min(rect.bottom, parentRect.bottom) - Math.max(rect.top, parentRect.top);
          if (intersectionHeight <= 1) {
            return {
              reason: "ancestor-y-clip",
              tag: parent.tagName.toLowerCase(),
              className: typeof parent.className === "string" ? parent.className.replace(/\s+/g, " ").trim().slice(0, 160) : "",
              overflowX,
              overflowY,
              ancestorRect: {
                left: round(parentRect.left),
                right: round(parentRect.right),
                top: round(parentRect.top),
                bottom: round(parentRect.bottom),
                width: round(parentRect.width),
                height: round(parentRect.height),
              },
            };
          }
        }
        parent = parent.parentElement;
      }
      return null;
    };

    const seen = new Set();
    const targets = [];
    const excludedAncestorClipped = [];
    for (const node of document.querySelectorAll(selector)) {
      if (seen.has(node)) continue;
      seen.add(node);
      if (node.disabled || node.getAttribute("aria-disabled") === "true") continue;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) === 0 || rect.width <= 0 || rect.height <= 0) continue;

      const offViewportHorizontally = rect.left < -1 || rect.right > innerWidth + 1;
      const horizontalScroller = offViewportHorizontally ? findHorizontalScroller(node) : null;
      const ancestorClip = findAncestorClip(node, rect, Boolean(horizontalScroller));
      if (ancestorClip) {
        excludedAncestorClipped.push({
          tag: node.tagName.toLowerCase(),
          label: describe(node),
          testId: node.getAttribute("data-testid") || "",
          navKey: node.getAttribute("data-nav-key") || "",
          width: round(rect.width),
          height: round(rect.height),
          left: round(rect.left),
          right: round(rect.right),
          top: round(rect.top),
          bottom: round(rect.bottom),
          ancestorClip,
        });
        continue;
      }

      const scrollDependent = Boolean(offViewportHorizontally && horizontalScroller);
      const clippedHorizontally = Boolean(offViewportHorizontally && !horizontalScroller);
      const sub44 = rect.width < minTarget || rect.height < minTarget;
      const criticallyTiny = rect.width < 32 || rect.height < 32;
      targets.push({
        tag: node.tagName.toLowerCase(),
        role: node.getAttribute("role") || "",
        label: describe(node),
        testId: node.getAttribute("data-testid") || "",
        navKey: node.getAttribute("data-nav-key") || "",
        width: round(rect.width),
        height: round(rect.height),
        left: round(rect.left),
        right: round(rect.right),
        top: round(rect.top),
        bottom: round(rect.bottom),
        sub44,
        criticallyTiny,
        clippedHorizontally,
        scrollDependent,
        horizontalScroller,
      });
    }
    return {
      role,
      key,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      interactiveCount: targets.length,
      excludedAncestorClippedCount: excludedAncestorClipped.length,
      excludedAncestorClipped,
      sub44: targets.filter((target) => target.sub44),
      criticallyTiny: targets.filter((target) => target.criticallyTiny),
      clippedHorizontally: targets.filter((target) => target.clippedHorizontally),
      scrollDependent: targets.filter((target) => target.scrollDependent),
      targets,
    };
  }, { selector: INTERACTIVE_SELECTOR, role, key, minTarget: MIN_FRACTIONAL_44_TARGET });

  fs.writeFileSync(path.join(OUTPUT_DIR, `${role}-${key}.json`), JSON.stringify(result, null, 2));
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${role}-${key}.png`), animations: "disabled" });

  expect(result.documentWidth - result.viewport.width, `${role}/${key} document must not overflow horizontally`).toBeLessThanOrEqual(1);
  expect(result.bodyWidth - result.viewport.width, `${role}/${key} body must not overflow horizontally`).toBeLessThanOrEqual(1);
  return result;
}

async function auditMoreSheet(page, role) {
  const trigger = page.getByTestId("mobile-navigation-more");
  await trigger.click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(sheet).toHaveAttribute("role", "dialog");
  await expect(sheet).toHaveAttribute("aria-modal", "true");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  const close = page.getByRole("button", { name: "Close more navigation" });
  await expect(close).toBeFocused();
  const closeBox = await close.boundingBox();
  expect(closeBox?.width || 0, `${role} More close target width`).toBeGreaterThanOrEqual(MIN_FRACTIONAL_44_TARGET);
  expect(closeBox?.height || 0, `${role} More close target height`).toBeGreaterThanOrEqual(MIN_FRACTIONAL_44_TARGET);

  const focusable = sheet.locator("button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])");
  const count = await focusable.count();
  expect(count, `${role} More sheet must contain actionable destinations`).toBeGreaterThan(1);
  await focusable.nth(count - 1).focus();
  await page.keyboard.press("Tab");
  await expect(close, `${role} More focus trap must wrap to the first control`).toBeFocused();

  const evidence = {
    role,
    closeTarget: {
      width: Math.round((closeBox?.width || 0) * 1000) / 1000,
      height: Math.round((closeBox?.height || 0) * 1000) / 1000,
    },
    focusableCount: count,
    dialog: true,
    modal: true,
    bodyScrollLocked: true,
    focusTrapVerified: true,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, `${role}-more-sheet.json`), JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${role}-more-sheet.png`), animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
}

function buildSummary(role, audits) {
  return {
    role,
    surfaceCount: audits.length,
    interactiveCount: audits.reduce((sum, audit) => sum + audit.interactiveCount, 0),
    excludedAncestorClippedCount: audits.reduce((sum, audit) => sum + audit.excludedAncestorClippedCount, 0),
    sub44Count: audits.reduce((sum, audit) => sum + audit.sub44.length, 0),
    criticallyTinyCount: audits.reduce((sum, audit) => sum + audit.criticallyTiny.length, 0),
    clippedControlCount: audits.reduce((sum, audit) => sum + audit.clippedHorizontally.length, 0),
    scrollDependentCount: audits.reduce((sum, audit) => sum + audit.scrollDependent.length, 0),
    excludedAncestorClippedBySurface: Object.fromEntries(audits.map((audit) => [audit.key, audit.excludedAncestorClippedCount])),
    sub44BySurface: Object.fromEntries(audits.map((audit) => [audit.key, audit.sub44.length])),
    criticallyTinyBySurface: Object.fromEntries(audits.map((audit) => [audit.key, audit.criticallyTiny.length])),
    clippedBySurface: Object.fromEntries(audits.map((audit) => [audit.key, audit.clippedHorizontally.length])),
    scrollDependentBySurface: Object.fromEntries(audits.map((audit) => [audit.key, audit.scrollDependent.length])),
    excludedAncestorClipped: audits.flatMap((audit) => audit.excludedAncestorClipped.map((target) => ({ surface: audit.key, ...target }))),
    criticallyTiny: audits.flatMap((audit) => audit.criticallyTiny.map((target) => ({ surface: audit.key, ...target }))),
    clippedHorizontally: audits.flatMap((audit) => audit.clippedHorizontally.map((target) => ({ surface: audit.key, ...target }))),
    scrollDependent: audits.flatMap((audit) => audit.scrollDependent.map((target) => ({ surface: audit.key, ...target }))),
    sub44: audits.flatMap((audit) => audit.sub44.map((target) => ({ surface: audit.key, ...target }))),
  };
}

function writeAndGateSummary(role, audits) {
  const summary = buildSummary(role, audits);
  fs.writeFileSync(path.join(OUTPUT_DIR, `${role}-summary.json`), JSON.stringify(summary, null, 2));
  expect(summary.clippedHorizontally, `${role} must not expose accidental horizontally clipped controls`).toEqual([]);
}

test("Phase 4A audits Coach interaction ergonomics and More-sheet behavior", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterDemo(page, "coach");

  const audits = [];
  audits.push(await collectSurfaceAudit(page, "coach", "home"));
  for (const key of ["players", "events", "leaderboards"]) {
    await navigateByKey(page, key);
    audits.push(await collectSurfaceAudit(page, "coach", key));
  }
  await navigateByKey(page, "feed");
  await auditMoreSheet(page, "coach");
  expect(pageErrors).toEqual([]);

  const scrollDependentLabels = audits.flatMap((audit) => audit.scrollDependent.map((target) => target.label));
  expect(scrollDependentLabels.some((label) => /Top Engagement/.test(label)), "Coach Top Engagement must remain audit-visible through its horizontal scroller").toBe(true);
  expect(scrollDependentLabels.some((label) => /^Meeting/.test(label)), "Coach Meeting must remain audit-visible through its horizontal scroller").toBe(true);

  writeAndGateSummary("coach", audits);
});

test("Phase 4A audits Player interaction ergonomics and More-sheet behavior", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterDemo(page, "player");

  const audits = [];
  audits.push(await collectSurfaceAudit(page, "player", "home"));
  for (const key of ["log-drill", "profile", "program", "leaderboards"]) {
    await navigateByKey(page, key);
    audits.push(await collectSurfaceAudit(page, "player", key));
  }
  await navigateByKey(page, "home");
  await auditMoreSheet(page, "player");
  expect(pageErrors).toEqual([]);

  const programAudit = audits.find((audit) => audit.key === "program");
  const excludedProgramRsvpActions = (programAudit?.excludedAncestorClipped || []).filter((target) => /YOU'RE LOCKED IN|RSVP NOW/.test(target.label));
  expect(excludedProgramRsvpActions.length, "collapsed Player Program RSVP controls must not be counted as visible interaction debt").toBeGreaterThanOrEqual(4);

  writeAndGateSummary("player", audits);
});