import { test, expect } from "@playwright/test";

const TEAM_ID = "team-follow-up-queue";
const now = new Date().toISOString();
let followUps = [];

const seed = {
  "sl:teams": [{ id: TEAM_ID, name: "Follow-Up Team", ownerCoachId: "coach.demo@shotlab.app", joinCode: "FOLLOW" }],
  "sl:players": [
    { id: "coach", email: "coach.demo@shotlab.app", name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "open", email: "open@example.test", name: "Open Player", role: "player", teamId: TEAM_ID },
    { id: "complete", email: "complete@example.test", name: "Complete Player", role: "player", teamId: TEAM_ID },
    { id: "removed", email: "removed@example.test", name: "Removed Player", role: "player", teamId: null, removedFromTeamId: TEAM_ID, rosterStatus: "removed", rosterAction: "coach_remove_from_team", hideFromLeaderboards: true },
  ],
  "sl:player-profiles": [],
  "sl:drills": [{ id: "form", name: "Form Shooting" }],
  "sl:program-drills": [],
  "sl:coach-priorities": {},
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:sc-logs": [],
  "sl:events": [],
  "sl:rsvps": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:season-archives": [],
};

async function installRoutes(page) {
  followUps = [
    {
      teamId: TEAM_ID,
      playerIdentity: "open@example.test",
      playerName: "Open Player",
      state: "planned",
      note: "Check in after practice.",
      createdAt: now,
      updatedAt: now,
      completedAt: "",
      updatedBy: "coach.demo@shotlab.app",
    },
    {
      teamId: TEAM_ID,
      playerIdentity: "complete@example.test",
      playerName: "Complete Player",
      state: "completed",
      note: "Reviewed shooting plan.",
      createdAt: now,
      updatedAt: now,
      completedAt: now,
      updatedBy: "coach.demo@shotlab.app",
    },
    {
      teamId: TEAM_ID,
      playerIdentity: "removed@example.test",
      playerName: "Removed Player",
      state: "planned",
      note: "Must not surface.",
      createdAt: now,
      updatedAt: now,
      completedAt: "",
      updatedBy: "coach.demo@shotlab.app",
    },
  ];

  await page.route("**/v1/coach-follow-ups**", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      const updatedAt = new Date().toISOString();
      const next = {
        teamId: body.team_id,
        playerIdentity: body.player_identity,
        playerName: body.player_name,
        state: body.state,
        note: body.note,
        createdAt: body.created_at || updatedAt,
        updatedAt,
        completedAt: body.state === "completed" ? updatedAt : "",
        updatedBy: "coach.demo@shotlab.app",
      };
      followUps = [...followUps.filter((row) => !(row.teamId === next.teamId && row.playerIdentity === next.playerIdentity)), next];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_up: next }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_ups: followUps }),
    });
  });
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "demo_local", priorities_by_team: {} }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

test("Mission Control closes the exact player follow-up loop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);

  await page.goto("/");
  await page.getByRole("button", { name: "Demo Coach", exact: true }).click();

  const queue = page.getByTestId("coach-follow-up-queue");
  await expect(queue).toBeVisible({ timeout: 20_000 });
  await expect(queue).toHaveAttribute("data-open-count", "1");
  await expect(queue).toHaveAttribute("data-storage-mode", "team_remote");
  await expect(queue.getByText("1 OPEN", { exact: true })).toBeVisible();
  await expect(queue.getByText("Open Player", { exact: true })).toBeVisible();
  await expect(queue).not.toContainText("Removed Player");
  await expect(queue).not.toContainText(/message sent|player notified/i);

  await queue.getByRole("button", { name: "Open Open Player follow-up", exact: true }).click();

  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("dialog", { name: "Open Player", exact: true })).toBeVisible();
  const ledger = page.getByTestId("coach-follow-up-ledger");
  await expect(ledger).toBeVisible();
  await expect(ledger).toHaveAttribute("data-follow-up-state", "planned");
  await expect(ledger.getByRole("textbox", { name: "Private coach note" })).toHaveValue("Check in after practice.");
  await expect(ledger).toContainText("does not send a message or notify the player");

  await ledger.getByRole("button", { name: "Mark follow-up complete", exact: true }).click();
  await expect(ledger).toHaveAttribute("data-follow-up-state", "completed");
  await expect(ledger.getByRole("status")).toContainText("Follow-up record synced");

  // The player drawer is modal and correctly blocks the mobile dock. Close it
  // through the existing drawer control before returning to Mission Control.
  await drawer.getByRole("button", { name: "Close details", exact: true }).last().click();
  await expect(drawer).toHaveCount(0);

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Home", exact: true }).click();

  await expect(queue).toBeVisible({ timeout: 20_000 });
  await expect(queue).toHaveAttribute("data-open-count", "0");
  await expect(queue.getByText("CLEAR", { exact: true })).toBeVisible();
  await expect(queue.getByText("0 planned · 2 completed records", { exact: true })).toBeVisible();

  const history = queue.locator("details.mcFollowUpQueueHistory");
  await history.locator("summary").click();
  await expect(history.getByText("Open Player", { exact: true })).toBeVisible();
  await expect(history.getByText("Complete Player", { exact: true })).toBeVisible();

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});