import { test, expect } from "@playwright/test";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterPlayerDemo(page) {
  await installRoutes(page);
  await page.goto("/");
  const demo = page.getByRole("button", { name: /Player demo/i });
  await expect(demo).toBeVisible({ timeout: 20_000 });
  await demo.click();
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 20_000 });
  return dock;
}

test("Player Leaderboards ends near its content while preserving ranking navigation and Logout", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  const dock = await enterPlayerDemo(page);
  await dock.getByRole("button", { name: "Progress", exact: true }).click();

  const hub = page.getByTestId("premium-leaderboards-hub");
  await expect(hub).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Logout", exact: true })).toBeVisible();

  await expect(hub.getByRole("button", { name: "Current / Offseason", exact: true })).toBeVisible();
  await expect(hub.getByRole("button", { name: "All-Time", exact: true })).toBeVisible();
  await expect(hub.getByRole("button", { name: "At-Home Shots", exact: true })).toBeVisible();
  await expect(hub.getByRole("button", { name: "Program Drills", exact: true })).toBeVisible();
  await expect(hub.getByRole("button", { name: "Events Attended", exact: true })).toBeVisible();
  await expect(hub.getByRole("button", { name: "Strength & Conditioning", exact: true })).toBeVisible();

  const layout = await page.evaluate(() => {
    const node = document.querySelector('[data-testid="premium-leaderboards-hub"]');
    if (!node) throw new Error("Leaderboard hub missing");
    const rect = node.getBoundingClientRect();
    const hubBottom = rect.bottom + window.scrollY;
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
      tail: document.documentElement.scrollHeight - hubBottom,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      hubBottom,
      nodes: [
        read('.performance-shell--player'),
        read('.performance-shell--player .shell-main'),
        read('.performance-shell--player .content-wrap'),
        read('.performance-shell--player .performance-workspace'),
        read('.performance-shell--player .player-scroll-container'),
        read('.performance-shell--player .player-scroll-container > .screen-fade-in'),
        read('[data-testid="premium-leaderboards-hub"]'),
      ],
    };
  });

  console.log("PHASE3L_GEOMETRY", JSON.stringify(layout));
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.tail, "Leaderboards should retain only fixed-dock/safe-area breathing room after content").toBeLessThanOrEqual(220);
});
