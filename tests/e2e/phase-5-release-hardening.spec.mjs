import { test, expect } from "@playwright/test";

async function installSafeRoutes(page, counters = {}) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.route("**/v1/coach-follow-ups**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_ups: [] }) });
    }
    counters.followUpPosts = (counters.followUpPosts || 0) + 1;
    const body = JSON.parse(route.request().postData() || "{}");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_up: { ...body, updated_at: "2026-08-16T14:30:00.000Z", updated_by: "demo.coach@shotlab.app" } }),
    });
  });
}

async function enterCoachDemo(page) {
  await page.goto("/");
  const button = page.getByRole("button", { name: "Coach demo", exact: true });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function openDemoPlayerDrawer(page) {
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Players", exact: true }).click();
  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  await roster.getByText("Demo Player", { exact: true }).first().click();
  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(drawer.getByTestId("coach-follow-up-ledger")).toBeVisible({ timeout: 20_000 });
  return drawer;
}

async function expectNoHorizontalOverflow(page) {
  const geometry = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(geometry.document - geometry.viewport).toBeLessThanOrEqual(2);
  expect(geometry.body - geometry.viewport).toBeLessThanOrEqual(2);
}

test.describe("Phase 5 release hardening", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("failed Coach assignment delivery never presents a false Delivered state and remains retryable", async ({ page }) => {
    const counters = {};
    await installSafeRoutes(page, counters);
    await page.route("**/v1/player-assignments**", async (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", assignments: [] }) });
      }
      counters.assignmentPosts = (counters.assignmentPosts || 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 150));
      return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "temporarily_unavailable" }) });
    });

    await enterCoachDemo(page);
    const drawer = await openDemoPlayerDrawer(page);
    const assignment = drawer.getByTestId("coach-next-assignment-input");
    await assignment.fill("Repeat the form shooting block and match today's makes.");
    const deliver = drawer.getByRole("button", { name: "Deliver next assignment", exact: true });

    await deliver.dblclick();
    await expect(drawer.getByRole("status")).toContainText(/delivery could not be confirmed|retry when connected/i);
    await expect(deliver).toBeEnabled();
    await expect(assignment).toHaveValue("Repeat the form shooting block and match today's makes.");
    await expect(drawer.getByTestId("coach-player-assignment-status")).toHaveCount(0);
    expect(counters.assignmentPosts).toBe(1);
    expect(counters.followUpPosts).toBe(1);
  });

  test("Player Intelligence keeps a single scroll workspace after Follow-Up mounts", async ({ page }) => {
    await installSafeRoutes(page);
    await page.route("**/v1/player-assignments**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", assignments: [] }) }));
    await enterCoachDemo(page);
    const drawer = await openDemoPlayerDrawer(page);

    const geometry = await drawer.evaluate((root) => {
      const dialog = root.querySelector('[role="dialog"]');
      const followUp = root.querySelector('[data-testid="coach-follow-up-ledger-host"]');
      const profileButton = [...(dialog?.querySelectorAll("button") || [])].find((button) => button.textContent?.trim() === "Open Full Profile");
      const scrollBody = profileButton?.parentElement?.parentElement;
      const bodyStyle = scrollBody ? getComputedStyle(scrollBody) : null;
      return {
        followUpSharesPlayerBody: Boolean(followUp && scrollBody && followUp.parentElement === scrollBody),
        scrollHeight: scrollBody?.scrollHeight || 0,
        clientHeight: scrollBody?.clientHeight || 0,
        overflowY: bodyStyle?.overflowY || "",
        dialogHeight: dialog?.getBoundingClientRect().height || 0,
      };
    });

    expect(geometry.followUpSharesPlayerBody).toBe(true);
    expect(geometry.dialogHeight).toBeGreaterThan(300);
    expect(geometry.scrollHeight).toBeGreaterThanOrEqual(geometry.clientHeight);
    expect(["auto", "scroll"]).toContain(geometry.overflowY);
    await expectNoHorizontalOverflow(page);
  });

  test("Team Branding keeps every visible interactive target at least 44px tall", async ({ page }) => {
    await installSafeRoutes(page);
    await enterCoachDemo(page);
    const dock = page.getByTestId("mobile-navigation-dock");
    const direct = dock.locator('[data-nav-key="settings"]');
    if (await direct.count()) {
      await direct.click();
    } else {
      await page.getByTestId("mobile-navigation-more").click();
      await page.getByTestId("mobile-navigation-sheet").locator('[data-nav-key="settings"]').click();
    }
    await page.getByTestId("coach-administration-header").getByRole("button", { name: "Team Branding", exact: true }).click();
    const workspace = page.getByTestId("coach-branding-workspace");
    await expect(workspace).toBeVisible({ timeout: 20_000 });

    const targets = workspace.locator("button:visible, input:visible");
    const count = await targets.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      const box = await targets.nth(index).boundingBox();
      expect(box, `target ${index} should have measurable geometry`).not.toBeNull();
      expect(box.height, `target ${index} is ${box.height}px tall`).toBeGreaterThanOrEqual(43.5);
    }
    await expectNoHorizontalOverflow(page);
  });
});
