import { test, expect } from "@playwright/test";

test("Mission Control removes duplicate setup while preserving operational sections", async ({ page }) => {
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "demo_local", priorities_by_team: {} }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));

  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();

  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-setup-checklist")).toBeHidden();

  // Operational cards remain mounted exactly once. Their open/closed state is
  // controlled independently by ProgressiveDisclosure and is not part of this cleanup.
  await expect(page.getByTestId("coach-team-standings")).toHaveCount(1);
  await expect(page.getByTestId("coach-today-practice")).toHaveCount(1);

  const cleanupStyle = page.locator("#shotlab-coach-home-hierarchy-cleanup");
  await expect(cleanupStyle).toHaveCount(1);
  const cleanupCss = await cleanupStyle.evaluate((node) => node.textContent || "");
  expect(cleanupCss).toContain('[data-testid="coach-setup-checklist"]');
  expect(cleanupCss).not.toContain("coach-team-standings");
  expect(cleanupCss).not.toContain("coach-today-practice");

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
});
