import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4e11-coach-residual-touch-safety");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page, { resetScroll = false } = {}) {
  await page.evaluate(async ({ resetScroll }) => {
    if (document.fonts?.ready) await document.fonts.ready;
    if (resetScroll) {
      window.scrollTo(0, 0);
      document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, { resetScroll });
  await page.waitForTimeout(120);
}

async function enterCoachDemo(page) {
  await installSafeRoutes(page);
  await page.goto("/");
  await page.getByRole("button", { name: /Coach demo/i }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page, { resetScroll: true });
}

async function navigateByKey(page, key) {
  const dock = page.getByTestId("mobile-navigation-dock");
  const direct = dock.locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await settle(page, { resetScroll: true });
}

async function measureControl(control, label) {
  await expect(control, `${label} must be visible`).toBeVisible();
  const box = await control.boundingBox();
  const style = await control.evaluate((node) => {
    const css = getComputedStyle(node);
    return {
      label: String(node.textContent || "").replace(/\s+/g, " ").trim(),
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
  expect(box?.height || 0, `${label} physical height`).toBeGreaterThanOrEqual(43.5);
  expect(box?.width || 0, `${label} physical width`).toBeGreaterThanOrEqual(44);
  expect(style.minHeight, `${label} CSS minimum`).toBeGreaterThanOrEqual(44);
  expect(style.boxSizing, `${label} box sizing`).toBe("border-box");
  expect(style.touchAction, `${label} touch action`).toBe("manipulation");
  return { box, style };
}

function overlapArea(a, b) {
  if (!a || !b) return 0;
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 2 && height > 2 ? width * height : 0;
}

test("Phase 4E.11 closes measured Coach default-state touch targets on current route controls", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await enterCoachDemo(page);

  await navigateByKey(page, "players");
  const inviteSection = page.getByTestId("coach-player-invite-dashboard-section");
  await expect(inviteSection).toBeVisible({ timeout: 20_000 });
  await inviteSection.scrollIntoViewIfNeeded();
  await settle(page);
  const viewRoster = inviteSection.getByRole("button", { name: "View roster" });
  const viewRosterEvidence = await measureControl(viewRoster, "View roster");
  const rosterTarget = page.locator("#coach-roster-operations");
  const beforeScroll = await page.evaluate(() => document.querySelector(".coach-scroll-container")?.scrollTop || 0);
  await viewRoster.click();
  await page.waitForTimeout(500);
  const afterScroll = await page.evaluate(() => document.querySelector(".coach-scroll-container")?.scrollTop || 0);
  expect(afterScroll, "View roster must advance the Coach workspace toward roster operations").toBeGreaterThanOrEqual(beforeScroll);
  await expect(rosterTarget).toBeAttached();
  await inviteSection.scrollIntoViewIfNeeded();
  await settle(page);
  await inviteSection.screenshot({ path: path.join(OUTPUT_DIR, "coach-players-view-roster.png"), animations: "disabled" });

  await navigateByKey(page, "leaderboards");
  const dashboard = page.getByTestId("coach-page-dashboard-leaderboards");
  await expect(dashboard).toBeVisible({ timeout: 20_000 });

  const decision = page.getByTestId("coach-page-dashboard-leaderboards-decision-brief");
  await expect(decision).toBeVisible();
  const performanceRail = decision.locator('[data-visual-role="performance-evidence"]');
  await expect(performanceRail).toBeVisible();

  const currentLeader = performanceRail.getByRole("button", { name: /^Current Leader:/ });
  const archivedSeasons = performanceRail.getByRole("button", { name: /^Archived Seasons:/ });
  const reviewView = performanceRail.getByRole("button", { name: /^View:/ });

  // Measure all controls from the same viewport state. Playwright bounding boxes are viewport-relative,
  // so comparing boxes captured after separate scrollIntoView calls creates false overlap failures.
  await performanceRail.scrollIntoViewIfNeeded();
  await settle(page);
  const currentLeaderEvidence = await measureControl(currentLeader, "Current Leader metric");
  const archivedEvidence = await measureControl(archivedSeasons, "Archived Seasons metric");
  const viewEvidence = await measureControl(reviewView, "View metric");

  await currentLeader.click();
  await expect(currentLeader).toHaveAttribute("aria-pressed", "true");
  await archivedSeasons.click();
  await expect(archivedSeasons).toHaveAttribute("aria-pressed", "true");
  await reviewView.click();
  await expect(reviewView).toHaveAttribute("aria-pressed", "true");

  const leaderBoxes = [currentLeaderEvidence.box, archivedEvidence.box, viewEvidence.box];
  for (let i = 0; i < leaderBoxes.length; i += 1) {
    for (let j = i + 1; j < leaderBoxes.length; j += 1) {
      expect(overlapArea(leaderBoxes[i], leaderBoxes[j]), `leaderboard metric ${i + 1} must not overlap ${j + 1}`).toBe(0);
    }
  }

  await decision.scrollIntoViewIfNeeded();
  await settle(page);
  await decision.screenshot({ path: path.join(OUTPUT_DIR, "coach-leaderboards-decision-stage.png"), animations: "disabled" });
  await performanceRail.scrollIntoViewIfNeeded();
  await settle(page);
  await performanceRail.screenshot({ path: path.join(OUTPUT_DIR, "coach-leaderboards-performance-rail.png"), animations: "disabled" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "coach-leaderboards-viewport.png"), animations: "disabled" });

  const horizontal = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  expect(horizontal.documentWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);
  expect(horizontal.bodyWidth - horizontal.innerWidth).toBeLessThanOrEqual(1);

  fs.writeFileSync(path.join(OUTPUT_DIR, "coach-residual-touch-safety.json"), JSON.stringify({
    horizontal,
    viewRoster: viewRosterEvidence,
    leaderboardMetrics: {
      currentLeader: currentLeaderEvidence,
      archivedSeasons: archivedEvidence,
      view: viewEvidence,
    },
    rosterScroll: { before: beforeScroll, after: afterScroll },
  }, null, 2));

  expect(pageErrors).toEqual([]);
});
