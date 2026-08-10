import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e9-player-profile-data-request");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function openDetails(page, testId) {
  const details = page.getByTestId(testId);
  await expect(details).toBeVisible({ timeout: 20_000 });
  if (!(await details.evaluate((node) => node.open === true))) {
    await details.locator("summary").click();
    await settle(page);
  }
  await expect(details).toHaveAttribute("open", "");
  return details;
}

async function enterAccountData(page) {
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
  const account = await openDetails(page, "player-profile-account-data");
  const request = page.getByTestId("player-account-data-request");
  await expect(request).toBeVisible({ timeout: 20_000 });
  await request.scrollIntoViewIfNeeded();
  await settle(page);
  return { account, request };
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 2 && height > 2 ? width * height : 0;
}

test("Phase 4E.9 keeps Player Profile REQUEST DATA touch-safe and separated from destructive account action", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const { account, request } = await enterAccountData(page);

  await expect(request).toHaveText("REQUEST DATA");
  await expect(request).toHaveAttribute("href", /^mailto:/);
  const requestBox = await request.boundingBox();
  const presentation = await request.evaluate((node) => {
    const css = getComputedStyle(node);
    return {
      height: parseFloat(css.height),
      minHeight: parseFloat(css.minHeight),
      width: parseFloat(css.width),
      fontSize: parseFloat(css.fontSize),
      letterSpacing: css.letterSpacing,
      borderRadius: css.borderRadius,
      display: css.display,
      alignItems: css.alignItems,
      justifyContent: css.justifyContent,
      boxSizing: css.boxSizing,
      touchAction: css.touchAction,
      backgroundColor: css.backgroundColor,
      color: css.color,
    };
  });

  expect(requestBox?.height || 0, "REQUEST DATA physical height").toBeGreaterThanOrEqual(43.5);
  expect(requestBox?.width || 0, "REQUEST DATA physical width").toBeGreaterThanOrEqual(250);
  expect(presentation.minHeight, "REQUEST DATA CSS minimum").toBeGreaterThanOrEqual(44);
  expect(presentation.fontSize).toBe(14);
  expect(presentation.borderRadius).toBe("10px");
  expect(presentation.display).toBe("flex");
  expect(presentation.alignItems).toBe("center");
  expect(presentation.justifyContent).toBe("center");
  expect(presentation.boxSizing).toBe("border-box");
  expect(presentation.touchAction).toBe("manipulation");

  const destructive = page.getByRole("button", { name: "Delete Account & Data", exact: true });
  await expect(destructive).toBeVisible();
  const destructiveBox = await destructive.boundingBox();
  expect(destructiveBox?.height || 0, "existing destructive action remains touch-safe").toBeGreaterThanOrEqual(44);
  expect(overlapArea(requestBox, destructiveBox), "REQUEST DATA must not overlap destructive account action").toBe(0);
  expect((destructiveBox?.y || 0) - ((requestBox?.y || 0) + (requestBox?.height || 0)), "vertical separation from destructive action").toBeGreaterThanOrEqual(20);

  await request.evaluate((node) => node.addEventListener("click", (event) => event.preventDefault(), { capture: true, once: true }));
  await request.click();
  await settle(page);
  await expect(page.getByRole("status")).toContainText("Request email opened");

  const horizontal = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(horizontal.documentWidth - horizontal.innerWidth, "Profile document overflow").toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth, "Profile body overflow").toBeLessThanOrEqual(1);

  await request.scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-data-request-viewport.png"), animations: "disabled" });
  await request.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-data-request-control.png"), animations: "disabled" });
  await account.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-account-data.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-profile-data-request.json"), JSON.stringify({ horizontal, request: { box: requestBox, presentation }, destructive: { box: destructiveBox }, overlap: overlapArea(requestBox, destructiveBox) }, null, 2));

  expect(pageErrors).toEqual([]);
});
