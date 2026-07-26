import fs from "node:fs";

function replaceIfNeeded(path, before, after, appliedMarker) {
  const source = fs.readFileSync(path, "utf8");
  if (appliedMarker && source.includes(appliedMarker)) return;
  if (!source.includes(before)) throw new Error(`Expected source block not found in ${path}`);
  fs.writeFileSync(path, source.replace(before, after));
}

replaceIfNeeded(
  "src/lib/playerDataManagement.js",
  `export const isPlayerHiddenFromActiveLeaderboards = (player = {}) => isInactiveRosterRecord(player) || player?.teamId == null;`,
  `export const isPlayerHiddenFromActiveLeaderboards = (player = {}) => isInactiveRosterRecord(player) || player?.teamId == null;\n\nexport const resolveMigratedRosterTeamId = ({ row = {}, mappedTeamId = null, fallbackTeamId = null } = {}) => {\n  const hasExplicitTeamField = Object.prototype.hasOwnProperty.call(row, "teamId") || Object.prototype.hasOwnProperty.call(row, "team_id");\n  const explicitTeamId = row?.teamId ?? row?.team_id ?? null;\n  if (hasExplicitTeamField && explicitTeamId == null && isInactiveRosterRecord(row)) return null;\n  return explicitTeamId || mappedTeamId || fallbackTeamId || null;\n};`,
  "export const resolveMigratedRosterTeamId"
);

replaceIfNeeded(
  "src/App.jsx",
  `removePlayerFromTeam, resolvePlayerDisplayName`,
  `removePlayerFromTeam, resolveMigratedRosterTeamId, resolvePlayerDisplayName`,
  "removePlayerFromTeam, resolveMigratedRosterTeamId, resolvePlayerDisplayName"
);

replaceIfNeeded(
  "src/App.jsx",
  `const playersMigrated=ps.map(p=>({...p,teamId:p.teamId||map[p.email]||teamsWithBranding[0]?.id||null,hideFromLeaderboards:p.hideFromLeaderboards===true}));`,
  `const playersMigrated=ps.map(p=>({...p,teamId:resolveMigratedRosterTeamId({row:p,mappedTeamId:map[p.email],fallbackTeamId:teamsWithBranding[0]?.id}),hideFromLeaderboards:p.hideFromLeaderboards===true||p.hide_from_leaderboards===true}));`,
  "const playersMigrated=ps.map(p=>({...p,teamId:resolveMigratedRosterTeamId"
);

const lifecyclePath = "tests/player-removal-lifecycle-stabilization.test.mjs";
let lifecycle = fs.readFileSync(lifecyclePath, "utf8");
if (!lifecycle.includes("resolveMigratedRosterTeamId,")) {
  if (!lifecycle.includes("  removePlayerFromTeam,")) throw new Error("Lifecycle import anchor missing");
  lifecycle = lifecycle.replace("  removePlayerFromTeam,", "  removePlayerFromTeam,\n  resolveMigratedRosterTeamId,");
}
if (!lifecycle.includes("migration preserves removed tombstone null team ids")) {
  lifecycle += `\n\ntest("migration preserves removed tombstone null team ids instead of reassigning the first team", () => {\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "removed@team.test", teamId: null, hideFromLeaderboards: true, rosterStatus: "removed" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), null);\n\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "unassigned@team.test", role: "player" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), "team-a");\n});\n`;
}
fs.writeFileSync(lifecyclePath, lifecycle);

const e2ePath = "tests/e2e/production-acceptance.spec.mjs";
let e2e = fs.readFileSync(e2ePath, "utf8");
if (!e2e.includes("const candidateRosterRow")) {
  const oldClick = `  page.once("dialog", async (dialog) => dialog.accept());\n  await page.getByRole("button", { name: "REMOVE", exact: true }).last().click();`;
  if (!e2e.includes(oldClick)) throw new Error("Acceptance removal selector anchor missing");
  e2e = e2e.replace(oldClick, `  const candidateRosterRow = page.locator('[role="button"]').filter({ hasText: "Removal Candidate" }).filter({ has: page.getByRole("button", { name: "REMOVE", exact: true }) }).first();\n  page.once("dialog", async (dialog) => dialog.accept());\n  await candidateRosterRow.getByRole("button", { name: "REMOVE", exact: true }).click();`);
}
fs.writeFileSync(e2ePath, e2e);

console.log("Applied minimal roster migration tombstone fix.");
