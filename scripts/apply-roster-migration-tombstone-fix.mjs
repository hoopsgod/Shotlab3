import fs from "node:fs";

function replaceExact(path, before, after) {
  const source = fs.readFileSync(path, "utf8");
  if (!source.includes(before)) throw new Error(`Expected source block not found in ${path}`);
  fs.writeFileSync(path, source.replace(before, after));
}

replaceExact(
  "src/lib/playerDataManagement.js",
  `export const isPlayerHiddenFromActiveLeaderboards = (player) => isHiddenRosterRecord(player);`,
  `export const isPlayerHiddenFromActiveLeaderboards = (player) => isHiddenRosterRecord(player);\n\nexport const resolveMigratedRosterTeamId = ({ row = {}, mappedTeamId = null, fallbackTeamId = null } = {}) => {\n  const explicitTeamId = row?.teamId ?? row?.team_id ?? null;\n  if (isPlayerHiddenFromActiveLeaderboards(row)) return explicitTeamId;\n  return explicitTeamId || mappedTeamId || fallbackTeamId || null;\n};`
);

replaceExact(
  "src/App.jsx",
  `import { archivePlayerForTeam, deleteTeamLocalPlayerData, filterActiveTeamChallengeRows, filterActiveTeamLeaderboardRows, filterActiveTeamPlayerRows, getActiveTeamPlayerIdentity, getCoachRosterPlayers, isPlayerHiddenFromActiveLeaderboards, removePlayerFromTeam, resolvePlayerDisplayName, buildCoachPlayerDevelopmentProfile } from "./lib/playerDataManagement.js";`,
  `import { archivePlayerForTeam, deleteTeamLocalPlayerData, filterActiveTeamChallengeRows, filterActiveTeamLeaderboardRows, filterActiveTeamPlayerRows, getActiveTeamPlayerIdentity, getCoachRosterPlayers, isPlayerHiddenFromActiveLeaderboards, removePlayerFromTeam, resolveMigratedRosterTeamId, resolvePlayerDisplayName, buildCoachPlayerDevelopmentProfile } from "./lib/playerDataManagement.js";`
);

replaceExact(
  "src/App.jsx",
  `const playersMigrated=ps.map(p=>({...p,teamId:p.teamId||map[p.email]||teamsWithBranding[0]?.id||null,hideFromLeaderboards:p.hideFromLeaderboards===true}));`,
  `const playersMigrated=ps.map(p=>({...p,teamId:resolveMigratedRosterTeamId({row:p,mappedTeamId:map[p.email],fallbackTeamId:teamsWithBranding[0]?.id}),hideFromLeaderboards:p.hideFromLeaderboards===true}));`
);

replaceExact(
  "src/App.jsx",
  `const profilesMigrated=(profilesExisting.length?profilesExisting:playersMigrated.filter(p=>p.role!=="coach").map(p=>({id:genId("pp"),userId:p.email,teamId:p.teamId,firstName:(p.name||"").split(" ")[0]||"Player",lastName:(p.name||"").split(" ").slice(1).join(" "),createdAt:Date.now()}))).map(pp=>({...pp,teamId:pp.teamId||playersMigrated.find(p=>p.email===pp.userId)?.teamId||ts[0]?.id||null}));`,
  `const profilesMigrated=(profilesExisting.length?profilesExisting:playersMigrated.filter(p=>p.role!=="coach").map(p=>({id:genId("pp"),userId:p.email,teamId:p.teamId,firstName:(p.name||"").split(" ")[0]||"Player",lastName:(p.name||"").split(" ").slice(1).join(" "),createdAt:Date.now()}))).map(pp=>({...pp,teamId:resolveMigratedRosterTeamId({row:pp,mappedTeamId:playersMigrated.find(p=>p.email===pp.userId)?.teamId,fallbackTeamId:ts[0]?.id})}));`
);

replaceExact(
  "tests/player-removal-lifecycle-stabilization.test.mjs",
  `  removePlayerFromTeam,`,
  `  removePlayerFromTeam,\n  resolveMigratedRosterTeamId,`
);

fs.appendFileSync("tests/player-removal-lifecycle-stabilization.test.mjs", `\n\ntest("migration preserves removed tombstone null team ids instead of reassigning the first team", () => {\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "removed@team.test", teamId: null, hideFromLeaderboards: true, rosterStatus: "removed" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), null);\n\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "active@team.test", role: "player" },\n    mappedTeamId: "team-a",\n    fallbackTeamId: "team-fallback",\n  }), "team-a");\n\n  assert.equal(resolveMigratedRosterTeamId({\n    row: { email: "archived@team.test", teamId: "team-a", hideFromLeaderboards: true, rosterStatus: "archived" },\n    mappedTeamId: "team-b",\n    fallbackTeamId: "team-fallback",\n  }), "team-a");\n});\n`);

console.log("Applied roster migration tombstone fix.");
// Workflow trigger: the workflow now exists on the branch and can apply this patch safely.
