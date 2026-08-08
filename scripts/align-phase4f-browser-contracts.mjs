import { readFileSync, writeFileSync } from "node:fs";

const update = (path, transform) => {
  const source = readFileSync(path, "utf8");
  const next = transform(source);
  if (next !== source) writeFileSync(path, next);
};

update("tests/e2e/coach-player-invitation.spec.mjs", (source) => {
  const helper = `async function enterCoachPlayers(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/v1/legacy-auth/restore", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, profile: { email: COACH_EMAIL, name: "Demo Coach", role: "coach", team_id: TEAM_ID } }),
  }));
  await page.goto("/");
  await expect(page.getByTestId("coach-command-center-full")).toBeVisible({ timeout: 20_000 });
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 15_000 });
  const players = dock.getByRole("button", { name: "Players", exact: true });
  await expect(players).toBeVisible();
  await players.click();
  const activation = page.getByTestId("coach-player-account-activation");
  await expect(activation).toBeVisible({ timeout: 15_000 });
  if (!(await activation.evaluate((node) => node.open))) await activation.locator("summary").click();
}`;
  if (source.includes(helper)) return source;
  const pattern = /async function enterCoachPlayers\(page\) \{[\s\S]*?\n\}\n\ntest\(/;
  if (!pattern.test(source)) throw new Error("Phase 4F invitation helper was not found.");
  return source.replace(pattern, `${helper}\n\ntest(`);
});

update("tests/e2e/coach-player-assignment-delivery.spec.mjs", (source) => {
  const before = `  await coachDock.getByRole("button", { name: "Players", exact: true }).click();
  const roster = coachPage.locator("#coach-roster-operations");`;
  const after = `  await coachDock.getByRole("button", { name: "Players", exact: true }).click();
  const rosterDisclosure = coachPage.getByTestId("coach-player-roster-management");
  await expect(rosterDisclosure).toBeVisible({ timeout: 20_000 });
  if (!(await rosterDisclosure.evaluate((node) => node.open))) await rosterDisclosure.locator("summary").click();
  const roster = coachPage.locator("#coach-roster-operations");`;
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error("Phase 4F assignment roster transition was not found.");
  return source.replace(before, after);
});

update("tests/e2e/coach-player-cross-device-first-result.spec.mjs", (source) => {
  const before = `  await context.route(/https:\\/\\/[^/]+\\.supabase\\.co\\/.*/, (route) => fulfillJson(route, []));`;
  const after = `  await context.route(/https:\\/\\/[^/]+\\.supabase\\.co\\/.*/, (route) => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("/rest/v1/events")) return fulfillJson(route, commonSeed["sl:events"]);
    return fulfillJson(route, []);
  });`;
  let next = source;
  if (!next.includes(after)) {
    if (!next.includes(before)) throw new Error("Phase 4F cross-device Supabase route was not found.");
    next = next.replace(before, after);
  }
  const premiumResponse = `  const responseButton = playerPage.getByRole("button", { name: "Respond now", exact: true });
  await expect(responseButton).toBeVisible({ timeout: 20_000 });
  await responseButton.click();
  const rsvpButton = playerPage.getByRole("button", { name: /RSVP NOW/ }).first();
  await expect(rsvpButton).toBeVisible({ timeout: 20_000 });
  await rsvpButton.click();`;
  const legacyPatterns = [
    `  await expect(playerPage.getByText("UPCOMING EVENTS", { exact: true })).toBeVisible({ timeout: 20_000 });
  await playerPage.getByRole("button", { name: /RSVP NOW/ }).first().click();`,
    `  const rsvpButton = playerPage.getByRole("button", { name: /RSVP NOW/ }).first();
  await expect(rsvpButton).toBeVisible({ timeout: 20_000 });
  await rsvpButton.click();`,
    `  const responseButton = playerPage.getByRole("button", { name: "Respond now", exact: true });
  await expect(responseButton).toBeVisible({ timeout: 20_000 });
  await responseButton.click();`,
  ];
  for (const legacy of legacyPatterns) {
    if (next.includes(legacy)) next = next.replace(legacy, premiumResponse);
  }
  if (!next.includes(premiumResponse)) throw new Error("Phase 4F premium attendance response transition was not found.");
  return next;
});

console.log("Aligned Phase 4F browser contracts with current premium navigation and attendance actions.");
