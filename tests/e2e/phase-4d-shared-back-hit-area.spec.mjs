import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4d-shared-back-hit-area");
const MIN_TOUCH_TARGET = 43.5;
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

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
  const demo = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

async function navigate(page, key) {
  const direct = page.getByTestId("mobile-navigation-dock").locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await settle(page);
}

async function focusByKeyboard(page, target) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((node) => document.activeElement === node)) return;
  }
  throw new Error("Shared dashboard back action was not reachable by keyboard Tab navigation");
}

async function verifyBackControl(page, role, surface) {
  const back = page.locator("button.shared-dashboard-back-action");
  await expect(back, `${role}/${surface} shared back action`).toHaveCount(1);
  await expect(back).toBeVisible();

  const box = await back.boundingBox();
  expect(box?.height || 0, `${role}/${surface} back target height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(box?.width || 0, `${role}/${surface} back target width`).toBeGreaterThanOrEqual(44);

  const presentation = await back.evaluate((node) => {
    const style = getComputedStyle(node);
    const icon = node.querySelector('span[aria-hidden="true"]');
    const iconStyle = icon ? getComputedStyle(icon) : null;
    return {
      text: String(node.textContent || "").replace(/\s+/g, " ").trim(),
      minHeight: Number.parseFloat(style.minHeight),
      height: Number.parseFloat(style.height),
      paddingTop: Number.parseFloat(style.paddingTop),
      paddingBottom: Number.parseFloat(style.paddingBottom),
      paddingLeft: Number.parseFloat(style.paddingLeft),
      paddingRight: Number.parseFloat(style.paddingRight),
      borderTopWidth: style.borderTopWidth,
      borderRadius: Number.parseFloat(style.borderRadius),
      backgroundImage: style.backgroundImage,
      fontSize: Number.parseFloat(style.fontSize),
      touchAction: style.touchAction,
      iconText: String(icon?.textContent || "").trim(),
      iconFontSize: Number.parseFloat(iconStyle?.fontSize || "0"),
      iconColor: iconStyle?.color || "",
    };
  });

  expect(presentation.text).toMatch(/dashboard/i);
  expect(presentation.minHeight).toBeGreaterThanOrEqual(44);
  expect(presentation.height).toBeGreaterThanOrEqual(44);
  expect(presentation.paddingTop).toBe(0);
  expect(presentation.paddingBottom).toBe(0);
  expect(presentation.paddingLeft).toBe(0);
  expect(presentation.paddingRight).toBe(0);
  expect(presentation.borderTopWidth).toBe("1px");
  expect(presentation.borderRadius).toBeGreaterThanOrEqual(13);
  expect(presentation.borderRadius).toBeLessThanOrEqual(15);
  expect(presentation.backgroundImage).not.toContain("url(");
  expect(presentation.backgroundImage).not.toContain("radial-gradient");
  if (presentation.backgroundImage !== "none") expect(presentation.backgroundImage).toContain("linear-gradient");
  expect(presentation.fontSize).toBe(0);
  expect(presentation.touchAction).toBe("manipulation");
  expect(presentation.iconText.length).toBeGreaterThan(0);
  expect(presentation.iconFontSize).toBeGreaterThanOrEqual(20);
  expect(presentation.iconColor).not.toBe("rgba(0, 0, 0, 0)");

  await focusByKeyboard(page, back);
  await expect(back).toBeFocused();
  const focusState = await back.evaluate((node) => ({
    focusVisible: node.matches(":focus-visible"),
    outlineStyle: getComputedStyle(node).outlineStyle,
  }));
  expect(focusState.focusVisible).toBe(true);
  expect(focusState.outlineStyle).not.toBe("none");

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth).toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth).toBeLessThanOrEqual(1);

  return { role, surface, box, presentation, viewport };
}

test("shared Coach and Player dashboard back actions stay touch-safe under Phase 7 compact framing", async ({ browser }) => {
  const evidence = [];

  const coachContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const coachPage = await coachContext.newPage();
  const coachErrors = [];
  coachPage.on("pageerror", (error) => coachErrors.push(error.message));
  await enterDemo(coachPage, "coach");
  for (const key of ["players", "leaderboards"]) {
    await navigate(coachPage, key);
    evidence.push(await verifyBackControl(coachPage, "coach", key));
    if (key === "players") {
      const control = coachPage.locator("button.shared-dashboard-back-action");
      await control.screenshot({ path: path.join(OUTPUT_DIR, "coach-back-control.png"), animations: "disabled" });
      await coachPage.screenshot({ path: path.join(OUTPUT_DIR, "coach-players-back-state.png"), animations: "disabled" });
    }
    await coachPage.locator("button.shared-dashboard-back-action").click();
    await settle(coachPage);
    await expect(coachPage.locator("button.shared-dashboard-back-action")).toHaveCount(0);
  }
  expect(coachErrors).toEqual([]);
  await coachContext.close();

  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerPage = await playerContext.newPage();
  const playerErrors = [];
  playerPage.on("pageerror", (error) => playerErrors.push(error.message));
  await enterDemo(playerPage, "player");
  for (const key of ["log-drill", "profile", "program", "leaderboards"]) {
    await navigate(playerPage, key);
    evidence.push(await verifyBackControl(playerPage, "player", key));
    if (key === "log-drill") {
      const control = playerPage.locator("button.shared-dashboard-back-action");
      await control.screenshot({ path: path.join(OUTPUT_DIR, "player-back-control.png"), animations: "disabled" });
      await playerPage.screenshot({ path: path.join(OUTPUT_DIR, "player-train-back-state.png"), animations: "disabled" });
    }
    await playerPage.locator("button.shared-dashboard-back-action").click();
    await settle(playerPage);
    await expect(playerPage.locator("button.shared-dashboard-back-action")).toHaveCount(0);
  }
  expect(playerErrors).toEqual([]);
  await playerContext.close();

  expect(evidence).toHaveLength(6);
  fs.writeFileSync(path.join(OUTPUT_DIR, "shared-back-hit-areas.json"), JSON.stringify(evidence, null, 2));
});
