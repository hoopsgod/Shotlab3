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

test("signed-out auth entry renders without waiting on team-only catalog hydration", async ({ page }) => {
  let catalogRequests = 0;
  await page.route("**/v1/training-catalog**", async () => {
    catalogRequests += 1;
    await new Promise(() => {});
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("auth-workspace")).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole("tab", { name: /^sign in$/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /^create account$/i })).toBeVisible();
  expect(catalogRequests).toBe(0);
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

test("Player Demo keeps the complete Player presentation system from first paint", async ({ page }) => {
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

  const headerStyle = await header.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      borderRadius: parseFloat(style.borderRadius),
      borderTopWidth: parseFloat(style.borderTopWidth),
      backgroundColor: style.backgroundColor,
    };
  });
  expect(headerStyle.borderRadius).toBeGreaterThanOrEqual(16);
  expect(headerStyle.borderTopWidth).toBeGreaterThanOrEqual(1);
  expect(headerStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  const commandStyle = await commandCenter.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      borderRadius: parseFloat(style.borderRadius),
      paddingLeft: parseFloat(style.paddingLeft),
      backgroundImage: style.backgroundImage,
    };
  });
  expect(commandStyle.borderRadius).toBeGreaterThanOrEqual(20);
  expect(commandStyle.paddingLeft).toBeGreaterThanOrEqual(14);
  expect(commandStyle.backgroundImage).not.toBe("none");

  const primary = page.getByTestId("player-daily-primary-action");
  await expect(primary).toBeVisible();
  const primaryStyle = await primary.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      minHeight: parseFloat(style.minHeight),
      borderRadius: parseFloat(style.borderRadius),
    };
  });
  expect(primaryStyle.minHeight).toBeGreaterThanOrEqual(44);
  expect(primaryStyle.borderRadius).toBeGreaterThanOrEqual(12);

  await assertNoOverflow(page);
  await capture(page, "13b-player-demo-entry-regression.png");
});