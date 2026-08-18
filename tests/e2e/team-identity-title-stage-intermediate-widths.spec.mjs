import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT = path.resolve(process.cwd(), "artifacts/team-identity-title-stage-intermediate-widths");
fs.mkdirSync(OUTPUT, { recursive: true });

const VIEWPORTS = [
  { width: 393, height: 844 },
  { width: 402, height: 844 },
];

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterPlayerDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}" });
  await page.getByRole("button", { name: /player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
}

async function navigate(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await page.waitForTimeout(200);
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(geometry.document - geometry.viewport).toBeLessThanOrEqual(1);
  expect(geometry.body - geometry.viewport).toBeLessThanOrEqual(1);
}

async function measureSharedStage(page, variant) {
  const stage = page.locator(`[data-team-identity-stage="true"][data-variant="${variant}"]:visible`).first();
  await expect(stage).toBeVisible();
  return stage.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const title = element.querySelector("h1");
    const crest = element.querySelector('[data-identity-role="brand-mark"]');
    const fallback = element.querySelector('[data-identity-role="brand-fallback"]');
    const crestRect = (crest || fallback)?.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewport: innerWidth,
      titleSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      crestWidth: crestRect?.width || 0,
      crestHeight: crestRect?.height || 0,
      objectFit: crest ? getComputedStyle(crest).objectFit : "fallback",
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`${viewport.width}px preserves Hero and standard team-title geometry without overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterPlayerDemo(page);

    const hero = await measureSharedStage(page, "hero");
    expect(hero.left).toBeGreaterThanOrEqual(-1);
    expect(hero.right).toBeLessThanOrEqual(hero.viewport + 1);
    expect(hero.titleSize).toBeGreaterThanOrEqual(44);
    expect(hero.titleSize).toBeLessThanOrEqual(60);
    expect(hero.crestWidth).toBeGreaterThanOrEqual(104);
    expect(hero.crestHeight).toBeGreaterThanOrEqual(104);
    if (hero.objectFit !== "fallback") expect(hero.objectFit).toBe("contain");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(OUTPUT, `intermediate-${viewport.width}-player-home.png`), animations: "disabled", fullPage: false });

    await navigate(page, "leaderboards");
    const standard = await measureSharedStage(page, "standard");
    expect(standard.left).toBeGreaterThanOrEqual(-1);
    expect(standard.right).toBeLessThanOrEqual(standard.viewport + 1);
    expect(standard.titleSize).toBeGreaterThanOrEqual(38);
    expect(standard.titleSize).toBeLessThanOrEqual(44);
    expect(standard.crestWidth).toBeGreaterThanOrEqual(92);
    expect(standard.crestHeight).toBeGreaterThanOrEqual(92);
    if (standard.objectFit !== "fallback") expect(standard.objectFit).toBe("contain");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: path.join(OUTPUT, `intermediate-${viewport.width}-player-leaderboards.png`), animations: "disabled", fullPage: false });
  });
}
