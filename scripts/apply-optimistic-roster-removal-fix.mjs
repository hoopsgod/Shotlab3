import fs from "node:fs";

const appPath = "src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

const archiveStart = app.indexOf("const archiveRosterPlayer=async");
const removeStart = app.indexOf("const removeRosterPlayer=async");
const deleteStart = app.indexOf("const deleteTeamLocalRosterPlayerData=async");
if (archiveStart < 0 || removeStart < 0 || deleteStart < 0) throw new Error("Roster lifecycle blocks missing");

let archiveBlock = app.slice(archiveStart, removeStart);
archiveBlock = archiveBlock.replace(
  `setPlayers(result.players);\nawait P("sl:players",result.players,setPlayers);`,
  `await P("sl:players",result.players,setPlayers);`
);

let removeBlock = app.slice(removeStart, deleteStart);
const profileBefore = `await P("sl:player-profiles",playerProfiles.map(pp=>pp.id===profile.id?{...pp,teamId:null,rosterStatus:"removed",rosterAction:"coach_remove_from_team",accountDeletion:false,supabaseAuthUserDeleted:false,removedFromTeamId:user.teamId,removedAt:Date.now(),removedBy:user.email,hideFromLeaderboards:true}:pp),setPlayerProfiles);`;
const profileAfter = `const nextProfiles=playerProfiles.map(pp=>pp.id===profile.id?{...pp,teamId:null,rosterStatus:"removed",rosterAction:"coach_remove_from_team",accountDeletion:false,supabaseAuthUserDeleted:false,removedFromTeamId:user.teamId,removedAt:Date.now(),removedBy:user.email,hideFromLeaderboards:true}:pp);\nsetPlayerProfiles(nextProfiles);\nawait P("sl:player-profiles",nextProfiles,setPlayerProfiles);`;
if (!removeBlock.includes("const nextProfiles=playerProfiles.map")) {
  if (!removeBlock.includes(profileBefore)) throw new Error("Profile fallback removal anchor missing");
  removeBlock = removeBlock.replace(profileBefore, profileAfter);
}

if (!removeBlock.includes(`setPlayers(result.players);\nawait P("sl:players",result.players,setPlayers);`)) {
  const persistenceAnchor = `}\nawait P("sl:players",result.players,setPlayers);\nreturn{ok:true};`;
  if (!removeBlock.includes(persistenceAnchor)) throw new Error("Player removal persistence anchor missing");
  removeBlock = removeBlock.replace(
    persistenceAnchor,
    `}\nsetPlayers(result.players);\nawait P("sl:players",result.players,setPlayers);\nreturn{ok:true};`
  );
}

app = app.slice(0, archiveStart) + archiveBlock + removeBlock + app.slice(deleteStart);
fs.writeFileSync(appPath, app);

const testPath = "tests/coach-player-data-management.test.mjs";
let testSource = fs.readFileSync(testPath, "utf8");
const oldTest = `test('coach removal updates roster state before awaiting persistence', () => {\n  assert.match(appSource, /setPlayers\\(result\\.players\\);\\s*await P\\("sl:players",result\\.players,setPlayers\\);/);\n  assert.match(appSource, /setPlayerProfiles\\(nextProfiles\\);\\s*await P\\("sl:player-profiles",nextProfiles,setPlayerProfiles\\);/);\n});`;
const newTest = `test('coach removal updates roster state before awaiting persistence', () => {\n  const removeBlock = appSource.match(/const removeRosterPlayer=async[\\s\\S]*?const deleteTeamLocalRosterPlayerData=async/)?.[0] || '';\n  const archiveBlock = appSource.match(/const archiveRosterPlayer=async[\\s\\S]*?const removeRosterPlayer=async/)?.[0] || '';\n  assert.match(removeBlock, /setPlayers\\(result\\.players\\);\\s*await P\\("sl:players",result\\.players,setPlayers\\);/);\n  assert.match(removeBlock, /setPlayerProfiles\\(nextProfiles\\);\\s*await P\\("sl:player-profiles",nextProfiles,setPlayerProfiles\\);/);\n  assert.doesNotMatch(archiveBlock, /setPlayers\\(result\\.players\\);\\s*await P\\("sl:players",result\\.players,setPlayers\\);/);\n});`;
if (testSource.includes(oldTest)) testSource = testSource.replace(oldTest, newTest);
else if (!testSource.includes("const removeBlock = appSource.match")) throw new Error("Optimistic removal test anchor missing");
fs.writeFileSync(testPath, testSource);

console.log("Applied correctly scoped optimistic roster removal patch.");
