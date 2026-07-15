import { test, expect } from "@playwright/test";

const PREVIEW_URL = process.env.LIVE_PREVIEW_URL;
if (!PREVIEW_URL) throw new Error("LIVE_PREVIEW_URL is required");

const LIVE_DATA_KEYS = [
  "sl:teams",
  "sl:players",
  "sl:player-profiles",
  "sl:scores",
  "sl:program-scores",
  "sl:shotlogs",
  "sl:events",
  "sl:rsvps",
  "sl:sc-sessions",
  "sl:sc-rsvps",
  "sl:sc-logs",
];

async function enterCoachDemo(page) {
  const demoCoach = page.getByRole("button", { name: "Demo Coach", exact: true });
  const players = page.getByRole("button", { name: "Players", exact: true });
  await expect(page.locator("body")).not.toBeEmpty({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /^(Demo Coach|Players)$/ }).first()).toBeVisible({ timeout: 20_000 });
  if (await demoCoach.isVisible().catch(() => false)) await demoCoach.click();
  await expect(players).toBeVisible({ timeout: 20_000 });
  return players;
}

async function snapshotLiveCollections(page) {
  return page.evaluate((keys) => Object.fromEntries(keys.map((key) => [key, window.localStorage.getItem(key)])), LIVE_DATA_KEYS);
}

test("live Cloudflare preview completes durable season archive flow", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(PREVIEW_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await expect(page).toHaveTitle(/ShotLab/i, { timeout: 20_000 });

  const playersButton = await enterCoachDemo(page);
  await playersButton.click();

  const panel = page.getByTestId("coach-season-archive");
  await expect(panel).toBeVisible({ timeout: 20_000 });

  const liveBefore = await snapshotLiveCollections(page);
  const archiveName = `Live Preview Smoke ${Date.now()}`;
  await panel.getByPlaceholder("2026 Summer").fill(archiveName);
  const dates = panel.locator('input[type="date"]');
  await expect(dates).toHaveCount(2);
  await dates.nth(0).fill("2026-01-01");
  await dates.nth(1).fill("2026-12-31");
  await panel.getByRole("button", { name: "Archive Season", exact: true }).click();
  await panel.getByRole("button", { name: /^confirm archive$/i }).click();

  const status = panel.getByRole("status");
  await expect(status).toBeVisible({ timeout: 30_000 });
  const statusText = (await status.textContent())?.trim() || "";
  expect(statusText, `Archive creation failed on deployed preview. Console errors: ${consoleErrors.join(" | ")}`).toContain(`Archived ${archiveName}.`);

  const archiveButton = panel.getByRole("button", { name: `View archive ${archiveName}`, exact: true });
  await expect(archiveButton).toBeVisible();
  await archiveButton.click();
  const detail = panel.getByTestId("season-archive-detail");
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(archiveName);

  expect(await snapshotLiveCollections(page)).toEqual(liveBefore);

  await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
  const playersAfterReload = await enterCoachDemo(page);
  await playersAfterReload.click();
  const panelAfterReload = page.getByTestId("coach-season-archive");
  await expect(panelAfterReload).toBeVisible();
  const archiveAfterReload = panelAfterReload.getByRole("button", { name: `View archive ${archiveName}`, exact: true });
  await expect(archiveAfterReload).toBeVisible({ timeout: 30_000 });
  await archiveAfterReload.click();
  await expect(panelAfterReload.getByTestId("season-archive-detail")).toContainText(archiveName);
});
