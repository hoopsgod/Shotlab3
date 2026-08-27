import { test, expect } from "@playwright/test";
import { enterSeededRegisteredCoach } from "./registered-coach-fixture.mjs";

const TEAM_ID = "team-assignment-outcome";
const COACH_EMAIL = "coach.assignment@shotlab.test";
const today = new Date().toISOString().slice(0, 10);
const DAY_MS = 24 * 60 * 60 * 1000;
const dateOffset = (days) => new Date(Date.now() + (days * DAY_MS)).toISOString().slice(0, 10);

const makeSeed = (updatedAt) => ({
  "sl:teams": [{ id: TEAM_ID, name: "Assignment Outcome Team", ownerCoachId: COACH_EMAIL, joinCode: "OUTCOME" }],
  "sl:players": [
    { id: "coach", email: COACH_EMAIL, name: "Assignment Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "one", email: "one@example.test", name: "Complete Player", role: "player", teamId: TEAM_ID },
    { id: "two", email: "two@example.test", name: "Other Work", role: "player", teamId: TEAM_ID },
    { id: "three", email: "three@example.test", name: "Open Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [],
  "sl:drills": [{ id: "form-shooting", name: "Form Shooting" }, { id: "corner-threes", name: "Corner Threes" }],
  "sl:program-drills": [],
  "sl:coach-priorities": { [TEAM_ID]: { todayFocusText: "Own the first three steps", priorityDrillText: "Form Shooting", challengeText: "Complete the priority first.", weeklyMakesTarget: 500, weeklyCheckinsTarget: 2, updatedAt } },
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
});

async function openCoachWithSeed(page, seed) {
  let followUpRecord = null;
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", priorities_by_team: seed["sl:coach-priorities"] }) }));
  await page.route("**/v1/coach-follow-ups*", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_ups: followUpRecord ? [followUpRecord] : [] }) });
    }
    const body = route.request().postDataJSON();
    const now = new Date().toISOString();
    followUpRecord = {
      team_id: body.team_id,
      player_identity: body.player_identity,
      player_name: body.player_name,
      state: body.state,
      note: body.note,
      created_at: body.created_at || now,
      updated_at: now,
      completed_at: body.state === "completed" ? now : null,
      updated_by: COACH_EMAIL,
    };
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_up: followUpRecord }) });
  });
  await page.route("**/v1/player-assignments**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", assignments: [] }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await enterSeededRegisteredCoach(page, {
    storage: seed,
    coachEmail: COACH_EMAIL,
    coachName: "Assignment Coach",
    teamId: TEAM_ID,
  });
  return { getFollowUpRecord: () => followUpRecord };
}

test("Mission Control reports post-publication completion, opens exact player intelligence, and records follow-up", async ({ page }) => {
  const seed = makeSeed(new Date().toISOString());
  const followUpApi = await openCoachWithSeed(page, seed);

  const panel = page.getByTestId("coach-assignment-outcome");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute("data-freshness", "current");
  await expect(panel).toHaveAttribute("data-measurement-mode", "published");
  await expect(panel.getByRole("heading", { name: "Form Shooting", exact: true })).toBeVisible();

  await expect(panel.getByLabel("33% assignment completion")).toBeVisible();
  await expect(panel.getByText("1 of 3 completed since published", { exact: true })).toBeVisible();
  await expect(panel.getByText(/counting results from \d{4}-\d{2}-\d{2}/i)).toBeVisible();
  await expect(panel.getByLabel("Assignment response summary")).toContainText("1Completed");
  await expect(panel.getByLabel("Assignment response summary")).toContainText("1Other work");
  await expect(panel.getByLabel("Assignment response summary")).toContainText("1Not started");

  // The preview prioritizes players who still need action, then includes the completed row.
  await expect(panel.getByText("Open Player", { exact: true })).toBeVisible();
  await expect(panel.getByText("Other Work", { exact: true })).toBeVisible();
  await expect(panel.getByText("Complete Player", { exact: true })).toBeVisible();
  await expect(panel).not.toContainText(/viewed|read receipt/i);

  const followUpButtons = panel.locator("button.mcAssignmentOutcomeRow");
  await expect(followUpButtons).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const box = await followUpButtons.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }

  const openPlayerButton = panel.getByRole("button", { name: "Open Open Player player intelligence", exact: true });
  await expect(openPlayerButton).toHaveAttribute("data-player-email", "three@example.test");
  await openPlayerButton.click();

  const filterRail = page.getByTestId("coach-players-filter-rail");
  await expect(filterRail).toBeVisible({ timeout: 20_000 });
  await expect(filterRail.locator('input[type="search"]')).toHaveValue("three@example.test");
  const filteredRosterRows = page.locator("#coach-roster-operations .phase1RosterRow");
  await expect(filteredRosterRows).toHaveCount(1);
  await expect(filteredRosterRows.first()).not.toHaveAttribute("role", "button");
  await expect(filteredRosterRows.first().locator('[data-phase1-open-profile="true"]')).toBeVisible();

  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("dialog", { name: "Open Player", exact: true })).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Open Full Profile", exact: true })).toBeVisible();

  const ledger = page.getByTestId("coach-follow-up-ledger");
  await expect(ledger).toBeVisible({ timeout: 20_000 });
  await expect(ledger).toHaveAttribute("data-follow-up-state", "none");
  await expect(ledger).toContainText("The player receives only the assignment text and result context. Private coach notes remain coach-only.");
  await expect(ledger).not.toContainText(/message sent|notification delivered|player was notified/i);
  await ledger.getByLabel("Private coach note").fill("Check in after practice about the priority drill.");
  await ledger.getByRole("button", { name: "Mark for follow-up", exact: true }).click();
  await expect(ledger).toHaveAttribute("data-follow-up-state", "planned");
  await expect(ledger.getByText("Planned", { exact: true })).toBeVisible();
  expect(followUpApi.getFollowUpRecord()).toMatchObject({
    team_id: TEAM_ID,
    player_identity: "three@example.test",
    player_name: "Open Player",
    state: "planned",
    note: "Check in after practice about the priority drill.",
  });

  await ledger.getByRole("button", { name: "Mark follow-up complete", exact: true }).click();
  await expect(ledger).toHaveAttribute("data-follow-up-state", "completed");
  await expect(ledger.getByText("Completed", { exact: true })).toBeVisible();
  expect(followUpApi.getFollowUpRecord()?.state).toBe("completed");
  await expect(ledger).not.toContainText(/message sent|player notified|notification delivered/i);

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
});

test("Mission Control excludes a matching completion logged before publication", async ({ page }) => {
  const publishedAt = new Date(Date.now() - DAY_MS).toISOString();
  const seed = makeSeed(publishedAt);
  seed["sl:scores"] = [
    { id: "before-publish", email: "one@example.test", teamId: TEAM_ID, drillId: "form-shooting", drillName: "Form Shooting", date: dateOffset(-2), score: 48 },
    { id: "after-publish-other", email: "two@example.test", teamId: TEAM_ID, drillId: "corner-threes", drillName: "Corner Threes", date: today, score: 24 },
  ];
  await openCoachWithSeed(page, seed);

  const panel = page.getByTestId("coach-assignment-outcome");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute("data-measurement-mode", "published");
  await expect(panel.getByLabel("0% assignment completion")).toBeVisible();
  await expect(panel.getByText("0 of 3 completed since published", { exact: true })).toBeVisible();
  await expect(panel.getByLabel("Assignment response summary")).toContainText("0Completed");
  await expect(panel.getByLabel("Assignment response summary")).toContainText("1Other work");
  await expect(panel.getByLabel("Assignment response summary")).toContainText("2Not started");

  const priorCompletionRow = panel.getByRole("button", { name: "Open Complete Player player intelligence", exact: true });
  await expect(priorCompletionRow).toBeVisible();
  await expect(priorCompletionRow).toContainText("No matching completion since published");
});

test("Mission Control withholds stale assignment completion and opens the existing focus editor", async ({ page }) => {
  const staleUpdatedAt = new Date(Date.now() - (10 * DAY_MS)).toISOString();
  const seed = makeSeed(staleUpdatedAt);
  await openCoachWithSeed(page, seed);

  const panel = page.getByTestId("coach-assignment-outcome");
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute("data-freshness", "stale");
  await expect(panel).toHaveAttribute("data-measurement-mode", "published");
  await expect(panel.getByText("Assignment needs refresh", { exact: true })).toBeVisible();
  await expect(panel.getByText("STALE", { exact: true })).toBeVisible();
  await expect(panel.getByText(/Last published 10 days ago/i)).toBeVisible();
  await expect(panel.getByLabel(/assignment completion/i)).toHaveCount(0);
  await expect(panel.getByLabel("Assignment response summary")).toHaveCount(0);
  await expect(panel).not.toContainText(/\d+ of \d+ completed/i);

  await panel.getByRole("button", { name: "Refresh team focus", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Set team focus" })).toBeVisible();

  const widths = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
});