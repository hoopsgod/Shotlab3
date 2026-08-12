import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-6a-player-analytics-language-integrity");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterPerformanceIntelligence(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/leaderboards/participation**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leaderboards: {} }) }));

  await page.goto("/");
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });

  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator('[data-nav-key="profile"]');
  if (await direct.count()) await direct.click();
  else {
    await page.getByTestId("mobile-navigation-more").click();
    await page.getByTestId("mobile-navigation-sheet").locator('[data-nav-key="profile"]').click();
  }
  await settle(page);

  await page.getByTestId("player-progress-open-profile").click();
  await settle(page);

  const readout = page.getByTestId("player-profile-readout");
  await expect(readout).toBeVisible({ timeout: 20_000 });

  const performance = page.getByTestId("player-profile-performance-intelligence");
  if (!(await performance.evaluate((node) => node.open === true))) {
    await performance.locator("summary").click();
    await settle(page);
  }
  await expect(performance).toBeVisible({ timeout: 20_000 });
  await performance.scrollIntoViewIfNeeded();
  await settle(page);
  return { performance, readout };
}

test("Phase 6A keeps internal drill identifiers out of Player Performance Intelligence", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const { performance, readout } = await enterPerformanceIntelligence(page);
  const text = String(await performance.textContent()).replace(/\s+/g, " ").trim();
  const readoutText = String(await readout.textContent()).replace(/\s+/g, " ").trim();

  expect(text).not.toMatch(/demo-(?:home|program|training|drill)[a-z0-9_-]*/i);
  expect(readoutText).not.toMatch(/demo-(?:home|program|training|drill)[a-z0-9_-]*/i);
  expect(text).toContain("Strongest drill pattern: 4-Minute Warm-Up Shooting.");
  expect(readoutText).toContain("Strength: 4-Minute Warm-Up Shooting");

  const horizontal = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(horizontal.documentWidth - horizontal.innerWidth, "Profile document overflow").toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth, "Profile body overflow").toBeLessThanOrEqual(1);

  await readout.screenshot({
    path: path.join(OUTPUT_DIR, "player-drill-trend-readout.png"),
    animations: "disabled",
  });
  await performance.screenshot({
    path: path.join(OUTPUT_DIR, "player-performance-intelligence.png"),
    animations: "disabled",
  });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "player-performance-intelligence.json"),
    JSON.stringify({ text, readoutText, horizontal }, null, 2),
  );

  expect(pageErrors).toEqual([]);
});
