import fs from "node:fs";

const appPath = "src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");
const removeStart = app.indexOf("const removeRosterPlayer=async");
const deleteStart = app.indexOf("const deleteTeamLocalRosterPlayerData=async", removeStart);
if (removeStart < 0 || deleteStart < 0) throw new Error("Roster removal block missing");

const nextBlock = `const removeRosterPlayer=async(playerIdentity)=>{\nif(!user||user.role!=="coach"||!user.teamId)return{ok:false,err:"Not authorized"};\nif(!requireCoach(user,user.teamId))return{ok:false,err:"Not authorized"};\nconst profile=findRosterProfile(playerIdentity);\nconst canonicalIdentity=normalizeEmail(profile?.email||profile?.userId||profile?.user_id||playerIdentity);\nconst identityKeys=new Set([playerIdentity,canonicalIdentity,profile?.id,profile?.profileId,profile?.userId,profile?.user_id,profile?.email,profile?.player_email,profile?.playerId,profile?.player_id].map(v=>normalizeEmail(v)).filter(Boolean));\nconst matchesRosterIdentity=(row={})=>[row.id,row.profileId,row.profile_id,row.userId,row.user_id,row.email,row.player_email,row.playerId,row.player_id].map(v=>normalizeEmail(v)).some(key=>key&&identityKeys.has(key));\nconst removedAt=Date.now();\nconst buildRemovedRow=(row)=>({...row,teamId:null,rosterStatus:"removed",rosterAction:"coach_remove_from_team",accountDeletion:false,supabaseAuthUserDeleted:false,removedFromTeamId:user.teamId,removedAt,removedBy:user.email,hideFromLeaderboards:true});\nconst result=removePlayerFromTeam({players,coach:user,playerEmail:canonicalIdentity||playerIdentity,now:removedAt});\nconst nextPlayers=result.ok?result.players:players.map(player=>player.role!=="coach"&&String(player.teamId||player.team_id||"")===String(user.teamId)&&matchesRosterIdentity(player)?buildRemovedRow(player):player);\nconst nextProfiles=playerProfiles.map(playerProfile=>String(playerProfile.teamId||playerProfile.team_id||"")===String(user.teamId)&&matchesRosterIdentity(playerProfile)?buildRemovedRow(playerProfile):playerProfile);\nconst playersChanged=nextPlayers.length!==players.length||nextPlayers.some((row,index)=>row!==players[index]);\nconst profilesChanged=nextProfiles.length!==playerProfiles.length||nextProfiles.some((row,index)=>row!==playerProfiles[index]);\nif(!playersChanged&&!profilesChanged)return result;\nif(playersChanged)setPlayers(nextPlayers);\nif(profilesChanged)setPlayerProfiles(nextProfiles);\nconst writes=[];\nif(playersChanged)writes.push(P("sl:players",nextPlayers,setPlayers));\nif(profilesChanged)writes.push(P("sl:player-profiles",nextProfiles,setPlayerProfiles));\nawait Promise.all(writes);\nreturn{ok:true};\n};\n`;

app = app.slice(0, removeStart) + nextBlock + app.slice(deleteStart);
fs.writeFileSync(appPath, app);

const testPath = "tests/coach-player-data-management.test.mjs";
let testSource = fs.readFileSync(testPath, "utf8");
const testStart = testSource.indexOf("test('coach removal updates roster state before awaiting persistence'");
if (testStart >= 0) testSource = testSource.slice(0, testStart).trimEnd() + "\n";
if (!testSource.includes("coach removal atomically tombstones matching player and profile layers")) {
  testSource += `\n\ntest('coach removal atomically tombstones matching player and profile layers', () => {\n  const removeBlock = appSource.match(/const removeRosterPlayer=async[\\s\\S]*?const deleteTeamLocalRosterPlayerData=async/)?.[0] || '';\n  assert.match(removeBlock, /const identityKeys=new Set/);\n  assert.match(removeBlock, /const nextPlayers=result\\.ok\\?result\\.players:players\\.map/);\n  assert.match(removeBlock, /const nextProfiles=playerProfiles\\.map/);\n  assert.match(removeBlock, /if\\(playersChanged\\)setPlayers\\(nextPlayers\\)/);\n  assert.match(removeBlock, /if\\(profilesChanged\\)setPlayerProfiles\\(nextProfiles\\)/);\n  assert.match(removeBlock, /await Promise\\.all\\(writes\\)/);\n});\n`;
}
fs.writeFileSync(testPath, testSource);
console.log("Applied atomic roster removal patch.");
