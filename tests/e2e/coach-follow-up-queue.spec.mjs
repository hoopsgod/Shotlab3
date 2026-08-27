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
  await page.route("**/v1/player-assignments**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", assignments: [] }) }));
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "demo_local", priorities_by_team: {} }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

test("Player Intelligence closes the exact player follow-up loop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installRoutes(page);
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seed);

  await page.goto("/");
  await page.getByRole("button", { name: "Coach demo", exact: true }).click();

  const dock = page.getByTestId("mobile-navigation-dock");
  await dock.getByRole("button", { name: "Players", exact: true }).click();
  const roster = page.locator("#coach-roster-operations");
  await expect(roster).toBeVisible({ timeout: 20_000 });
  await expect(roster).not.toContainText("Removed Player");

  const openProfile = roster.getByRole("button", { name: "Open Open Player profile", exact: true });
  await expect(openProfile).toBeVisible();
  await openProfile.click();

  const drawer = page.getByTestId("coach-player-intelligence-drawer");
  await expect(drawer).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("dialog", { name: "Open Player", exact: true })).toBeVisible();
  const ledger = page.getByTestId("coach-follow-up-ledger");
  await expect(ledger).toBeVisible();
  await expect(ledger).toHaveAttribute("data-follow-up-state", "planned");
  await expect(ledger.getByRole("textbox", { name: "Private coach note" })).toHaveValue("Check in after practice.");
  await expect(ledger).toContainText("The player receives only the assignment text and result context. Private coach notes remain coach-only.");
  await expect(ledger).not.toContainText(/message sent|notification delivered|player was notified/i);

  await ledger.getByRole("button", { name: "Mark follow-up complete", exact: true }).click();
  await expect(ledger).toHaveAttribute("data-follow-up-state", "completed");
  await expect(ledger.getByRole("status")).toContainText("Follow-up record synced");

  expect(followUps.find((row) => row.playerIdentity === "open@example.test")?.state).toBe("completed");
  expect(followUps.find((row) => row.playerIdentity === "complete@example.test")?.state).toBe("completed");
  expect(followUps.find((row) => row.playerIdentity === "removed@example.test")?.state).toBe("planned");

  await drawer.getByRole("button", { name: "Close details", exact: true }).last().click();
  await expect(drawer).toHaveCount(0);
  await openProfile.click();
  const reopenedLedger = page.getByTestId("coach-follow-up-ledger");
  await expect(reopenedLedger).toBeVisible({ timeout: 20_000 });
  await expect(reopenedLedger).toHaveAttribute("data-follow-up-state", "completed");
  await expect(reopenedLedger.getByRole("textbox", { name: "Private coach note" })).toHaveValue("Check in after practice.");

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  expect(widths.body).toBeLessThanOrEqual(widths.viewport + 2);
});