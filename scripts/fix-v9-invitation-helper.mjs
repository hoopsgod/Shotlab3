import { readFileSync, writeFileSync } from "node:fs";

const path = "tests/e2e/coach-player-invitation.spec.mjs";
const source = readFileSync(path, "utf8");

const before = `async function enterCoachPlayers(page) {
  await page.goto("/");
  const dock = page.getByTestId("mobile-navigation-dock");
  await expect(dock).toBeVisible({ timeout: 15_000 });
  const players = dock.getByRole("button", { name: "Players", exact: true });
  await expect(players).toBeVisible();
  await players.click();
}`;

const after = `async function enterCoachPlayers(page) {
  await page.goto("/");
  const dock = page.getByTestId("mobile-navigation-dock");
  const demoCoach = page.getByRole("button", { name: "Demo Coach", exact: true });
  await expect(dock.or(demoCoach).first()).toBeVisible({ timeout: 15_000 });
  if (await demoCoach.isVisible()) await demoCoach.click();
  await expect(dock).toBeVisible({ timeout: 15_000 });
  const players = dock.getByRole("button", { name: "Players", exact: true });
  await expect(players).toBeVisible();
  await players.click();
}`;

if (!source.includes(before)) {
  throw new Error("Expected invitation navigation helper was not found.");
}

writeFileSync(path, source.replace(before, after));
