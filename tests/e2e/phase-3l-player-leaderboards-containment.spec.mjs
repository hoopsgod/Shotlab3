import { test, expect } from "@playwright/test";

const PHASE3L_CSS_PATH = "/shotlab-phase3l-player-leaderboards-containment.css";

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

  const participation = hub.getByTestId("leaderboard-participation-categories");
  await expect(participation).toBeVisible();
  await expect(participation.getByText("Participation categories", { exact: true })).toBeVisible();
  await expect(participation.getByText("Events attended and strength work", { exact: true })).toBeVisible();

  const cssDiagnostic = await page.evaluate(async (cssPath) => {
    const workspace = document.querySelector('.performance-shell--player.is-mobile[data-workspace-tab="leaderboards"] .performance-workspace');
    const route = document.querySelector('.performance-shell--player.is-mobile[data-workspace-tab="leaderboards"] .player-scroll-container > .screen-fade-in');
    const after = route ? getComputedStyle(route, "::after") : null;
    let assetStatus = 0;
    let assetText = "";
    try {
      const response = await fetch(cssPath, { cache: "no-store" });
      assetStatus = response.status;
      assetText = await response.text();
    } catch (error) {
      assetText = String(error?.message || error || "fetch failed");
    }
    const styleHrefs = Array.from(document.styleSheets)
      .map((sheet) => sheet.href || "")
      .filter(Boolean);
    return {
      styleHrefs,
      stylesheetLoaded: styleHrefs.some((href) => href.includes("shotlab-phase3l-player-leaderboards-containment.css")),
      assetStatus,
      assetHasSpacerRule: assetText.includes(".player-scroll-container > .screen-fade-in::after"),
      reserve: workspace ? getComputedStyle(workspace).getPropertyValue("--phase3l-leaderboards-dock-reserve").trim() : null,
      routeFound: Boolean(route),
      after: after ? {
        content: after.content,
        display: after.display,
        height: after.height,
        minHeight: after.minHeight,
        width: after.width,
        position: after.position,
      } : null,
    };
  }, PHASE3L_CSS_PATH);

  console.log("PHASE3L_CSS_DIAGNOSTIC", JSON.stringify(cssDiagnostic));

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
  expect(cssDiagnostic.assetStatus, "Phase 3L CSS must ship in the production build").toBe(200);
  expect(cssDiagnostic.assetHasSpacerRule, "Built Phase 3L CSS must contain the structural spacer rule").toBe(true);
  expect(cssDiagnostic.stylesheetLoaded, "Phase 3L CSS must be attached to the rendered document").toBe(true);
  expect(cssDiagnostic.routeFound, "Player Leaderboards route wrapper must exist at the Phase 3L selector seam").toBe(true);
  expect(cssDiagnostic.reserve, "Phase 3L dock reserve token must resolve on the live Leaderboards workspace").not.toBe("");
  expect(layout.overflow).toBeLessThanOrEqual(1);
  expect(layout.tail, "Leaderboards should retain one deliberate dock-safe end reserve").toBeGreaterThanOrEqual(96);
  expect(layout.tail, "Leaderboards should not restore the old empty canvas tail").toBeLessThanOrEqual(220);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const dockClearance = await page.evaluate(() => {
    const summary = document.querySelector('[data-testid="leaderboard-participation-categories"] summary');
    const mobileDock = document.querySelector('[data-testid="mobile-navigation-dock"]');
    if (!summary || !mobileDock) throw new Error("Leaderboards dock-clearance targets missing");
    return mobileDock.getBoundingClientRect().top - summary.getBoundingClientRect().bottom;
  });
  console.log("PHASE3L_DOCK_CLEARANCE", dockClearance);
  expect(dockClearance, "The final Leaderboards disclosure must scroll above the fixed dock").toBeGreaterThanOrEqual(8);

  await participation.locator("summary").click();
  await expect(participation).toHaveAttribute("open", "");
  await expect(participation.getByRole("button", { name: "Events Attended", exact: true })).toBeVisible();
  await expect(participation.getByRole("button", { name: "Strength & Conditioning", exact: true })).toBeVisible();
});
