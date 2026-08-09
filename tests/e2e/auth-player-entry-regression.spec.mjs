import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function capture(page, name) {
  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, name), fullPage: false, animations: "disabled" });
}

async function assertNoOverflow(page) {
  const delta = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(delta).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("auth hero stays on the light canvas with no legacy dark overlay", async ({ page }) => {
  await page.goto("/");
  const auth = page.getByTestId("auth-workspace");
  await expect(auth).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Train with intent/i })).toBeVisible();

  const shell = auth.locator(":scope > .fade-up");
  await expect(shell).toBeVisible();
  const visualState = await shell.evaluate((node) => {
    const style = getComputedStyle(node);
    const before = getComputedStyle(node, "::before");
    const after = getComputedStyle(node, "::after");
    return {
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      beforeDisplay: before.display,
      beforeContent: before.content,
      afterDisplay: after.display,
      afterContent: after.content,
    };
  });

  expect(visualState.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(visualState.backgroundImage).toBe("none");
  expect(visualState.beforeDisplay).toBe("none");
  expect(visualState.afterDisplay).toBe("none");
  await assertNoOverflow(page);
  await capture(page, "13a-auth-entry-regression.png");
});

test("Player Demo never exposes the high-resolution team logo at viewport scale", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();

  const header = page.getByTestId("player-dashboard-identity-header");
  await expect(header).toBeVisible({ timeout: 20_000 });
  const logo = header.locator("img").first();
  await expect(logo).toBeVisible();
  const box = await logo.boundingBox();
  expect(box).not.toBeNull();
  expect(box.width).toBeLessThanOrEqual(100);
  expect(box.height).toBeLessThanOrEqual(100);
  await assertNoOverflow(page);
  await capture(page, "13b-player-demo-entry-regression.png");
});
