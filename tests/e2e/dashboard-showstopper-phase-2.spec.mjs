import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.resolve(process.cwd(), "artifacts/dashboard-showstopper-phase-2");
const DEMO_EMAIL = "demo@shotlab.app";
const DEMO_TEAM_ID = "team-demo-titans";
const DEMO_COACH_EMAIL = "coach.demo@shotlab.app";

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/legacy-auth/restore", async (route) => {
    const payload = route.request().postDataJSON?.() || {};
    const email = String(payload?.email || "").trim().toLowerCase();
    if (email !== DEMO_EMAIL) return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: "profile_not_found" }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, profile: { email: DEMO_EMAIL, name: "Demo Player", role: "player", team_id: DEMO_TEAM_ID, hide_from_leaderboards: false } }) });
  });
  await page.route("**/v1/teams/restore-context", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, team: { id: DEMO_TEAM_ID, name: "ShotLab Team", ownerCoachId: DEMO_COACH_EMAIL, joinCode: "SHOTLAB", createdAt: Date.now() - 86400000 } }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function settleHome(page) {
  await expect(page.getByTestId("player-daily-command-center")).toBeVisible({ timeout: 20_000 });
  if ((page.viewportSize()?.width || 390) <= 700) await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    window.scrollTo(0, 0);
    document.querySelector(".player-scroll-container")?.scrollTo(0, 0);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function enterPlayerDemo(page) {
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.getByRole("button", { name: "Player demo", exact: true }).click();
  await settleHome(page);
}

async function applyPerformance(page, makes) {
  await page.evaluate(({ makes, demoEmail, demoTeamId }) => {
    const date = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const today = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const existing = JSON.parse(localStorage.getItem("sl:shotlogs") || "[]").filter((row) => String(row?.email || row?.player_email || "").toLowerCase() !== demoEmail);
    if (Number(makes) > 0) existing.push({ id: `dashboard-showstopper-phase-2-${makes}`, email: demoEmail, playerId: demoEmail, teamId: demoTeamId, name: "Demo Player", made: Number(makes), date: today, ts: Date.now() });
    localStorage.setItem("sl:shotlogs", JSON.stringify(existing));
    const meta = JSON.parse(localStorage.getItem("sl:demo-data-meta") || "{}");
    localStorage.setItem("sl:demo-data-meta", JSON.stringify({ ...meta, source: "dashboard-showstopper-phase-2", teamId: demoTeamId }));
  }, { makes, demoEmail: DEMO_EMAIL, demoTeamId: DEMO_TEAM_ID });
  await page.goto("/?demo=1");
  await settleHome(page);
}

async function capture(page, name, { fullPage = true } = {}) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(OUTPUT_DIR, `${name}.png`), fullPage, animations: "disabled" });
}

async function assertNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
}

test.beforeEach(async ({ page }) => installRoutes(page));

test("ShotLab Target Court owns the 0/25/85/100/125 performance states", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await enterPlayerDemo(page);
  const states = [
    { makes: 0, state: "zero", target: "0", above: "0", interpretation: "100 TO TARGET", name: "player-home-state-zero-390" },
    { makes: 25, state: "partial", target: "25", above: "0", interpretation: "75 TO TARGET", name: "player-home-state-partial-25-390" },
    { makes: 85, state: "near", target: "85", above: "0", interpretation: "15 TO TARGET", name: "player-home-state-near-85-390" },
    { makes: 100, state: "complete", target: "100", above: "0", interpretation: "TARGET COMPLETE", name: "player-home-state-complete-100-390" },
    { makes: 125, state: "above", target: "100", above: "25", interpretation: "+25 ABOVE TARGET", name: "player-home-state-above-125-390" },
  ];

  for (const expected of states) {
    await applyPerformance(page, expected.makes);
    const visual = page.locator('[data-performance-visual="shotlab-target-court"]');
    await expect(visual).toHaveCount(1);
    await expect(visual).toHaveAttribute("data-performance-state", expected.state);
    await expect(visual).toHaveAttribute("data-target-percent", expected.target);
    await expect(visual).toHaveAttribute("data-above-target", expected.above);
    await expect(visual).toHaveAttribute("role", "img");
    await expect(page.getByTestId("player-target-interpretation")).toHaveText(expected.interpretation);
    await assertNoOverflow(page);
    await capture(page, expected.name);
  }
});

test("100 and 125 are visually and semantically distinct", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterPlayerDemo(page);
  await applyPerformance(page, 100);
  const visual = page.locator('[data-performance-visual="shotlab-target-court"]');
  const exact = await visual.evaluate((node) => ({ state: node.dataset.performanceState, above: node.dataset.aboveTarget, label: node.getAttribute("aria-label"), overflow: node.querySelectorAll('[data-performance-layer="above-target-value"]').length }));
  await applyPerformance(page, 125);
  const above = await page.locator('[data-performance-visual="shotlab-target-court"]').evaluate((node) => ({ state: node.dataset.performanceState, above: node.dataset.aboveTarget, label: node.getAttribute("aria-label"), overflow: node.querySelectorAll('[data-performance-layer="above-target-value"]').length }));
  expect(exact.state).toBe("complete");
  expect(exact.overflow).toBe(0);
  expect(above.state).toBe("above");
  expect(above.above).toBe("25");
  expect(above.overflow).toBeGreaterThan(0);
  expect(above.label).toMatch(/25 above target/i);
  expect(above.label).not.toBe(exact.label);
});

test("Target Court remains composed at 375, 390, 430 and desktop widths", async ({ page }) => {
  for (const [width, height, name] of [[375,844,"player-home-375"],[390,844,"player-home-390"],[430,932,"player-home-430"],[1280,900,"player-home-desktop-1280"]]) {
    await page.setViewportSize({ width, height });
    await enterPlayerDemo(page);
    await applyPerformance(page, 125);
    await expect(page.locator('[data-performance-visual="shotlab-target-court"]')).toBeVisible();
    await expect(page.getByTestId("player-daily-primary-action")).toBeVisible();
    await assertNoOverflow(page);
    await capture(page, name);
  }
});

test("long athlete identity and the Hero to cream chapter retain mobile clearance", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 844 });
  await enterPlayerDemo(page);
  await applyPerformance(page, 85);
  await page.getByTestId("player-dashboard-identity-header").evaluate((node) => {
    const name = node.querySelector('[data-identity-role="name"]');
    const team = node.querySelector('[data-identity-role="team-name"]');
    if (name) name.textContent = "Alexandria Montgomery-Washington";
    if (team) team.textContent = "Webster Thomas Elite Player Development Program";
  });
  await assertNoOverflow(page);
  await capture(page, "player-home-375-long-identity");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?demo=1");
  await settleHome(page);
  await page.evaluate(async () => {
    const nested = document.querySelector(".player-scroll-container");
    const scroller = nested && nested.scrollHeight > nested.clientHeight + 1 ? nested : document.scrollingElement;
    scroller?.scrollTo(0, Math.min(scroller.scrollHeight, 780));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible();
  await assertNoOverflow(page);
  await capture(page, "player-home-390-scrolled-hero-to-cream", { fullPage: false });
});

test("Target Court reduced-motion and semantic contracts hold", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await enterPlayerDemo(page);
  await applyPerformance(page, 125);
  const visual = page.locator('[data-performance-visual="shotlab-target-court"]');
  await expect(visual).toHaveAttribute("aria-label", /125 makes today.*25 above target/i);
  const targetLockDuration = await visual.locator('[data-performance-layer="target-lock"]').evaluate((node) => getComputedStyle(node).transitionDuration);
  expect(["0s", "0ms"]).toContain(targetLockDuration);
  await expect(page.getByTestId("player-daily-primary-action")).toHaveCount(1);
  const actionHeight = await page.getByTestId("player-daily-primary-action").evaluate((node) => node.getBoundingClientRect().height);
  expect(actionHeight).toBeGreaterThanOrEqual(44);
});
