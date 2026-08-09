import { readFileSync } from "node:fs";

const fail = (message) => { throw new Error(`[phase3h-coach-players] ${message}`); };
const source = readFileSync("src/App.jsx", "utf8");

// Phase 5B.3 supersedes the old build-time disclosure rewrite. Coach Players now
// owns roster work only; season and account operations live in a stable route.
for (const marker of [
  '<CoachPlayersInteractiveDashboard',
  'id="coach-add-player-form"',
  'id="coach-roster-operations"',
  'onSelectPlayer={openPlayerIntelligence}',
  'testId="coach-administration-workspace"',
  'data-testid="coach-season-archive"',
  '<NewSeasonWizard',
  '<AccountTrustActions deleteAccount={deleteAccount} preserveTeamData/>',
]) {
  if (!source.includes(marker)) fail(`current Coach information architecture is missing ${marker}`);
}

const playersStart = source.indexOf('{tab==="players"&&!selP');
const administrationStart = source.indexOf('{tab==="settings"', playersStart);
if (playersStart < 0 || administrationStart <= playersStart) fail("Coach Players route boundaries were not found");
const playersRoute = source.slice(playersStart, administrationStart);

for (const misplaced of ["coach-season-archive", "<NewSeasonWizard", "DEMO SETTINGS", "LEGAL & SUPPORT", "<AccountTrustActions"]) {
  if (playersRoute.includes(misplaced)) fail(`Coach Players still contains administration marker ${misplaced}`);
}

console.log("Phase 3H compatibility verified against the Phase 5B.3 Coach information architecture.");
