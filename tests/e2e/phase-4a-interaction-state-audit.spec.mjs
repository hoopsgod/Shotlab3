import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4a-interaction-state-audit");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

const TARGET_SELECTOR = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="button"]:not([aria-disabled="true"]), [role="tab"]:not([aria-disabled="true"])';

async function settle(page, { resetScroll = false } = {}) {
  await page.evaluate(async ({ resetScroll }) => {
    if (document.fonts?.ready) await document.fonts.ready;
    if (resetScroll) {
      window.scrollTo(0, 0);
      document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
      document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, { resetScroll });
  await page.waitForTimeout(140);
}

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(`${role} demo`, "i") }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page, { resetScroll: true });
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
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await settle(page, { resetScroll: true });
}

async function collectSurfaceAudit(page, role, key) {
  const audit = await page.evaluate(({ selector, role, key }) => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    };
    const isExcludedByAncestor = (node) => {
      let ancestor = node.parentElement;
      while (ancestor && ancestor !== document.body) {
        const style = getComputedStyle(ancestor);
        if ((style.overflow === "hidden" || style.overflowX === "hidden") && !visible(ancestor)) return true;
        if (ancestor.getAttribute("aria-hidden") === "true") return true;
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return true;
        ancestor = ancestor.parentElement;
      }
      return false;
    };
    const labelOf = (node) => String(node.getAttribute("aria-label") || node.textContent || node.getAttribute("placeholder") || node.tagName).replace(/\s+/g, " ").trim().slice(0, 110);
    const roots = role === "coach"
      ? [document.querySelector(".coach-scroll-container"), document.querySelector(".pageShell")].filter(Boolean)
      : [document.querySelector(".player-scroll-container"), document.querySelector("main"), document.querySelector(".pageShell")].filter(Boolean);
    const seen = new Set();
    const nodes = roots.flatMap((root) => [...root.querySelectorAll(selector)]).filter((node) => {
      if (seen.has(node)) return false;
      seen.add(node);
      return true;
    });
    const viewportWidth = window.innerWidth;
    const targets = [];
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const parent = node.parentElement;
      const parentStyle = parent ? getComputedStyle(parent) : null;
      const excludedAncestor = isExcludedByAncestor(node);
      const scrollParent = (() => {
        let cursor = node.parentElement;
        while (cursor && cursor !== document.body) {
          const cursorStyle = getComputedStyle(cursor);
          if (["auto", "scroll"].includes(cursorStyle.overflowX) && cursor.scrollWidth > cursor.clientWidth + 1) return cursor;
          cursor = cursor.parentElement;
        }
        return null;
      })();
      targets.push({
        label: labelOf(node),
        tag: node.tagName.toLowerCase(),
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        visible: visible(node),
        excludedAncestor,
        scrollDependent: Boolean(scrollParent && (rect.left < 0 || rect.right > viewportWidth)),
        overflowX: parentStyle?.overflowX || "",
        touchAction: style.touchAction,
      });
    }
    const interactable = targets.filter((target) => target.visible && !target.excludedAncestor);
    return {
      role,
      key,
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      targets,
      excludedAncestorClipped: targets.filter((target) => target.excludedAncestor && (target.left < 0 || target.right > viewportWidth)),
      criticallyTiny: interactable.filter((target) => target.width < 32 || target.height < 32),
      clippedHorizontally: interactable.filter((target) => !target.scrollDependent && (target.left < -1 || target.right > viewportWidth + 1)),
      scrollDependent: interactable.filter((target) => target.scrollDependent),
      sub44: interactable.filter((target) => target.width < 44 || target.height < 44),
    };
  }, { selector: TARGET_SELECTOR, role, key });
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${role}-${key}.png`), fullPage: true, animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, `${role}-${key}.json`), JSON.stringify(audit, null, 2));
  return audit;
}

async function auditMoreSheet(page, role) {
  const more = page.getByTestId("mobile-navigation-more");
  await expect(more).toBeVisible();
  await more.click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  await settle(page);
  const audit = await page.evaluate((selector) => {
    const sheet = document.querySelector('[data-testid="mobile-navigation-sheet"]');
    const viewportWidth = window.innerWidth;
    const nodes = [...(sheet?.querySelectorAll(selector) || [])];
    return nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { label: String(node.textContent || node.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim(), width: rect.width, height: rect.height, left: rect.left, right: rect.right, clipped: rect.left < -1 || rect.right > viewportWidth + 1 };
    });
  }, TARGET_SELECTOR);
  fs.writeFileSync(path.join(OUTPUT_DIR, `${role}-more-sheet.json`), JSON.stringify(audit, null, 2));
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${role}-more-sheet.png`), animations: "disabled" });
  for (const target of audit) {
    expect(target.clipped, `${role} More-sheet control must not clip: ${target.label}`).toBe(false);
  }
  await page.keyboard.press("Escape");
}

function buildSummary(role, audits) {
  return {
    role,
    surfaces: audits.map((audit) => audit.key),
    targetCountBySurface: Object.fromEntries(audits.map((audit) => [audit.key, audit.targets.length])),
    sub44BySurface: Object.fromEntries(audits.map((audit) => [audit.key, audit.sub44.length])),
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
  // Events intentionally removes its type-filter rail in a true zero-event state; the global clipping gate still covers it whenever rendered.

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
  const programRsvpActions = (programAudit?.targets || []).filter((target) => /YOU'RE LOCKED IN|RSVP NOW/.test(target.label));
  const interactableProgramRsvpActions = programRsvpActions.filter((target) => target.visible && !target.excludedAncestor);
  for (const target of interactableProgramRsvpActions) {
    expect(target.width, `Player Program RSVP control must be at least 44px wide: ${target.label}`).toBeGreaterThanOrEqual(44);
    expect(target.height, `Player Program RSVP control must be at least 44px tall: ${target.label}`).toBeGreaterThanOrEqual(44);
    expect(target.left, `Player Program RSVP control must not clip left: ${target.label}`).toBeGreaterThanOrEqual(-1);
    expect(target.right, `Player Program RSVP control must not clip right: ${target.label}`).toBeLessThanOrEqual((programAudit?.viewportWidth || 390) + 1);
  }

  writeAndGateSummary("player", audits);
});