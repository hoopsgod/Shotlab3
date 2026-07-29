import { test, expect } from "@playwright/test";

const TEAM_ID = "team-assignment-outcome";
const today = new Date().toISOString().slice(0, 10);

const seed = {
  "sl:teams": [{ id: TEAM_ID, name: "Assignment Outcome Team", ownerCoachId: "coach.demo@shotlab.app", joinCode: "OUTCOME" }],
  "sl:players": [
    { id: "coach", email: "coach.demo@shotlab.app", name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "one", email: "one@example.test", name: "Complete Player", role: "player", teamId: TEAM_ID },
    { id: "two", email: "two@example.test", name: "Other Work", role: "player", teamId: TEAM_ID },
    { id: "three", email: "three@example.test", name: "Open Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [],
  "sl:drills": [{ id: "form-shooting", name: "Form Shooting" }, { id: "corner-threes", name: "Corner Threes" }],
  "sl:program-drills": [],
  "sl:coach-priorities": { [TEAM_ID]: { todayFocusText: "Own the first three steps", priorityDrillText: "Form Shooting", challengeText: "Complete the priority first.", weeklyMakesTarget: 500, weeklyCheckinsTarget: 2 } },
  "sl:scores": [
    { id: "complete", email: "one@example.test", teamId: TEAM_ID, drillId: "form-shooting", drillName: "Form Shooting", date: today, score: 45 },
    { id: "other", email: "two@example.test", teamId: TEAM_ID, drillId: "corner-threes", drillName: "Corner Threes", date: today, score: 24 },
  ],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:sc-logs": [],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:season-archives": [],
};

test("Mission Control reports current priority completion", async ({ page }) => {
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "demo_local", priorities_by_team: seed["sl:coach-priorities"] }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.addInitScript((payload) => {
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);
  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();

  const panel = page.getByTestId("coach-assignment-outcome");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel.getByRole("heading", { name: "Form Shooting", exact: true })).toBeVisible();

  // Coach Demo adds its own active Demo Player to the three seeded players.
  // The truthful team result is therefore one completion across four rostered players.
  await expect(panel.getByLabel("25% assignment completion")).toBeVisible();
  await expect(panel.getByText("1 of 4 completed this week", { exact: true })).toBeVisible();
  await expect(panel.getByLabel("Assignment response summary")).toContainText("1Completed");
  await expect(panel.getByLabel("Assignment response summary")).toContainText("1Other work");
  await expect(panel.getByLabel("Assignment response summary")).toContainText("2Not started");

  // The three-row preview intentionally prioritizes players who still need action.
  await expect(panel.getByText("Demo Player", { exact: true })).toBeVisible();
  await expect(panel.getByText("Other Work", { exact: true })).toBeVisible();
  await expect(panel.getByText("Open Player", { exact: true })).toBeVisible();
  await expect(panel.getByText("Complete Player", { exact: true })).not.toBeVisible();
  await expect(panel).not.toContainText(/viewed|read receipt/i);

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
});