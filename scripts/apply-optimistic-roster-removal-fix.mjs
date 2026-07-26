import fs from "node:fs";

const appPath = "src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

const profileBefore = `await P("sl:player-profiles",playerProfiles.map(pp=>pp.id===profile.id?{...pp,teamId:null,rosterStatus:"removed",rosterAction:"coach_remove_from_team",accountDeletion:false,supabaseAuthUserDeleted:false,removedFromTeamId:user.teamId,removedAt:Date.now(),removedBy:user.email,hideFromLeaderboards:true}:pp),setPlayerProfiles);`;
const profileAfter = `const nextProfiles=playerProfiles.map(pp=>pp.id===profile.id?{...pp,teamId:null,rosterStatus:"removed",rosterAction:"coach_remove_from_team",accountDeletion:false,supabaseAuthUserDeleted:false,removedFromTeamId:user.teamId,removedAt:Date.now(),removedBy:user.email,hideFromLeaderboards:true}:pp);\nsetPlayerProfiles(nextProfiles);\nawait P("sl:player-profiles",nextProfiles,setPlayerProfiles);`;
if (!app.includes("const nextProfiles=playerProfiles.map(pp=>pp.id===profile.id")) {
  if (!app.includes(profileBefore)) throw new Error("Profile fallback removal anchor missing");
  app = app.replace(profileBefore, profileAfter);
}

const playerBefore = `await P("sl:players",result.players,setPlayers);\nreturn{ok:true};`;
const playerAfter = `setPlayers(result.players);\nawait P("sl:players",result.players,setPlayers);\nreturn{ok:true};`;
if (!app.includes("setPlayers(result.players);\nawait P(\"sl:players\",result.players,setPlayers);")) {
  if (!app.includes(playerBefore)) throw new Error("Player removal persistence anchor missing");
  app = app.replace(playerBefore, playerAfter);
}

fs.writeFileSync(appPath, app);

const testPath = "tests/coach-player-data-management.test.mjs";
let testSource = fs.readFileSync(testPath, "utf8");
if (!testSource.includes("coach removal updates roster state before awaiting persistence")) {
  testSource += `\n\ntest('coach removal updates roster state before awaiting persistence', () => {\n  assert.match(appSource, /setPlayers\\(result\\.players\\);\\s*await P\\("sl:players",result\\.players,setPlayers\\);/);\n  assert.match(appSource, /setPlayerProfiles\\(nextProfiles\\);\\s*await P\\("sl:player-profiles",nextProfiles,setPlayerProfiles\\);/);\n});\n`;
}
fs.writeFileSync(testPath, testSource);

console.log("Applied optimistic roster removal patch.");
