import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4c-coach-event-manage-hit-area");
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
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterCoachEvents(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  const dockTarget = page.getByTestId("mobile-navigation-dock").locator('[data-nav-key="events"]');
  if (await dockTarget.count()) {
    await dockTarget.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator('[data-nav-key="events"]').click();
  }
  await settle(page);
}

async function captureSearchDiagnostics(page) {
  const input = page.getByTestId("coach-events-filter-rail").getByRole("searchbox");
  await expect(input).toBeVisible();
  return input.evaluate((node) => {
    const style = getComputedStyle(node);
    const matchedRules = [];
    const visitRules = (rules, source) => {
      for (const rule of rules || []) {
        if (rule.cssRules) {
          visitRules(rule.cssRules, source);
          continue;
        }
        if (!rule.selectorText) continue;
        try {
          if (node.matches(rule.selectorText)) matchedRules.push({ source, selector: rule.selectorText, cssText: rule.style?.cssText || "" });
        } catch {}
      }
    };
    for (const sheet of document.styleSheets) {
      try { visitRules(sheet.cssRules, sheet.href || "inline"); } catch {}
    }
    return {
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      borderTopColor: style.borderTopColor,
      borderRadius: style.borderRadius,
      backgroundColor: style.backgroundColor,
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      appearance: style.appearance,
      width: style.width,
      minHeight: style.minHeight,
      matchedRules,
    };
  });
}

test("Coach Events MANAGE micro-actions stay visually quiet while becoming touch-safe", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await enterCoachEvents(page);

  const actions = page.locator("button.coach-event-manage-action");
  await expect(actions).toHaveCount(4);

  const evidence = [];
  for (let index = 0; index < await actions.count(); index += 1) {
    const action = actions.nth(index);
    await expect(action).toBeVisible();
    const box = await action.boundingBox();
    expect(box?.height || 0, `MANAGE target ${index + 1} height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(box?.width || 0, `MANAGE target ${index + 1} width`).toBeGreaterThanOrEqual(44);

    const presentation = await action.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        backgroundColor: style.backgroundColor,
        borderTopWidth: style.borderTopWidth,
        borderRightWidth: style.borderRightWidth,
        borderBottomWidth: style.borderBottomWidth,
        borderLeftWidth: style.borderLeftWidth,
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: style.fontWeight,
        minHeight: Number.parseFloat(style.minHeight),
        paddingTop: Number.parseFloat(style.paddingTop),
        paddingBottom: Number.parseFloat(style.paddingBottom),
      };
    });

    expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(presentation.backgroundColor);
    expect(presentation.borderTopWidth).toBe("0px");
    expect(presentation.borderRightWidth).toBe("0px");
    expect(presentation.borderBottomWidth).toBe("0px");
    expect(presentation.borderLeftWidth).toBe("0px");
    expect(presentation.fontSize).toBeGreaterThanOrEqual(9);
    expect(presentation.fontSize).toBeLessThanOrEqual(11);
    expect(Number(presentation.fontWeight)).toBeGreaterThanOrEqual(800);
    expect(presentation.minHeight).toBeGreaterThanOrEqual(44);
    expect(presentation.paddingTop).toBeGreaterThanOrEqual(9);
    expect(presentation.paddingBottom).toBeGreaterThanOrEqual(9);

    evidence.push({ index, box, presentation });
  }

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth).toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth).toBeLessThanOrEqual(1);

  const searchDiagnostics = await captureSearchDiagnostics(page);

  const first = actions.first();
  await first.scrollIntoViewIfNeeded();
  await page.waitForTimeout(60);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "coach-events-manage-actions.png"), animations: "disabled" });
  await first.screenshot({ path: path.join(OUTPUT_DIR, "coach-event-manage-control.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "coach-event-manage-actions.json"), JSON.stringify({ evidence, viewport, searchDiagnostics }, null, 2));

  await first.click();
  await page.waitForTimeout(80);
  expect(pageErrors).toEqual([]);
});
