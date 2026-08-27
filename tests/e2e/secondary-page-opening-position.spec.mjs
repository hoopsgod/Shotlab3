import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/secondary-page-opening-position");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function resetToAuth(page) {
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}" });
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
}

async function enterDemo(page, role) {
  await resetToAuth(page);
  await page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
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
}

async function seedStaleMobileScroll(page) {
  return page.evaluate(() => {
    document.querySelector('[data-opening-position-scroll-seed="true"]')?.remove();
    const style = document.createElement("style");
    style.dataset.openingPositionScrollSeed = "true";
    style.textContent = `
      .player-scroll-container, .coach-scroll-container, .content-wrap {
        padding-bottom: 1500px !important;
      }
    `;
    document.head.append(style);

    const candidates = [
      document.querySelector(".player-scroll-container"),
      document.querySelector(".coach-scroll-container"),
      document.querySelector(".content-wrap"),
      document.scrollingElement,
    ].filter(Boolean);

    for (const candidate of candidates) {
      const max = Math.max(0, candidate.scrollHeight - candidate.clientHeight);
      if (max < 80) continue;
      candidate.scrollTop = Math.min(520, max);
      if (candidate.scrollTop > 40) {
        return { seeded: true, className: candidate.className || "document", scrollTop: candidate.scrollTop };
      }
    }
    return { seeded: false, className: "none", scrollTop: 0 };
  });
}

async function clearScrollSeed(page) {
  await page.evaluate(() => document.querySelector('[data-opening-position-scroll-seed="true"]')?.remove());
}

async function assertOpeningPosition(page, expectedTitle, screenshotName) {
  const stage = page.locator('[data-team-identity-stage="true"][data-title-stage-family="editorial"]').first();
  await expect(stage).toBeVisible({ timeout: 10_000 });
  await expect(stage.locator('[data-identity-role="page-title"]')).toHaveText(expectedTitle);
  await page.waitForTimeout(120);

  const geometry = await stage.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const local = element.closest(".player-scroll-container, .coach-scroll-container, .content-wrap");
    return {
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: window.innerHeight,
      localScrollTop: local?.scrollTop || 0,
      documentScrollTop: document.scrollingElement?.scrollTop || 0,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  expect(geometry.top, `${expectedTitle} heading must not load above the viewport`).toBeGreaterThanOrEqual(0);
  expect(geometry.top, `${expectedTitle} heading should open near the top landing zone`).toBeLessThan(180);
  expect(geometry.bottom, `${expectedTitle} title stage must intersect the visible viewport`).toBeGreaterThan(40);
  expect(geometry.localScrollTop, `${expectedTitle} local route scroller must reset`).toBeLessThanOrEqual(1);
  expect(geometry.documentScrollTop, `${expectedTitle} document scroller must reset`).toBeLessThanOrEqual(1);
  expect(geometry.documentWidth - geometry.viewportWidth).toBeLessThanOrEqual(1);

  await page.screenshot({ path: path.join(OUTPUT_DIR, screenshotName), animations: "disabled" });
}

test("Player secondary heading opens fully visible after stale mobile scroll", async ({ page }) => {
  test.setTimeout(90_000);
  await installSafeRoutes(page);
  await enterDemo(page, "player");
  const seeded = await seedStaleMobileScroll(page);
  expect(seeded.seeded, `expected a stale Player scroll seed, got ${JSON.stringify(seeded)}`).toBe(true);
  await navigateByKey(page, "log-drill");
  await assertOpeningPosition(page, "At Home Training", "player-at-home-opening-390.png");
  await clearScrollSeed(page);
});

test("Coach secondary heading opens fully visible and uses premium editorial authority", async ({ page }) => {
  test.setTimeout(90_000);
  await installSafeRoutes(page);
  await enterDemo(page, "coach");
  const seeded = await seedStaleMobileScroll(page);
  expect(seeded.seeded, `expected a stale Coach scroll seed, got ${JSON.stringify(seeded)}`).toBe(true);
  await navigateByKey(page, "players");
  await assertOpeningPosition(page, "Players", "coach-players-opening-390.png");

  const titleStyle = await page.locator('[data-visual-role="page-intro"] [data-identity-role="page-title"]').evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight };
  });
  expect(titleStyle.fontFamily).toMatch(/Barlow Condensed|Arial Narrow/i);
  expect(Number.parseFloat(titleStyle.fontSize)).toBeGreaterThanOrEqual(41);
  expect(Number(titleStyle.fontWeight)).toBeGreaterThanOrEqual(800);
  await clearScrollSeed(page);
});
