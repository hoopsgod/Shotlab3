import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve(process.cwd(), "artifacts/design-audit/iphone");
const TEAM_ID = "team-phase5b-readiness";
const COACH_EMAIL = "coach.demo@shotlab.app";

const dateOffset = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const NEXT_EVENT_DATE = dateOffset(1);
const seedData = {
  "sl:teams": [{ id: TEAM_ID, name: "Thomas Titans", ownerCoachId: COACH_EMAIL, joinCode: "READY5", createdAt: 1_750_000_000_000 }],
  "sl:players": [
    { id: "coach-ready", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player-attending", playerId: "player-attending", email: "attending@example.com", name: "Ava Brooks", role: "player", teamId: TEAM_ID },
    { id: "player-unavailable", playerId: "player-unavailable", email: "unavailable@example.com", name: "Jordan Lee", role: "player", teamId: TEAM_ID },
    { id: "player-awaiting", playerId: "player-awaiting", email: "awaiting@example.com", name: "Micah Santos", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:events": [
    { id: "event-practice", teamId: TEAM_ID, title: "Team Practice", type: "run", date: NEXT_EVENT_DATE, time: "6:00 PM", location: "Main Gym", desc: "Team shooting standards and controlled five-on-five." },
  ],
  "sl:rsvps": [
    { id: "rsvp-attending", eventId: "event-practice", playerId: "player-attending", email: "attending@example.com", name: "Ava Brooks", teamId: TEAM_ID, attended: true, ts: 100 },
    { id: "rsvp-unavailable", eventId: "event-practice", playerId: "player-unavailable", email: "unavailable@example.com", name: "Jordan Lee", teamId: TEAM_ID, attended: false, ts: 110 },
  ],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

async function installRoutes(page) {
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/coach/players/provision**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterCoach(page) {
  await page.addInitScript((payload) => {
    if (window.sessionStorage.getItem("phase5b-seeded") === "1") return;
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
    window.sessionStorage.setItem("phase5b-seeded", "1");
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: "Coach demo", exact: true }).click();
  await expect(page.getByTestId("mobile-navigation-dock")).toBeVisible({ timeout: 20_000 });
}

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForTimeout(700);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function expectNoHorizontalOverflow(page) {
  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 1);
}

test.beforeEach(async ({ page }) => {
  await installRoutes(page);
});

test("Phase 5B presents next-practice attendance as observed roster evidence", async ({ page }) => {
  await enterCoach(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Schedule", exact: true }).click();

  const dashboard = page.getByTestId("coach-events-interactive-dashboard");
  const metrics = page.getByTestId("coach-events-metric-strip");
  const decision = page.getByTestId("coach-events-decision-brief");
  await expect(dashboard).toBeVisible({ timeout: 20_000 });
  await expect(metrics).toContainText("Awaiting RSVP");
  await expect(metrics).toContainText("1");
  await expect(metrics).toContainText("67%");
  await expect(metrics).toContainText("2 responses · 1 attending");
  await expect(decision).toContainText("Team Practice");
  await expect(decision).toContainText("1 attending · 1 unavailable · 1 awaiting response");
  await expect(decision).toContainText("Next-session availability");
  await expect(decision).toContainText("1 attending · 1 awaiting");
  await expect(decision.getByRole("button", { name: "Resolve RSVPs", exact: true })).toBeVisible();

  const buttonBox = await decision.getByRole("button", { name: "Resolve RSVPs", exact: true }).boundingBox();
  expect(buttonBox?.height || 0).toBeGreaterThanOrEqual(44);
  await expectNoHorizontalOverflow(page);
  await settle(page);

  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "14a-phase5b-practice-readiness.png"), fullPage: false, animations: "disabled" });
});

test("Phase 5B keeps event intelligence truthful one level deeper", async ({ page }) => {
  await enterCoach(page);
  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Schedule", exact: true }).click();

  const decision = page.getByTestId("coach-events-decision-brief");
  await decision.getByRole("button", { name: "Resolve RSVPs", exact: true }).click();

  const drawer = page.getByTestId("coach-event-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 10_000 });
  await expect(drawer).toContainText("Attending");
  await expect(drawer).toContainText("Unavailable");
  await expect(drawer).toContainText("Awaiting RSVP");
  await expect(drawer).toContainText("67%");
  await expect(drawer).toContainText("Ava Brooks");
  await expect(drawer).toContainText("Jordan Lee");
  await expect(drawer).toContainText("Micah Santos");
  await expect(drawer).not.toContainText("No confirmed players yet");
  await expectNoHorizontalOverflow(page);
  await settle(page);

  fs.mkdirSync(outputDir, { recursive: true });
  await page.screenshot({ path: path.join(outputDir, "14b-phase5b-event-intelligence.png"), fullPage: false, animations: "disabled" });
});
