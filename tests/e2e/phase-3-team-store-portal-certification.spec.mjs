import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT = path.resolve(process.cwd(), "artifacts/phase-3-release-certification");
fs.mkdirSync(OUTPUT, { recursive: true });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterPlayerDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}" });
  await page.getByRole("button", { name: /Player demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

function contrastRatio(a, b) {
  const lum = (rgb) => rgb
    .map((channel) => channel / 255)
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const [high, low] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

test.describe("Phase 3 Team Store portal certification", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Player Team Store owns the viewport, hides app chrome, and keeps empty-state copy readable", async ({ page }) => {
    await enterPlayerDemo(page);
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator('[data-nav-key="team-store"]').click();

    const panel = page.locator(".ts-panel");
    const emptyState = page.locator(".ts-empty-state");
    await expect(panel).toBeVisible({ timeout: 10_000 });
    await expect(emptyState).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("html")).toHaveClass(/team-store-portal-open/);
    await expect(page.locator("body")).toHaveClass(/team-store-portal-open/);
    await expect(page.getByTestId("mobile-navigation-dock")).toBeHidden();

    const geometry = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    });
    expect(Math.abs(geometry.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.right - 390)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.bottom - 844)).toBeLessThanOrEqual(2);

    const contrast = await emptyState.evaluate((element) => {
      const channels = (value) => (String(value).match(/\d+(?:\.\d+)?/g) || []).slice(0, 3).map(Number);
      const paragraph = element.querySelector("p");
      const button = element.querySelector("button");
      return {
        background: channels(getComputedStyle(element.closest(".ts-panel")).backgroundColor),
        paragraph: paragraph ? channels(getComputedStyle(paragraph).color) : [],
        buttonText: button ? channels(getComputedStyle(button).color) : [],
        buttonHeight: button?.getBoundingClientRect().height || 0,
        buttonBottom: button?.getBoundingClientRect().bottom || 0,
      };
    });
    expect(contrast.background).toHaveLength(3);
    expect(contrast.paragraph).toHaveLength(3);
    expect(contrast.buttonText).toHaveLength(3);
    expect(contrastRatio(contrast.paragraph, contrast.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(contrast.buttonText, contrast.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast.buttonHeight).toBeGreaterThanOrEqual(44);
    expect(contrast.buttonBottom).toBeLessThanOrEqual(844);

    await page.screenshot({ path: path.join(OUTPUT, "22b-player-team-store-immersive.png"), animations: "disabled", fullPage: false });
  });
});
