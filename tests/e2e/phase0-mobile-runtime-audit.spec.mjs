import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/mobile-title-stage-authority-after");
const findings = { viewport: { width: 390, height: 844 }, console: [], pageErrors: [], requestFailures: [], routes: [], more: null };
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: findings.viewport });
test.afterAll(() => fs.writeFileSync(path.join(OUTPUT_DIR, "phase0-runtime-audit.json"), JSON.stringify(findings, null, 2)));

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoachDemo(page) {
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await expect(page.getByRole("button", { name: /Coach demo/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
}

async function navigateByKey(page, key) {
  const direct = page.getByTestId("mobile-navigation-dock").locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) { await direct.click(); return true; }
  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  const item = sheet.locator(`[data-nav-key="${key}"]`);
  if (!(await item.count())) {
    await page.getByRole("button", { name: /close more navigation/i }).click();
    return false;
  }
  await item.click();
  await expect(sheet).toHaveCount(0);
  return true;
}

async function auditCurrentRoute(page, route) {
  await page.waitForTimeout(160);
  const audit = await page.evaluate(() => {
    const rect = (el) => el ? (() => { const r = el.getBoundingClientRect(); return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height }; })() : null;
    const style = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return { fontFamily: s.fontFamily, fontWeight: s.fontWeight, fontSize: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, maxWidth: s.maxWidth, marginTop: s.marginTop, marginBottom: s.marginBottom, position: s.position, overflowX: s.overflowX };
    };
    const stage = document.querySelector('[data-team-identity-stage="true"], [data-team-identity-stage="coach-mission-control"]');
    const title = stage?.querySelector('[data-identity-role="page-title"], h1');
    const identityLine = stage?.querySelector('.teamIdentityTitleStage__identityLine');
    const summary = stage?.querySelector('.teamIdentityTitleStage__summary');
    const status = stage?.querySelector('.teamIdentityTitleStage__status');
    const action = stage?.querySelector('.teamIdentityTitleStage__action');
    const crestImg = stage?.querySelector('img');
    const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    const brokenImages = [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.currentSrc || img.src);
    return {
      url: location.href,
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      fontsStatus: document.fonts?.status || "unknown",
      stage: rect(stage),
      titleText: title?.textContent?.trim() || null,
      typography: { eyebrow: style(identityLine), title: style(title), description: style(summary), status: style(status), cta: style(action) },
      crest: crestImg ? { ...rect(crestImg), objectFit: getComputedStyle(crestImg).objectFit, maxWidth: getComputedStyle(crestImg).maxWidth, maxHeight: getComputedStyle(crestImg).maxHeight } : null,
      dock: dock ? { ...rect(dock), ...style(dock), paddingBottom: getComputedStyle(dock).paddingBottom } : null,
      brokenImages,
    };
  });
  findings.routes.push({ route, ...audit });
}

test("Phase 0 direct mobile runtime, typography, asset and navigation telemetry", async ({ page }) => {
  test.setTimeout(180_000);
  await installSafeRoutes(page);
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) findings.console.push({ type: message.type(), text: message.text() }); });
  page.on("pageerror", (error) => findings.pageErrors.push({ message: error.message, stack: error.stack || null }));
  page.on("requestfailed", (request) => findings.requestFailures.push({ url: request.url(), method: request.method(), failure: request.failure()?.errorText || "unknown" }));

  await enterCoachDemo(page);
  await auditCurrentRoute(page, "home");
  for (const key of ["players", "events", "drills", "sc", "leaderboards", "branding", "team-store"]) {
    const available = await navigateByKey(page, key);
    if (available) await auditCurrentRoute(page, key);
    else findings.routes.push({ route: key, available: false });
  }

  await page.getByTestId("mobile-navigation-more").click();
  const sheet = page.getByTestId("mobile-navigation-sheet");
  await expect(sheet).toBeVisible();
  findings.more = await sheet.evaluate((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height, position: s.position, overflowY: s.overflowY };
  });

  expect(findings.routes.some((route) => route.route === "home")).toBe(true);
  expect(findings.routes.some((route) => route.route === "players" && route.titleText === "Players")).toBe(true);
});
