import { test, expect } from "@playwright/test";

const TEAM_ID = "team-player-freshness";
const PLAYER_EMAIL = "demo@shotlab.app";
const OLD_FOCUS = "Old closeout focus that must not be shown";
const OLD_DRILL = "Form Shooting";
const OLD_CHALLENGE = "Complete the old assignment before anything else.";
const oldPublishedAt = new Date(Date.now() - (10 * 24 * 60 * 60 * 1000)).toISOString();

const priorities = {
  todayFocusText: OLD_FOCUS,
  focusEmphasis: "Technique",
  priorityDrillText: OLD_DRILL,
  challengeText: OLD_CHALLENGE,
  weeklyMakesTarget: 500,
  weeklyCheckinsTarget: 2,
  updatedAt: oldPublishedAt,
};

const seed = {
  "sl:teams": [{ id: TEAM_ID, name: "Player Freshness Team", joinCode: "FRESH", ownerCoachId: "coach.demo@shotlab.app" }],
  "sl:players": [
    { id: "freshness-coach", email: "coach.demo@shotlab.app", name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "freshness-player", playerId: PLAYER_EMAIL, email: PLAYER_EMAIL, name: "Demo Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [{ id: "freshness-profile", userId: PLAYER_EMAIL, email: PLAYER_EMAIL, teamId: TEAM_ID, firstName: "Demo", lastName: "Player" }],
  "sl:drills": [
    { id: "form-shooting", name: "Form Shooting", desc: "Clean mechanics", max: 50, icon: "ft" },
    { id: "corner-threes", name: "Corner Threes", desc: "Corner volume", max: 40, icon: "3p" },
  ],
  "sl:program-drills": [],
  "sl:coach-priorities": { [TEAM_ID]: priorities },
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

test("stale coach guidance is not presented as today's player assignment", async ({ page }) => {
  await page.route("**/v1/team-priorities", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      storage_mode: "team_remote",
      priorities_by_team: { [TEAM_ID]: priorities },
      metadata_by_team: { [TEAM_ID]: { updatedAt: oldPublishedAt, updatedBy: "coach.demo@shotlab.app" } },
    }),
  }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);

  await page.goto("/");
  await page.getByRole("button", { name: "Demo Player", exact: true }).click();

  const commandCenter = page.getByTestId("player-daily-command-center");
  await expect(commandCenter).toBeVisible({ timeout: 20_000 });
  const signal = page.getByTestId("player-coach-priority-signal");
  await expect(signal).toBeVisible();
  await expect(signal).toHaveAttribute("data-freshness", "stale");
  await expect(signal).toContainText("Waiting for an updated team focus");
  await expect(signal).toContainText("days ago");
  await expect(signal).toContainText("Continue your current training plan");
  await expect(signal).not.toContainText(OLD_FOCUS);
  await expect(signal).not.toContainText(OLD_CHALLENGE);

  await expect(commandCenter).toContainText("Personal development");
  await expect(commandCenter).not.toContainText("Coach directed");
  await expect(page.getByTestId("player-daily-primary-action")).not.toContainText("Start coach priority");

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});