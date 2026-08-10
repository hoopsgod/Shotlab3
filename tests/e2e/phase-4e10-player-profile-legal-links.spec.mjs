import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e10-player-profile-legal-links");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
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
  const account = page.getByTestId("player-profile-account-data");
  if (!(await account.evaluate((node) => node.open === true))) {
    await account.locator("summary").click();
    await settle(page);
  }
  await account.scrollIntoViewIfNeeded();
  await settle(page);
  return account;
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 2 && height > 2 ? width * height : 0;
}

test("Phase 4E.10 keeps Player Profile legal/support links touch-safe without wrap collisions", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const account = await enterAccountData(page);
  const links = account.locator('a[data-player-profile-legal-link]');
  await expect(links).toHaveCount(5);

  const expected = [
    ["Privacy", "/privacy"],
    ["Terms", "/terms"],
    ["Support", "/support"],
    ["Delete Account", "/delete-account"],
    ["Data Request", "/data-request"],
  ];
  const evidence = [];
  const boxes = [];
  for (let index = 0; index < expected.length; index += 1) {
    const [label, href] = expected[index];
    const link = links.nth(index);
    await expect(link).toHaveText(label);
    await expect(link).toHaveAttribute("href", href);
    const box = await link.boundingBox();
    const style = await link.evaluate((node) => {
      const css = getComputedStyle(node);
      return {
        label: String(node.textContent || "").trim(),
        href: node.getAttribute("href"),
        height: parseFloat(css.height),
        minHeight: parseFloat(css.minHeight),
        fontSize: parseFloat(css.fontSize),
        fontWeight: css.fontWeight,
        borderRadius: css.borderRadius,
        boxSizing: css.boxSizing,
        touchAction: css.touchAction,
      };
    });
    expect(box?.height || 0, `${label} physical height`).toBeGreaterThanOrEqual(43.5);
    expect(box?.width || 0, `${label} physical width`).toBeGreaterThanOrEqual(44);
    expect(style.minHeight, `${label} CSS minimum`).toBeGreaterThanOrEqual(44);
    expect(style.fontSize).toBe(10);
    expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(700);
    expect(style.borderRadius).toBe("999px");
    expect(style.boxSizing).toBe("border-box");
    expect(style.touchAction).toBe("manipulation");
    evidence.push({ box, style });
    boxes.push(box);
  }

  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      expect(overlapArea(boxes[i], boxes[j]), `legal link ${i + 1} must not overlap ${j + 1}`).toBe(0);
    }
  }

  const horizontal = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(horizontal.documentWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);

  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-legal-links-viewport.png"), animations: "disabled" });
  await account.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-legal-links-account.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-profile-legal-links.json"), JSON.stringify({ horizontal, evidence }, null, 2));
  expect(pageErrors).toEqual([]);
});
