import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, source) {
  fs.writeFileSync(path, source);
}

function replacePattern(path, pattern, replacement, alreadyApplied) {
  const source = read(path);
  if (alreadyApplied && source.includes(alreadyApplied)) return false;
  if (!pattern.test(source)) throw new Error(`Expected source pattern not found in ${path}: ${pattern}`);
  write(path, source.replace(pattern, replacement));
  return true;
}

const playerDataPath = "src/lib/playerDataManagement.js";
replacePattern(
  playerDataPath,
  /export const isPlayerHiddenFromActiveLeaderboards = \(player = \{\}\) => isInactiveRosterRecord\(player\) \|\| player\?\.teamId == null;/,
  `export const isPlayerHiddenFromActiveLeaderboards = (player = {}) => isInactiveRosterRecord(player) || player?.teamId == null;\n\nexport const resolveMigratedRosterTeamId = ({ row = {}, mappedTeamId = null, fallbackTeamId = null } = {}) => {\n  const hasExplicitTeamField = Object.prototype.hasOwnProperty.call(row, "teamId") || Object.prototype.hasOwnProperty.call(row, "team_id");\n  const explicitTeamId = row?.teamId ?? row?.team_id ?? null;\n  if (hasExplicitTeamField && explicitTeamId == null && isInactiveRosterRecord(row)) return null;\n  return explicitTeamId || mappedTeamId || fallbackTeamId || null;\n};`,
  "export const resolveMigratedRosterTeamId"
);

const appPath = "src/App.jsx";
replacePattern(
  appPath,
  /removePlayerFromTeam, resolvePlayerDisplayName/,
  `removePlayerFromTeam, resolveMigratedRosterTeamId, resolvePlayerDisplayName`,
  "removePlayerFromTeam, resolveMigratedRosterTeamId, resolvePlayerDisplayName"
);
replacePattern(
  appPath,
  /const playersMigrated=ps\.map\(p=>\(\{\.\.\.p,teamId:p\.teamId\|\|map\[p\.email\]\|\|teamsWithBranding\[0\]\?\.id\|\|null,hideFromLeaderboards:p\.hideFromLeaderboards===true\}\)\);/,
  `const playersMigrated=ps.map(p=>({...p,teamId:resolveMigratedRosterTeamId({row:p,mappedTeamId:map[p.email],fallbackTeamId:teamsWithBranding[0]?.id}),hideFromLeaderboards:p.hideFromLeaderboards===true||p.hide_from_leaderboards===true}));`,
  "const playersMigrated=ps.map(p=>({...p,teamId:resolveMigratedRosterTeamId"
);
replacePattern(
  appPath,
  /const profilesMigrated=\(profilesExisting\.length\?profilesExisting:playersMigrated\.filter\(p=>p\.role!=="coach"\)\.map\(p=>\(\{id:genId\("pp"\),userId:p\.email,teamId:p\.teamId,firstName:\(p\.name\|\|""\)\.split\(" "\)\[0\]\|\|"Player",lastName:\(p\.name\|\|""\)\.split\(" "\)\.slice\(1\)\.join\(" "\),createdAt:Date\.now\(\)\}\)\)\)\.map\(pp=>\(\{\.\.\.pp,teamId:pp\.teamId\|\|playersMigrated\.find\(p=>p\.email===pp\.userId\)\?\.teamId\|\|ts\[0\]\?\.id\|\|null\}\)\);/,
  `const profilesMigrated=(profilesExisting.length?profilesExisting:playersMigrated.filter(p=>p.role!=="coach").map(p=>({id:genId("pp"),userId:p.email,teamId:p.teamId,firstName:(p.name||"").split(" ")[0]||"Player",lastName:(p.name||"").split(" ").slice(1).join(" "),createdAt:Date.now()}))).map(pp=>({...pp,teamId:resolveMigratedRosterTeamId({row:pp,mappedTeamId:playersMigrated.find(p=>p.email===pp.userId)?.teamId,fallbackTeamId:ts[0]?.id})}));`,
  "const profilesMigrated=(profilesExisting.length?profilesExisting:playersMigrated.filter(p=>p.role!==\"coach\").map"
);

const lifecycleTestPath = "tests/player-removal-lifecycle-stabilization.test.mjs";
let lifecycleSource = read(lifecycleTestPath);
if (!lifecycleSource.includes("resolveMigratedRosterTeamId,")) {
  if (!lifecycleSource.includes("  removePlayerFromTeam,")) throw new Error("Lifecycle test import anchor missing");
  lifecycleSource = lifecycleSource.replace("  removePlayerFromTeam,", "  removePlayerFromTeam,\n  resolveMigratedRosterTeamId,");
}
if (!lifecycleSource.includes("migration preserves removed tombstone null team ids")) {
  lifecycleSource += `\n\ntest("migration preserves removed tombstone null team ids instead of reassigning the first team", () => {\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "removed@team.test", teamId: null, hideFromLeaderboards: true, rosterStatus: "removed" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), null);\n\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "unassigned@team.test", role: "player" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), "team-a");\n\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "archived@team.test", teamId: "team-a", hideFromLeaderboards: true, rosterStatus: "archived" },\n    mappedTeamId: "team-b",\n    fallbackTeamId: "team-fallback",\n  }), "team-a");\n});\n`;
}
write(lifecycleTestPath, lifecycleSource);

const e2ePath = "tests/e2e/production-acceptance.spec.mjs";
let e2eSource = read(e2ePath);
if (!e2eSource.includes("const candidateRosterRow")) {
  const oldClick = `  page.once("dialog", async (dialog) => dialog.accept());\n  await page.getByRole("button", { name: "REMOVE", exact: true }).last().click();`;
  if (!e2eSource.includes(oldClick)) throw new Error("Acceptance removal selector anchor missing");
  e2eSource = e2eSource.replace(oldClick, `  const candidateRosterRow = page.locator('[role="button"]').filter({ hasText: "Removal Candidate" }).filter({ has: page.getByRole("button", { name: "REMOVE", exact: true }) }).first();\n  page.once("dialog", async (dialog) => dialog.accept());\n  await candidateRosterRow.getByRole("button", { name: "REMOVE", exact: true }).click();`);
}
write(e2ePath, e2eSource);

console.log("Applied roster migration tombstone fix.");
