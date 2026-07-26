import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const write = (path, source) => fs.writeFileSync(path, source);

const playerDataPath = "src/lib/playerDataManagement.js";
let playerData = read(playerDataPath);
if (!playerData.includes("export const resolveMigratedRosterTeamId")) {
  const anchor = playerData.split("\n").find((line) => line.startsWith("export const isPlayerHiddenFromActiveLeaderboards ="));
  if (!anchor) throw new Error("Player lifecycle anchor missing");
  const helper = `${anchor}\n\nexport const resolveMigratedRosterTeamId = ({ row = {}, mappedTeamId = null, fallbackTeamId = null } = {}) => {\n  const hasExplicitTeamField = Object.prototype.hasOwnProperty.call(row, "teamId") || Object.prototype.hasOwnProperty.call(row, "team_id");\n  const explicitTeamId = row?.teamId ?? row?.team_id ?? null;\n  if (hasExplicitTeamField && explicitTeamId == null && isInactiveRosterRecord(row)) return null;\n  return explicitTeamId || mappedTeamId || fallbackTeamId || null;\n};`;
  playerData = playerData.replace(anchor, helper);
  write(playerDataPath, playerData);
}

const appPath = "src/App.jsx";
let app = read(appPath);
if (!app.includes("removePlayerFromTeam, resolveMigratedRosterTeamId, resolvePlayerDisplayName")) {
  app = app.replace("removePlayerFromTeam, resolvePlayerDisplayName", "removePlayerFromTeam, resolveMigratedRosterTeamId, resolvePlayerDisplayName");
}
const appLines = app.split("\n");
const playersMigrationIndex = appLines.findIndex((line) => line.startsWith("const playersMigrated=ps.map"));
if (playersMigrationIndex < 0) throw new Error("playersMigrated line missing");
if (!appLines[playersMigrationIndex].includes("resolveMigratedRosterTeamId")) {
  appLines[playersMigrationIndex] = `const playersMigrated=ps.map(p=>({...p,teamId:resolveMigratedRosterTeamId({row:p,mappedTeamId:map[p.email],fallbackTeamId:teamsWithBranding[0]?.id}),hideFromLeaderboards:p.hideFromLeaderboards===true||p.hide_from_leaderboards===true}));`;
}
app = appLines.join("\n");
if (!app.includes("resolveMigratedRosterTeamId")) throw new Error("App migration helper was not wired");
write(appPath, app);

const lifecyclePath = "tests/player-removal-lifecycle-stabilization.test.mjs";
let lifecycle = read(lifecyclePath);
if (!lifecycle.includes("resolveMigratedRosterTeamId,")) {
  const importAnchor = "  getCoachRosterPlayers,";
  if (!lifecycle.includes(importAnchor)) throw new Error("Lifecycle import anchor missing");
  lifecycle = lifecycle.replace(importAnchor, `${importAnchor}\n  resolveMigratedRosterTeamId,`);
}
if (!lifecycle.includes("migration preserves removed tombstone null team ids")) {
  lifecycle += `\n\ntest("migration preserves removed tombstone null team ids instead of reassigning the first team", () => {\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "removed@team.test", teamId: null, hideFromLeaderboards: true, rosterStatus: "removed" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), null);\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "unassigned@team.test", role: "player" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), "team-a");\n});\n`;
}
write(lifecyclePath, lifecycle);

const e2ePath = "tests/e2e/production-acceptance.spec.mjs";
let e2e = read(e2ePath);
if (!e2e.includes("const candidateRosterRow")) {
  e2e = e2e.replace(
    `  page.once("dialog", async (dialog) => dialog.accept());\n  await page.getByRole("button", { name: "REMOVE", exact: true }).last().click();`,
    `  const candidateRosterRow = page.locator('[role="button"]').filter({ hasText: "Removal Candidate" }).filter({ has: page.getByRole("button", { name: "REMOVE", exact: true }) }).first();\n  page.once("dialog", async (dialog) => dialog.accept());\n  await candidateRosterRow.getByRole("button", { name: "REMOVE", exact: true }).click();`
  );
}
if (!e2e.includes("const candidateRosterRow")) throw new Error("Acceptance selector was not updated");
write(e2ePath, e2e);

console.log("Applied line-based roster migration tombstone fix.");
