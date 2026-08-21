import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4d-shared-back-hit-area");
const VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 360, height: 780 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 402, height: 874 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
];
const SCREENSHOT_WIDTHS = new Set([320, 390, 402, 430]);
const COACH_ROUTES = [
  { key: "players", screen: "players", title: "Players" },
  { key: "events", screen: "schedule", title: "Events", control: true },
  { key: "drills", screen: "drills", title: "Drills" },
  { key: "sc", screen: "strength", title: "S&C" },
  { key: "activity", screen: "activity", title: "Activity" },
  { key: "leaderboards", screen: "leaderboards", title: "Leaderboards" },
];
const evidence = [];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.describe.configure({ mode: "serial" });
test.afterAll(() => fs.writeFileSync(path.join(OUTPUT_DIR, "phase1-coach-mobile-geometry.json"), JSON.stringify(evidence, null, 2)));

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
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  const demo = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

async function navigate(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible({ timeout: 5_000 });
    const destination = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(destination, `mobile navigation destination ${key}`).toHaveCount(1);
    await destination.click();
    await expect(sheet).toHaveCount(0, { timeout: 5_000 });
  }
  await settle(page);
}

async function verifyMoreSheet(page) {
  const trigger = page.getByTestId("mobile-navigation-more");
  await trigger.click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  const close = page.getByRole("button", { name: /close more navigation/i });
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
}

const expectedCrestWidth = (width) => width <= 390 ? 84 : Math.min(108, Math.max(96, width * 0.25));

async function inspectCoachRoute(page, route, width) {
  const stage = page.locator('[data-team-identity-stage="true"][data-title-stage-family="editorial"]').first();
  await expect(stage).toBeVisible({ timeout: 10_000 });
  await expect(stage.locator('[data-identity-role="page-title"]')).toHaveText(route.title);

  const legacyBack = page.locator("button.shared-dashboard-back-action");
  if (await legacyBack.count()) await expect(legacyBack).toBeHidden();

  const geometry = await page.evaluate(() => {
    const rect = (node) => node ? (() => { const r = node.getBoundingClientRect(); return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height }; })() : null;
    const titleStage = document.querySelector('[data-team-identity-stage="true"][data-title-stage-family="editorial"]');
    const title = titleStage?.querySelector('[data-identity-role="page-title"]');
    const crest = titleStage?.querySelector('[data-identity-role="brand-mark"], [data-identity-role="brand-fallback"]');
    const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    const legacy = document.querySelector('button.shared-dashboard-back-action');
    const legacyStyle = legacy ? getComputedStyle(legacy) : null;
    const titleStyle = title ? getComputedStyle(title) : null;
    const titleRect = title?.getBoundingClientRect();
    return {
      viewport: innerWidth,
      clientWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      stage: rect(titleStage),
      title: title ? { text: title.textContent?.trim() || "", ...rect(title), lineHeight: Number.parseFloat(titleStyle?.lineHeight || "0"), lineCount: titleRect && Number.parseFloat(titleStyle?.lineHeight || "0") ? Math.round(titleRect.height / Number.parseFloat(titleStyle.lineHeight)) : null } : null,
      crest: crest ? { ...rect(crest), objectFit: getComputedStyle(crest).objectFit } : null,
      dock: rect(dock),
      legacy: legacy ? { text: String(legacy.textContent || "").replace(/\s+/g, " ").trim(), display: legacyStyle?.display, visibility: legacyStyle?.visibility, ...rect(legacy) } : null,
    };
  });

  expect(geometry.clientWidth).toBe(width);
  expect(geometry.documentWidth - width, `${route.screen} ${width}px document overflow`).toBeLessThanOrEqual(1);
  expect(geometry.bodyWidth - width, `${route.screen} ${width}px body overflow`).toBeLessThanOrEqual(1);
  expect(geometry.stage?.left || 0, `${route.screen} ${width}px left rail`).toBeGreaterThanOrEqual(18.5);
  expect(geometry.stage?.left || 999, `${route.screen} ${width}px left rail`).toBeLessThanOrEqual(22.5);
  expect(width - (geometry.stage?.right || 0), `${route.screen} ${width}px right rail`).toBeGreaterThanOrEqual(18.5);
  expect(width - (geometry.stage?.right || 0), `${route.screen} ${width}px right rail`).toBeLessThanOrEqual(22.5);
  expect(geometry.legacy?.display ?? "none", `${route.screen} legacy Coach Dashboard row must not participate in mobile layout`).toBe("none");
  if (geometry.legacy) {
    expect(geometry.legacy.width).toBe(0);
    expect(geometry.legacy.height).toBe(0);
  }
  const targetCrest = expectedCrestWidth(width);
  expect(geometry.crest?.width || 0, `${route.screen} ${width}px crest width`).toBeGreaterThanOrEqual(targetCrest - 1.5);
  expect(geometry.crest?.width || 0, `${route.screen} ${width}px crest width`).toBeLessThanOrEqual(targetCrest + 1.5);
  if (geometry.crest?.objectFit) expect(geometry.crest.objectFit).toBe("contain");
  expect(geometry.dock?.left ?? -1).toBeGreaterThanOrEqual(0);
  expect(geometry.dock?.right ?? width + 1).toBeLessThanOrEqual(width + 0.5);

  evidence.push({ role: "coach", state: "demo", route: route.screen, width, ...geometry });
  if (SCREENSHOT_WIDTHS.has(width)) {
    await page.screenshot({ path: path.join(OUTPUT_DIR, `phase1-coach-demo-${route.screen}-${width}-default.png`), animations: "disabled" });
  }
  return geometry;
}

for (const viewport of VIEWPORTS) {
  test(`Coach secondary geometry retires the stale Dashboard row at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await enterDemo(page, "coach");
    await verifyMoreSheet(page);

    const routeEvidence = [];
    for (const route of COACH_ROUTES) {
      await navigate(page, route.key);
      routeEvidence.push({ route, geometry: await inspectCoachRoute(page, route, viewport.width) });
    }

    const controlTop = routeEvidence.find(({ route }) => route.control)?.geometry.stage?.top;
    expect(Number.isFinite(controlTop), `${viewport.width}px Events control stage top`).toBe(true);
    for (const { route, geometry } of routeEvidence) {
      expect(Math.abs((geometry.stage?.top || 0) - controlTop), `${route.screen} ${viewport.width}px title-stage top should share intentional secondary rhythm`).toBeLessThanOrEqual(2.5);
    }

    if (viewport.width === 390) {
      for (const key of ["settings", "branding"]) {
        await navigate(page, key);
        const legacy = page.locator("button.shared-dashboard-back-action");
        if (await legacy.count()) await expect(legacy).toBeHidden();
        const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
        expect(widths.document - widths.viewport).toBelessThanOrEqual(1);
        expect(widths.body - widths.viewport).toBeLessThanOrEqual(1);
      }
    }
  });
}

test("Player mobile secondary routes retain the existing shared return control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page, "player");
  await navigate(page, "log-drill");
  const back = page.locator("button.shared-dashboard-back-action");
  await expect(back).toHaveCount(1);
  await expect(back).toBeVisible();
  const box = await back.boundingBox();
  expect(box?.width || 0).toBeGreaterThanOrEqual(44);
  expect(box?.height || 0).toBeGreaterThanOrEqual(44);
  const state = await back.evaluate((node) => ({ touchAction: getComputedStyle(node).touchAction, text: String(node.textContent || "").replace(/\s+/g, " ").trim() }));
  expect(state.touchAction).toBe("manipulation");
  expect(state.text).toMatch(/dashboard/i);
  await back.focus();
  await expect(back).toBeFocused();
});
