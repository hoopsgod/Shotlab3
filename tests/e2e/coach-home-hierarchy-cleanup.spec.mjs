import { test, expect } from "@playwright/test";

test("Mission Control removes duplicate setup while preserving operational sections", async ({ page }) => {
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "demo_local", priorities_by_team: {} }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));

  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();

  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-setup-checklist")).toBeHidden();

  // Team Standings is intentionally collapsed by ProgressiveDisclosure. Its
  // content mount must remain present, while a visible operational section
  // confirms the cleanup did not hide the rest of Coach Home.
  await expect(page.getByTestId("coach-team-standings")).toHaveCount(1);
  await expect(page.getByTestId("coach-today-practice")).toBeVisible();

  const cleanupStyle = page.locator("#shotlab-coach-home-hierarchy-cleanup");
  await expect(cleanupStyle).toHaveCount(1);
  await expect(cleanupStyle).toContainText('[data-testid="coach-setup-checklist"]');
  await expect(cleanupStyle).not.toContainText("coach-team-standings");
  await expect(cleanupStyle).not.toContainText("coach-today-practice");

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
});
