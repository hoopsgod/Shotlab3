import { test, expect } from "@playwright/test";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterPlayerHome(page) {
  await installRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  return dock;
}

test("Player Home ends near More progress while preserving command center and dock-safe support access", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await enterPlayerHome(page);

  const commandCenter = page.getByTestId("player-daily-command-center");
  const upcoming = page.getByTestId("player-upcoming-schedule");
  const standings = page.getByTestId("player-team-standings");
  const guidance = page.getByTestId("player-coach-guidance");
  const moreProgress = page.getByTestId("player-secondary-intelligence");

  await expect(commandCenter).toBeVisible();
  await expect(upcoming).toBeVisible();
  await expect(standings).toBeVisible();
  await expect(guidance).toBeVisible();
  await expect(moreProgress).toBeVisible();
  await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeVisible();
  for (const disclosure of [upcoming, standings, guidance, moreProgress]) await expect(disclosure).not.toHaveAttribute("open", "");

  const layout = await page.evaluate(() => {
    const finalDisclosure = document.querySelector('[data-testid="player-secondary-intelligence"]');
    if (!finalDisclosure) throw new Error("Player Home More progress disclosure missing");
    const rect = finalDisclosure.getBoundingClientRect();
    const contentBottom = rect.bottom + window.scrollY;
    const read = (selector) => {
      const target = document.querySelector(selector);
      if (!target) return null;
      const box = target.getBoundingClientRect();
      const style = getComputedStyle(target);
      return {
        selector,
        top: box.top + window.scrollY,
        bottom: box.bottom + window.scrollY,
        height: box.height,
        clientHeight: target.clientHeight,
        scrollHeight: target.scrollHeight,
        minHeight: style.minHeight,
        heightStyle: style.height,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        display: style.display,
        flex: style.flex,
      };
    };
    return {
      tail: document.documentElement.scrollHeight - contentBottom,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      contentBottom,
      nodes: [
        read('.performance-shell--player'),
        read('.performance-shell--player .shell-main'),
        read('.performance-shell--player .content-wrap'),
        read('.performance-shell--player .performance-workspace'),
        read('.performance-shell--player .player-scroll-container'),
        read('.performance-shell--player .player-scroll-container > .screen-fade-in'),
        read('.player-home-compact-dashboard'),
        read('[data-testid="player-secondary-intelligence"]'),
      ],
    };
  });

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const dockClearance = await page.evaluate(() => {
    const summary = document.querySelector('[data-testid="player-secondary-intelligence"] > summary');
    const dock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    if (!summary || !dock) throw new Error("Player Home dock-clearance targets missing");
    return dock.getBoundingClientRect().top - summary.getBoundingClientRect().bottom;
  });

  console.log("PHASE3O_HOME_GEOMETRY", JSON.stringify(layout));
  console.log("PHASE3O_HOME_DOCK_CLEARANCE", dockClearance);

  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.tail, "Player Home should retain only one intentional dock-safe end reserve").toBeLessThanOrEqual(220);
  expect(dockClearance, "More progress must be able to scroll above the fixed mobile dock").toBeGreaterThanOrEqual(8);

  await moreProgress.locator(":scope > summary").click();
  await expect(moreProgress).toHaveAttribute("open", "");
  await expect(page.getByTestId("player-daily-momentum-signal")).toBeVisible();
});
