import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

const TEAM_ID = "team-priority-delivery";
const COACH_EMAIL = "coach.demo@shotlab.app";
const INITIAL_PRIORITIES = {
  todayFocusText: "Attack closeouts with balance",
  focusEmphasis: "Technique",
  priorityDrillText: "Two-foot finishing",
  challengeText: "Complete one finishing block today.",
  weeklyMakesTarget: 500,
  weeklyCheckinsTarget: 2,
};

const seedData = {
  "sl:teams": [{
    id: TEAM_ID,
    name: "Priority Delivery Team",
    ownerCoachId: COACH_EMAIL,
    joinCode: "DELIVER",
    createdAt: Date.now() - 86_400_000,
    branding: {
      name: "Priority Delivery Team",
      shortName: "PDT",
      wordmark: "PRIORITY DELIVERY TEAM",
      primaryColor: "#C8FF1A",
      secondaryColor: "#77D7FF",
      accentColor: "#C8FF1A",
      textOnPrimary: "#071007",
      logoUrl: "/branding/titans-exact-logo.png.PNG",
      logoMarkUrl: "/branding/titans-default-mark.svg",
      textScale: "standard",
      version: 1,
    },
  }],
  "sl:players": [
    { id: "priority-coach", email: COACH_EMAIL, name: "Demo Coach", role: "coach", isCoach: true, teamId: TEAM_ID },
    { id: "player-demo-primary", email: "demo@shotlab.app", name: "Demo Player", role: "player", teamId: TEAM_ID },
    { id: "priority-player-two", email: "second@demo.shotlab.app", name: "Second Player", role: "player", teamId: TEAM_ID },
  ],
  "sl:player-profiles": [
    { id: "profile-demo-primary", userId: "demo@shotlab.app", email: "demo@shotlab.app", teamId: TEAM_ID, firstName: "Demo", lastName: "Player" },
    { id: "profile-priority-two", userId: "second@demo.shotlab.app", email: "second@demo.shotlab.app", teamId: TEAM_ID, firstName: "Second", lastName: "Player" },
  ],
  "sl:coach-priorities": { [TEAM_ID]: INITIAL_PRIORITIES },
  "sl:events": [],
  "sl:rsvps": [],
  "sl:scores": [],
  "sl:program-scores": [],
  "sl:shotlogs": [],
  "sl:sc-sessions": [],
  "sl:sc-rsvps": [],
  "sl:sc-logs": [],
  "sl:season-archives": [],
};

async function installRoutes(page, published) {
  await page.route("**/v1/team-priorities", async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          storage_mode: "team_remote",
          priorities_by_team: { [TEAM_ID]: INITIAL_PRIORITIES },
        }),
      });
      return;
    }
    published.push(JSON.parse(request.postData() || "{}"));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, storage_mode: "team_remote" }),
    });
  });
  await page.route("**/v1/season-archives", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, archives: [] }),
  }));
  await page.route(/https:\/\/[^/]+\.supabase\.co\/.*/, (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "[]",
  }));
}

async function enterSeededCoach(page) {
  await page.addInitScript((payload) => {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(payload)) window.localStorage.setItem(key, JSON.stringify(value));
  }, seedData);
  await page.goto("/");
  await page.getByRole("button", { name: "Coach demo", exact: true }).click();
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
}

async function openTeamFocusEditor(page) {
  const invoked = await page.evaluate(() => {
    const action = [...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Set Team Focus');
    if (!action) return false;
    action.click();
    return true;
  });
  expect(invoked).toBe(true);
}

test("demo coach can save player-facing priorities locally without a production publish", async ({ page }) => {
  const published = [];
  await installRoutes(page, published);
  await enterSeededCoach(page);

  // The global mobile dock superseded the old Mission Control drawer. Keep this
  // persistence contract focused on the real Set Team Focus action and editor.
  await openTeamFocusEditor(page);

  const editor = page.getByTestId("coach-priority-editor");
  await expect(editor).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("coach-priority-overlay")).toBeVisible();

  const focusInput = editor.locator('input[type="text"]').first();
  await expect(focusInput).toBeVisible();
  await focusInput.fill("Win the first three steps on every closeout");
  await editor.getByRole("button", { name: "SAVE PRIORITIES", exact: true }).click();

  await expect(editor.getByText("Priorities saved", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((teamId) => {
    const saved = JSON.parse(window.localStorage.getItem("sl:coach-priorities") || "{}");
    return saved?.[teamId]?.todayFocusText || "";
  }, TEAM_ID)).toBe("Win the first three steps on every closeout");
  await page.waitForTimeout(200);
  expect(published, "demo saves must never POST team priorities to production persistence").toEqual([]);

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);

  await page.getByRole("button", { name: "Close team focus editor", exact: true }).last().click();
  await expect(editor).toBeHidden();
  await expect(page.getByTestId("coach-priority-overlay")).toHaveCount(0);
});
