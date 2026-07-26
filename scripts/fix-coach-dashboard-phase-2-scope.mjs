import fs from "node:fs";

const appPath = "src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

const playerStart = app.indexOf('function Player(');
const coachStart = app.indexOf('function Coach(');
if (playerStart < 0 || coachStart < 0 || coachStart <= playerStart) throw new Error("Player/Coach component boundaries missing");

let playerBlock = app.slice(playerStart, coachStart);
if (playerBlock.includes("visibleHomeDrills.map")) {
  playerBlock = playerBlock.replace("visibleHomeDrills.map", "drills.map");
}
if (playerBlock.includes("visibleProgramDrills") || playerBlock.includes("filteredCoach")) {
  throw new Error("Coach-only dashboard variables leaked into Player component");
}

let coachBlock = app.slice(coachStart);
const coachDrillStart = coachBlock.indexOf('{tab==="drills"&&!editD');
const coachDrillEnd = coachBlock.indexOf('{tab==="drills"&&editD', coachDrillStart);
if (coachDrillStart < 0 || coachDrillEnd < 0) throw new Error("Coach drill route boundaries missing");
let coachDrillBlock = coachBlock.slice(coachDrillStart, coachDrillEnd);
if (coachDrillBlock.includes("{drills.map(d=>")) {
  coachDrillBlock = coachDrillBlock.replace("{drills.map(d=>", "{visibleHomeDrills.map(d=>");
}
if (!coachDrillBlock.includes("visibleHomeDrills.map")) throw new Error("Coach home drill filter was not applied");
coachBlock = coachBlock.slice(0, coachDrillStart) + coachDrillBlock + coachBlock.slice(coachDrillEnd);
app = app.slice(0, playerStart) + playerBlock + coachBlock;
fs.writeFileSync(appPath, app);

const intelligencePath = "src/lib/coachOperationalIntelligence.js";
let intelligence = fs.readFileSync(intelligencePath, "utf8");
intelligence = intelligence
  .replace('...safeArray(scores).map((row) => ({ id: `score-${row.id || Math.random()}`', '...safeArray(scores).map((row, index) => ({ id: `score-${row.id || `${dateOf(row)}-${index}`}`')
  .replace('...safeArray(shotLogs).map((row) => ({ id: `shot-${row.id || Math.random()}`', '...safeArray(shotLogs).map((row, index) => ({ id: `shot-${row.id || `${dateOf(row)}-${index}`}`')
  .replace('...safeArray(scLogs).map((row) => ({ id: `sc-${row.id || Math.random()}`', '...safeArray(scLogs).map((row, index) => ({ id: `sc-${row.id || `${dateOf(row)}-${index}`}`');
if (intelligence.includes("Math.random")) throw new Error("Nondeterministic activity IDs remain");
fs.writeFileSync(intelligencePath, intelligence);

const contractPath = "tests/coach-dashboard-phase-2-contract.test.mjs";
let contract = fs.readFileSync(contractPath, "utf8");
if (!contract.includes("coach-only filter variables never leak into the Player component")) {
  contract += `\n\ntest("coach-only filter variables never leak into the Player component", () => {\n  const playerBlock = appSource.match(/function Player\\([\\s\\S]*?function Coach\\(/)?.[0] || "";\n  const coachBlock = appSource.match(/function Coach\\([\\s\\S]*/)?.[0] || "";\n  assert.doesNotMatch(playerBlock, /visibleHomeDrills|visibleProgramDrills|filteredCoachStrengthRows|filteredCoachLeaderboardIntelligenceRows/);\n  assert.match(playerBlock, /\\{drills\\.map\\(d=>/);\n  assert.match(coachBlock, /\\{visibleHomeDrills\\.map\\(d=>/);\n});\n`;
}
fs.writeFileSync(contractPath, contract);

console.log("Fixed Phase 2 route scope and deterministic activity identifiers.");
