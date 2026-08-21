import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/mobile-title-stage-authority-before");
const measurements = [];
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });
test.afterAll(() => fs.writeFileSync(path.join(OUTPUT_DIR, "baseline-title-stage-geometry.json"), JSON.stringify(measurements, null, 2)));

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, async (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterDemo(page, role) {
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.addStyleTag({ content: `*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}::-webkit-scrollbar{display:none!important}` });
  await expect(page.getByRole("button", { name: /Player demo/i })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(180);
}

async function navigateByKey(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    const item = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(item).toBeVisible();
    await item.click();
    await expect(sheet).toHaveCount(0);
  }
  await page.waitForTimeout(180);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
  });
}

async function measure(page, role, screen, expectedTitle) {
  const stage = page.locator('[data-team-identity-stage="true"][data-variant="standard"]').first();
  await expect(stage).toBeVisible();
  const title = stage.locator('[data-identity-role="page-title"]');
  await expect(title).toHaveText(expectedTitle);
  const geometry = await stage.evaluate((element) => {
    const rectJson = (rect) => rect ? ({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height }) : null;
    const title = element.querySelector('[data-identity-role="page-title"]');
    const range = document.createRange();
    range.selectNodeContents(title);
    const lineRects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    const lineCount = new Set(lineRects.map((rect) => Math.round(rect.top * 2) / 2)).size;
    const text = title.textContent || "";
    const textNode = title.firstChild?.nodeType === Node.TEXT_NODE ? title.firstChild : null;
    const wordFragments = [];
    if (textNode) {
      for (const match of text.matchAll(/\S+/g)) {
        const wordRange = document.createRange();
        wordRange.setStart(textNode, match.index);
        wordRange.setEnd(textNode, match.index + match[0].length);
        const lines = new Set([...wordRange.getClientRects()].map((rect) => Math.round(rect.top * 2) / 2));
        if (lines.size > 1) wordFragments.push(match[0]);
      }
    }
    const mark = element.querySelector('[data-identity-role="brand-panel"]')?.getBoundingClientRect();
    const frame = element.closest('.teamIdentityTitleStageFrame') || element;
    const firstContent = frame.nextElementSibling?.getBoundingClientRect() || element.nextElementSibling?.getBoundingClientRect();
    return {
      stage: rectJson(element.getBoundingClientRect()),
      title: rectJson(title.getBoundingClientRect()),
      lineCount,
      wordFragments,
      mark: rectJson(mark),
      firstContent: rectJson(firstContent),
    };
  });
  const back = page.getByRole("button", { name: /(?:Back to )?Dashboard/i });
  let backRect = null;
  for (let index = 0; index < await back.count(); index += 1) {
    if (await back.nth(index).isVisible()) {
      backRect = await back.nth(index).evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height };
      });
      break;
    }
  }
  measurements.push({ role, screen, width: 390, expectedTitle, ...geometry, back: backRect, backGap: backRect ? geometry.stage.top - backRect.bottom : null, leftRail: geometry.stage.left, rightRail: 390 - geometry.stage.right });
}

async function capture(page, name) {
  const output = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: output, animations: "disabled" });
  expect(fs.statSync(output).size).toBeGreaterThan(15_000);
}

test("capture exact pre-phase title-stage evidence from production baseline", async ({ page }) => {
  test.setTimeout(120_000);
  await installSafeRoutes(page);

  await enterDemo(page, "player");
  await navigateByKey(page, "log-drill");
  await measure(page, "player", "train", "At Home Training");
  await capture(page, "before-player-train-390.png");
  await navigateByKey(page, "profile");
  await measure(page, "player", "progress", "Progress");
  await capture(page, "before-player-progress-390.png");

  await enterDemo(page, "coach");
  await navigateByKey(page, "players");
  await measure(page, "coach", "players", "Players");
  await capture(page, "before-coach-players-390.png");
  await navigateByKey(page, "events");
  await measure(page, "coach", "schedule", "Events");
  await capture(page, "before-coach-schedule-390.png");
  await navigateByKey(page, "leaderboards");
  await measure(page, "coach", "leaderboards", "Leaderboards");
  await capture(page, "before-coach-leaderboards-390.png");
});
