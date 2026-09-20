import { test, expect } from "@playwright/test";

const TEAM_ID = "phase7a-team";
const COACH_EMAIL = "phase7a.coach@example.test";
const PLAYER_EMAIL = "needs.followup@example.test";
const PLAYER_NAME = "Needs Follow-up Player";

const registeredSeed = {
  "sl:teams": [{ id: TEAM_ID, name: "Phase 7A Team", ownerCoachId: COACH_EMAIL, joinCode: "PHASE7A" }],
  "sl:players": [
    { id: "coach", email: COACH_EMAIL, name: "Phase 7A Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player", email: PLAYER_EMAIL, name: PLAYER_NAME, role: "player", teamId: TEAM_ID },
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

async function installRoutes(page, state) {
  await page.route("**/v1/legacy-auth/restore", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, profile: { email: COACH_EMAIL, name: "Phase 7A Coach", role: "coach", teamId: TEAM_ID } }) }));
  await page.route("**/v1/coach-follow-ups**", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      const next = { teamId: body.team_id, playerIdentity: body.player_identity, playerName: body.player_name, state: body.state, note: body.note, updatedAt: new Date().toISOString(), completedAt: body.state === "completed" ? new Date().toISOString() : "" };
      state.followUps = [...state.followUps.filter((record) => record.playerIdentity !== next.playerIdentity), next];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_up: next }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", follow_ups: state.followUps }) });
  });
  await page.route("**/v1/player-assignments**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", assignments: [] }) }));
  await page.route("**/v1/team-priorities", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, storage_mode: "team_remote", priorities_by_team: {} }) }));
  await page.route("**/v1/season-archives", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, archives: [] }) }));
  await page.route("**/v1/leaderboards/home-shots**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ leaderboard: [] }) }));
  await page.route("**/v1/coach/players/provision", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, invitations: [] }) }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
}

async function enterRegisteredCoach(page) {
  const state = { followUps: [] };
  await installRoutes(page, state);
  await page.addInitScript((seed) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    for (const [key, value] of Object.entries(seed)) window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem("sl:session", JSON.stringify({ email: "phase7a.coach@example.test", role: "coach", teamId: "phase7a-team" }));
  }, registeredSeed);
  await page.goto("/");
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  return state;
}

test.describe("Phase 7A coach core loop", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("registered coach can review, complete, return, and see the changed state", async ({ page }) => {
    const state = await enterRegisteredCoach(page);
    const core = page.getByTestId("coach-core-loop");
    await expect(core).toHaveAttribute("data-state", "populated");
    await expect(core).toContainText(PLAYER_NAME);
    await core.getByRole("button", { name: `Open ${PLAYER_NAME} player context`, exact: true }).click();

    const drawer = page.getByTestId("coach-player-intelligence-drawer");
    await expect(drawer).toBeVisible({ timeout: 20_000 });
    const ledger = page.getByTestId("coach-follow-up-ledger");
    await expect(ledger).toBeVisible({ timeout: 20_000 });
    await ledger.getByRole("button", { name: "Mark follow-up complete", exact: true }).click();
    await expect(ledger).toHaveAttribute("data-follow-up-state", "completed");
    await expect(ledger.getByRole("status")).toContainText(/Follow-up record synced|Follow-up record saved/i);
    expect(state.followUps.find((record) => record.playerIdentity === PLAYER_EMAIL)?.state).toBe("completed");

    await drawer.getByTestId("coach-return-to-home").click();
    await expect(page.getByTestId("coach-command-center-full")).toBeVisible();
    await expect(page.getByTestId("coach-core-loop-feedback")).toContainText(PLAYER_NAME);
    await expect(core).toHaveAttribute("data-open-count", "0");
    await expect(page.getByTestId("coach-core-loop")).toHaveAttribute("data-state", "empty");
    const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  });

  test("demo coach exposes the same decision surface and truthful empty/loading contract", async ({ page }) => {
    const state = { followUps: [{ teamId: "team-demo-titans", playerIdentity: "marcus.reed@demo.shotlab.app", playerName: "Marcus Reed", state: "planned", updatedAt: new Date().toISOString() }] };
    await installRoutes(page, state);
    await page.goto("/?demo=1");
    await page.getByRole("button", { name: "Coach demo", exact: true }).click();
    await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
    const core = page.getByTestId("coach-core-loop");
    await expect(core).toHaveAttribute("data-state", "populated");
    await expect(core).toContainText("Marcus Reed");
    await expect(core.getByRole("button", { name: "Open Marcus Reed player context", exact: true })).toBeVisible();
  });
});
