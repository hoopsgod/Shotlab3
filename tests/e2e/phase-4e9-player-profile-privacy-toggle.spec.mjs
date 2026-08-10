import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e9-player-profile-privacy-toggle");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterPlayerProfile(page) {
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

  const privacy = page.getByTestId("player-profile-privacy");
  await expect(privacy).toBeVisible({ timeout: 20_000 });
  await privacy.scrollIntoViewIfNeeded();
  await settle(page);
  return privacy;
}

test("Phase 4E.9 keeps Player Profile leaderboard privacy toggle touch-safe and truthful", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const privacy = await enterPlayerProfile(page);
  await expect(privacy).toContainText("Hide me from leaderboards");
  await expect(privacy).toContainText("Coach can still view your workouts and progress.");

  const toggle = privacy.locator('button[data-player-profile-privacy-toggle]');
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toBeVisible();

  const initialLabel = (await toggle.textContent())?.trim();
  expect(["ON", "OFF"]).toContain(initialLabel);
  const initialPressed = await toggle.getAttribute("aria-pressed");
  expect(initialPressed).toBe(initialLabel === "ON" ? "true" : "false");

  const box = await toggle.boundingBox();
  const style = await toggle.evaluate((node) => {
    const css = getComputedStyle(node);
    return {
      label: String(node.textContent || "").trim(),
      ariaPressed: node.getAttribute("aria-pressed"),
      width: parseFloat(css.width),
      height: parseFloat(css.height),
      minHeight: parseFloat(css.minHeight),
      fontSize: parseFloat(css.fontSize),
      fontWeight: css.fontWeight,
      borderRadius: css.borderRadius,
      boxSizing: css.boxSizing,
      touchAction: css.touchAction,
    };
  });

  expect(box?.height || 0, "privacy toggle physical height").toBeGreaterThanOrEqual(43.5);
  expect(box?.width || 0, "privacy toggle physical width").toBeGreaterThanOrEqual(88);
  expect(style.minHeight, "privacy toggle CSS minimum").toBeGreaterThanOrEqual(44);
  expect(style.fontSize).toBe(10);
  expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(700);
  expect(style.borderRadius).toBe("999px");
  expect(style.boxSizing).toBe("border-box");
  expect(style.touchAction).toBe("manipulation");

  await toggle.click();
  await settle(page);
  const toggledLabel = (await toggle.textContent())?.trim();
  expect(toggledLabel).not.toBe(initialLabel);
  await expect(toggle).toHaveAttribute("aria-pressed", toggledLabel === "ON" ? "true" : "false");
  if (toggledLabel === "OFF") await expect(privacy).toContainText("You are hidden from public leaderboard rankings.");
  else await expect(privacy).toContainText("You are visible in team leaderboards.");

  await toggle.click();
  await settle(page);
  await expect(toggle).toHaveText(initialLabel);
  await expect(toggle).toHaveAttribute("aria-pressed", initialPressed);

  const horizontal = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(horizontal.documentWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);

  await privacy.scrollIntoViewIfNeeded();
  await settle(page);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-privacy-toggle-viewport.png"), animations: "disabled" });
  await privacy.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-privacy-toggle-card.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-profile-privacy-toggle.json"), JSON.stringify({ horizontal, box, style, initialLabel }, null, 2));

  expect(pageErrors).toEqual([]);
});
