import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/phase-4d-back-control-hook-audit");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({ viewport: { width: 390, height: 844 } });

async function installSafeRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ team_id: "demo", limit: 10, scope: "players", count: 0, leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settle(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    document.querySelector(".coach-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(100);
}

async function enterDemo(page, role) {
  await installSafeRoutes(page);
  await page.goto("/");
  const button = page.getByRole("button", { name: role === "coach" ? /Coach demo/i : /Player demo/i });
  await expect(button).toBeVisible({ timeout: 20_000 });
  await button.click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await settle(page);
}

async function navigate(page, key) {
  const direct = page.getByTestId("mobile-navigation-dock").locator(`[data-nav-key="${key}"]`);
  if (await direct.count()) {
    await direct.click();
  } else {
    await page.getByTestId("mobile-navigation-more").click();
    const sheet = page.getByTestId("mobile-navigation-sheet");
    await expect(sheet).toBeVisible();
    await sheet.locator(`[data-nav-key="${key}"]`).click();
  }
  await settle(page);
}

async function inspectControl(locator, role, surface) {
  await expect(locator).toBeVisible();
  return locator.evaluate((node, meta) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const ancestors = [];
    let current = node.parentElement;
    for (let depth = 0; current && depth < 6; depth += 1, current = current.parentElement) {
      ancestors.push({
        tag: current.tagName.toLowerCase(),
        className: typeof current.className === "string" ? current.className.replace(/\s+/g, " ").trim() : "",
        testId: current.getAttribute("data-testid") || "",
        id: current.id || "",
      });
    }
    return {
      ...meta,
      tag: node.tagName.toLowerCase(),
      text: String(node.textContent || "").replace(/\s+/g, " ").trim(),
      className: typeof node.className === "string" ? node.className.replace(/\s+/g, " ").trim() : "",
      testId: node.getAttribute("data-testid") || "",
      id: node.id || "",
      ariaLabel: node.getAttribute("aria-label") || "",
      type: node.getAttribute("type") || "",
      styleAttribute: node.getAttribute("style") || "",
      box: { width: rect.width, height: rect.height, left: rect.left, top: rect.top },
      computed: {
        display: style.display,
        minHeight: style.minHeight,
        height: style.height,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        borderTopWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
      },
      ancestors,
    };
  }, { role, surface });
}

test("capture Coach and Player back-navigation DOM hooks", async ({ browser }) => {
  const records = [];

  const coachContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const coachPage = await coachContext.newPage();
  await enterDemo(coachPage, "coach");
  for (const key of ["players", "leaderboards"]) {
    await navigate(coachPage, key);
    const back = coachPage.getByRole("button", { name: /Dashboard/i }).filter({ hasText: /Dashboard/i }).first();
    records.push(await inspectControl(back, "coach", key));
  }
  await coachContext.close();

  const playerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const playerPage = await playerContext.newPage();
  await enterDemo(playerPage, "player");
  for (const key of ["log-drill", "profile", "program", "leaderboards"]) {
    await navigate(playerPage, key);
    const back = playerPage.getByRole("button", { name: /Back to Dashboard/i }).first();
    records.push(await inspectControl(back, "player", key));
  }
  await playerContext.close();

  expect(records).toHaveLength(6);
  fs.writeFileSync(path.join(OUTPUT_DIR, "back-control-hooks.json"), JSON.stringify(records, null, 2));
  console.log(JSON.stringify(records, null, 2));
});
