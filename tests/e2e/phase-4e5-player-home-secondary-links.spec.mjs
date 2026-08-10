import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e5-player-home-secondary-links");
const MIN_TOUCH_TARGET = 43.5;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route("**/v1/leaderboards/participation**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, leaderboards: {} }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function openDisclosure(page, testId) {
  const disclosure = page.getByTestId(testId);
  await expect(disclosure).toBeVisible({ timeout: 20_000 });
  const isOpen = await disclosure.evaluate((node) => node.open === true);
  if (!isOpen) {
    await disclosure.locator("summary").click();
    await settle(page);
  }
  await expect(disclosure).toHaveAttribute("open", "");
}

async function enterExpandedPlayerHome(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await openDisclosure(page, "player-upcoming-schedule");
  await openDisclosure(page, "player-coach-guidance");
  await openDisclosure(page, "player-secondary-intelligence");
  await page.evaluate(async () => {
    const root = document.querySelector(".player-scroll-container");
    const scrollHeight = root?.scrollHeight || document.documentElement.scrollHeight;
    const viewport = root?.clientHeight || innerHeight;
    const step = Math.max(320, Math.floor(viewport * 0.65));
    for (let top = 0; top <= scrollHeight; top += step) {
      if (root) root.scrollTo(0, top);
      else window.scrollTo(0, top);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    if (root) root.scrollTo(0, 0);
    else window.scrollTo(0, 0);
  });
  await settle(page);
}

async function inspectAction(locator) {
  const box = await locator.boundingBox();
  const presentation = await locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      label: String(node.textContent || "").replace(/\s+/g, " ").trim(),
      height: Number.parseFloat(style.height),
      minHeight: Number.parseFloat(style.minHeight),
      fontSize: Number.parseFloat(style.fontSize),
      fontWeight: style.fontWeight,
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      boxSizing: style.boxSizing,
      touchAction: style.touchAction,
    };
  });
  return { box, presentation };
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 2 && height > 2 ? width * height : 0;
}

test("Phase 4E.5 makes expanded Player Home secondary links touch-safe without hierarchy collisions", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterExpandedPlayerHome(page);

  const scheduleActions = page.locator('button[data-player-home-schedule-action]:visible');
  await expect(scheduleActions.first()).toBeVisible();
  const openEvents = scheduleActions.filter({ hasText: /Open Events/i }).first();
  await expect(openEvents).toBeVisible();

  const coachGuidanceAction = page.locator('button[data-player-home-coach-guidance-action]:visible');
  await expect(coachGuidanceAction).toHaveCount(1);
  await expect(coachGuidanceAction).toHaveText(/Open Program/);

  const evidence = [];
  for (let index = 0; index < await scheduleActions.count(); index += 1) {
    const action = scheduleActions.nth(index);
    const item = await inspectAction(action);
    expect(item.box?.height || 0, `${item.presentation.label} physical height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(item.presentation.minHeight, `${item.presentation.label} CSS minimum`).toBeGreaterThanOrEqual(44);
    expect(item.presentation.fontSize, `${item.presentation.label} typography`).toBe(11);
    expect(item.presentation.fontWeight, `${item.presentation.label} weight`).toBe("800");
    expect(item.presentation.backgroundColor, `${item.presentation.label} remains transparent`).toBe("rgba(0, 0, 0, 0)");
    expect([item.presentation.borderTopWidth, item.presentation.borderRightWidth, item.presentation.borderBottomWidth, item.presentation.borderLeftWidth]).toEqual(["0px", "0px", "0px", "0px"]);
    expect(item.presentation.boxSizing).toBe("border-box");
    expect(item.presentation.touchAction).toBe("manipulation");
    evidence.push(item);
  }

  const coachEvidence = await inspectAction(coachGuidanceAction);
  expect(coachEvidence.box?.height || 0, "Open Program physical height").toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  expect(coachEvidence.presentation.minHeight).toBeGreaterThanOrEqual(44);
  expect(coachEvidence.presentation.fontSize).toBe(11);
  expect(coachEvidence.presentation.fontWeight).toBe("800");
  expect(coachEvidence.presentation.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect([coachEvidence.presentation.borderTopWidth, coachEvidence.presentation.borderRightWidth, coachEvidence.presentation.borderBottomWidth, coachEvidence.presentation.borderLeftWidth]).toEqual(["0px", "0px", "0px", "0px"]);
  expect(coachEvidence.presentation.boxSizing).toBe("border-box");
  expect(coachEvidence.presentation.touchAction).toBe("manipulation");
  evidence.push(coachEvidence);

  const viewProgram = page.getByRole("button", { name: "View Program", exact: true });
  await expect(viewProgram).toBeVisible();
  const viewProgramBox = await viewProgram.boundingBox();
  expect(overlapArea(coachEvidence.box, viewProgramBox), "Open Program must not collide with View Program when both disclosures are expanded").toBe(0);

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth, "Player Home document overflow").toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth, "Player Home body overflow").toBeLessThanOrEqual(1);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "player-home-expanded-secondary-links.png"),
    fullPage: true,
    animations: "disabled",
  });
  await coachGuidanceAction.screenshot({
    path: path.join(OUTPUT_DIR, "player-home-open-program-control.png"),
    animations: "disabled",
  });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "player-home-secondary-links.json"),
    JSON.stringify({ viewport, evidence, openProgramVsViewProgramOverlap: overlapArea(coachEvidence.box, viewProgramBox) }, null, 2),
  );

  expect(pageErrors).toEqual([]);
});
