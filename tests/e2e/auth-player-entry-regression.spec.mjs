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
  const logo = header.locator('[data-identity-role="brand-mark"]');
  await expect(logo).toBeVisible();
  const logoState = await logo.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const slot = node.closest('[data-identity-role="brand-panel"]')?.getBoundingClientRect();
    const stage = node.closest('[data-team-identity-stage="true"]')?.getBoundingClientRect();
    const copy = node.closest('[data-team-identity-stage="true"]')?.querySelector('.teamIdentityTitleStage__copy')?.getBoundingClientRect();
    const intersectsCopy = Boolean(copy) && rect.left < copy.right && rect.right > copy.left && rect.top < copy.bottom && rect.bottom > copy.top;
    return {
      complete: node.complete,
      naturalWidth: node.naturalWidth,
      naturalHeight: node.naturalHeight,
      objectFit: getComputedStyle(node).objectFit,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      slot: slot ? { left: slot.left, top: slot.top, right: slot.right, bottom: slot.bottom, width: slot.width, height: slot.height } : null,
      stage: stage ? { left: stage.left, top: stage.top, right: stage.right, bottom: stage.bottom } : null,
      intersectsCopy,
    };
  });
  expect(logoState.complete).toBe(true);
  expect(logoState.naturalWidth).toBeGreaterThan(0);
  expect(logoState.naturalHeight).toBeGreaterThan(0);
  expect(logoState.objectFit).toBe("contain");
  expect(logoState.rect.width).toBeGreaterThanOrEqual(96);
  expect(logoState.rect.height).toBeGreaterThanOrEqual(96);
  expect(logoState.slot).not.toBeNull();
  expect(logoState.stage).not.toBeNull();
  expect(logoState.rect.left).toBeGreaterThanOrEqual(logoState.slot.left - 1);
  expect(logoState.rect.top).toBeGreaterThanOrEqual(logoState.slot.top - 1);
  expect(logoState.rect.right).toBeLessThanOrEqual(logoState.slot.right + 1);
  expect(logoState.rect.bottom).toBeLessThanOrEqual(logoState.slot.bottom + 1);
  expect(logoState.rect.left).toBeGreaterThanOrEqual(logoState.stage.left - 1);
  expect(logoState.rect.right).toBeLessThanOrEqual(logoState.stage.right + 1);
  expect(logoState.intersectsCopy).toBe(false);

  const headerStyle = await header.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      borderRadius: parseFloat(style.borderRadius),
      borderTopWidth: parseFloat(style.borderTopWidth),
      borderBottomWidth: parseFloat(style.borderBottomWidth),
      backgroundColor: style.backgroundColor,
    };
  });
  expect(headerStyle.borderRadius).toBe(0);
  expect(headerStyle.borderTopWidth).toBeLessThanOrEqual(1);
  expect(headerStyle.borderBottomWidth).toBeLessThanOrEqual(1);
  expect(headerStyle.backgroundColor).toBe("rgba(0, 0, 0, 0)");

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
  expect(commandStyle.borderRadius).toBe(0);
  expect(commandStyle.paddingLeft).toBe(0);
  expect(commandStyle.backgroundImage).toBe("none");

  const primaryDecision = commandCenter.locator('[data-layout-role="primary-decision"]');
  await expect(primaryDecision).toBeVisible();
  const primaryDecisionStyle = await primaryDecision.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      borderRadius: parseFloat(style.borderRadius),
      paddingLeft: parseFloat(style.paddingLeft),
      backgroundImage: style.backgroundImage,
    };
  });
  expect(primaryDecisionStyle.borderRadius).toBeLessThanOrEqual(1);
  expect(primaryDecisionStyle.paddingLeft).toBeGreaterThanOrEqual(14);
  expect(primaryDecisionStyle.backgroundImage).not.toBe("none");

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
  expect(primaryStyle.borderRadius).toBeGreaterThanOrEqual(10);
  expect(primaryStyle.borderRadius).toBeLessThanOrEqual(16);

  await assertNoOverflow(page);
  await capture(page, "13b-player-demo-entry-regression.png");
});
