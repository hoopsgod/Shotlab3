import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e1-coach-filter-hit-area");
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
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Coach demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

async function navigate(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    const item = sheet.locator(`[data-nav-key="${key}"]`);
    await expect(item).toBeVisible();
    await item.click();
  }
  await settle(page);
}

async function verifyFilterFamily(page, surface, expectedCount) {
  const chips = page.locator("button[data-coach-filter-chip]");
  await expect(chips.first(), `${surface} shared Coach filter family`).toBeVisible();
  await expect(chips, `${surface} shared Coach filter count`).toHaveCount(expectedCount);

  const evidence = [];
  for (let index = 0; index < expectedCount; index += 1) {
    const chip = chips.nth(index);
    const box = await chip.boundingBox();
    const computed = await chip.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        label: String(node.textContent || "").replace(/\s+/g, " ").trim(),
        ariaPressed: node.getAttribute("aria-pressed"),
        minHeight: Number.parseFloat(style.minHeight),
        height: Number.parseFloat(style.height),
        borderRadius: Number.parseFloat(style.borderRadius),
        fontSize: Number.parseFloat(style.fontSize),
        touchAction: style.touchAction,
        boxSizing: style.boxSizing,
      };
    });

    expect(box?.height || 0, `${surface}/${computed.label} physical height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    expect(computed.minHeight, `${surface}/${computed.label} CSS minimum`).toBeGreaterThanOrEqual(44);
    expect(computed.height, `${surface}/${computed.label} computed height`).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
    if (surface === "events") {
      expect(computed.borderRadius, `${surface}/${computed.label} editorial tab radius`).toBeLessThanOrEqual(1);
    } else {
      expect(computed.borderRadius, `${surface}/${computed.label} pill radius`).toBeGreaterThanOrEqual(18);
    }
    expect(computed.fontSize, `${surface}/${computed.label} typography`).toBeGreaterThanOrEqual(10);
    expect(computed.touchAction).toBe("manipulation");
    expect(computed.boxSizing).toBe("border-box");
    evidence.push({ box, computed });
  }

  const viewport = await page.evaluate(() => ({
    innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(viewport.documentWidth - viewport.innerWidth, `${surface} document overflow`).toBeLessThanOrEqual(1);
  expect(viewport.bodyWidth - viewport.innerWidth, `${surface} body overflow`).toBeLessThanOrEqual(1);

  const first = chips.first();
  const last = chips.last();
  if (expectedCount > 1) {
    await last.click();
    await expect(last).toHaveAttribute("aria-pressed", "true");
    await first.click();
    await expect(first).toHaveAttribute("aria-pressed", "true");
  }
  await settle(page);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, `coach-${surface}-44px-filter-family.png`),
    fullPage: true,
    animations: "disabled",
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, `coach-${surface}.json`), JSON.stringify({ surface, expectedCount, viewport, evidence }, null, 2));
}

test("Phase 4E.1 keeps shared Coach filters touch-safe and visually bounded", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterCoachDemo(page);

  for (const config of [
    { key: "players", count: 5 },
    { key: "events", count: 5 },
    { key: "leaderboards", count: 4 },
  ]) {
    await navigate(page, config.key);
    await verifyFilterFamily(page, config.key, config.count);
  }

  expect(pageErrors).toEqual([]);
});
