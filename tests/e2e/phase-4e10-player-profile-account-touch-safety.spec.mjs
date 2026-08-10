import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e10-player-profile-account-touch-safety");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterProfile(page) {
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
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 2 && height > 2 ? width * height : 0;
}

test("Phase 4E.10 reconciles all Player Profile account touch targets", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterProfile(page);

  const privacy = page.getByTestId("player-profile-privacy");
  await expect(privacy).toBeVisible();
  await privacy.scrollIntoViewIfNeeded();
  const toggle = privacy.locator('button[data-player-profile-privacy-toggle]');
  const toggleBox = await toggle.boundingBox();
  const toggleStyle = await toggle.evaluate((node) => {
    const css = getComputedStyle(node);
    return { label: node.textContent.trim(), ariaPressed: node.getAttribute("aria-pressed"), minHeight: parseFloat(css.minHeight), height: parseFloat(css.height), width: parseFloat(css.width), fontSize: parseFloat(css.fontSize), fontWeight: css.fontWeight, borderRadius: css.borderRadius, boxSizing: css.boxSizing, touchAction: css.touchAction };
  });
  expect(toggleBox?.height || 0).toBeGreaterThanOrEqual(43.5);
  expect(toggleBox?.width || 0).toBeGreaterThanOrEqual(88);
  expect(toggleStyle.minHeight).toBeGreaterThanOrEqual(44);
  expect(toggleStyle.fontSize).toBe(10);
  expect(Number(toggleStyle.fontWeight)).toBeGreaterThanOrEqual(700);
  expect(toggleStyle.borderRadius).toBe("999px");
  expect(toggleStyle.boxSizing).toBe("border-box");
  expect(toggleStyle.touchAction).toBe("manipulation");
  const initialLabel = toggleStyle.label;
  await toggle.click();
  await settle(page);
  await expect(toggle).not.toHaveText(initialLabel);
  await toggle.click();
  await settle(page);
  await expect(toggle).toHaveText(initialLabel);

  const account = page.getByTestId("player-profile-account-data");
  if (!(await account.evaluate((node) => node.open === true))) {
    await account.locator("summary").click();
    await settle(page);
  }
  await account.scrollIntoViewIfNeeded();
  const legalLinks = account.locator('a[data-player-profile-legal-link]');
  await expect(legalLinks).toHaveCount(5);
  const expected = [["Privacy","/privacy"],["Terms","/terms"],["Support","/support"],["Delete Account","/delete-account"],["Data Request","/data-request"]];
  const legalEvidence = [];
  const boxes = [];
  for (let i = 0; i < expected.length; i += 1) {
    const [label, href] = expected[i];
    const link = legalLinks.nth(i);
    await expect(link).toHaveText(label);
    await expect(link).toHaveAttribute("href", href);
    const box = await link.boundingBox();
    const style = await link.evaluate((node) => { const css = getComputedStyle(node); return { label: node.textContent.trim(), href: node.getAttribute("href"), minHeight: parseFloat(css.minHeight), height: parseFloat(css.height), fontSize: parseFloat(css.fontSize), fontWeight: css.fontWeight, borderRadius: css.borderRadius, boxSizing: css.boxSizing, touchAction: css.touchAction }; });
    expect(box?.height || 0, `${label} height`).toBeGreaterThanOrEqual(43.5);
    expect(box?.width || 0, `${label} width`).toBeGreaterThanOrEqual(44);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.fontSize).toBe(10);
    expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(700);
    expect(style.borderRadius).toBe("999px");
    expect(style.boxSizing).toBe("border-box");
    expect(style.touchAction).toBe("manipulation");
    legalEvidence.push({ box, style });
    boxes.push(box);
  }
  for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) expect(overlapArea(boxes[i], boxes[j])).toBe(0);

  const requestData = account.getByTestId("player-account-data-request");
  const requestBox = await requestData.boundingBox();
  expect(requestBox?.height || 0, "REQUEST DATA inherited target").toBeGreaterThanOrEqual(43.5);
  const deleteAccount = account.getByRole("button", { name: "Delete Account & Data" });
  const deleteBox = await deleteAccount.boundingBox();
  expect(deleteBox?.height || 0, "Delete Account & Data existing target").toBeGreaterThanOrEqual(43.5);
  expect(overlapArea(requestBox, deleteBox), "account actions must not overlap").toBe(0);

  const horizontal = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(horizontal.documentWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);

  await page.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-account-touch-viewport.png"), animations: "disabled" });
  await privacy.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-account-privacy.png"), animations: "disabled" });
  await account.screenshot({ path: path.join(OUTPUT_DIR, "player-profile-account-data.png"), animations: "disabled" });
  fs.writeFileSync(path.join(OUTPUT_DIR, "player-profile-account-touch.json"), JSON.stringify({ horizontal, toggle: { box: toggleBox, style: toggleStyle }, legalEvidence, requestBox, deleteBox }, null, 2));
  expect(pageErrors).toEqual([]);
});
