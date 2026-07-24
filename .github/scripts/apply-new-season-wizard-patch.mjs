import fs from "node:fs";

const appPath = "src/App.jsx";
const workflowPath = ".github/workflows/apply-new-season-wizard-patch.yml";
const scriptPath = ".github/scripts/apply-new-season-wizard-patch.mjs";

let source = fs.readFileSync(appPath, "utf8");

const importNeedle = 'import PlayersScreen from "./screens/PlayersScreen";';
const importReplacement = `${importNeedle}\nimport NewSeasonWizard from "./components/NewSeasonWizard.jsx";`;

if (!source.includes('import NewSeasonWizard from "./components/NewSeasonWizard.jsx";')) {
  if (!source.includes(importNeedle)) throw new Error("PlayersScreen import anchor not found");
  source = source.replace(importNeedle, importReplacement);
}

const rosterNeedle = '    <CoachRoster players={coachRosterPlayers} scores={scores} shotLogs={shotLogs} drills={drills} nudged={nudged} setNudged={setNudged} onRemovePlayer={removeRosterPlayer} onSelectPlayer={setSelP}/>';
const wizardBlock = `    <div style={{marginBottom:18}}>
      <NewSeasonWizard
        coach={u}
        teamId={u?.teamId||""}
        seasonArchives={seasonArchives}
        existingActiveSeasons={[]}
        onCreated={(result)=>setSeasonArchiveMessage(result?.idempotent?"New season already existed safely.":"New active season created. Historical results were not copied.")}
      />
    </div>
${rosterNeedle}`;

if (!source.includes("<NewSeasonWizard")) {
  if (!source.includes(rosterNeedle)) throw new Error("CoachRoster integration anchor not found");
  source = source.replace(rosterNeedle, wizardBlock);
}

if (!source.includes('import NewSeasonWizard from "./components/NewSeasonWizard.jsx";')) {
  throw new Error("NewSeasonWizard import was not installed");
}
if (!source.includes("<NewSeasonWizard")) {
  throw new Error("NewSeasonWizard render was not installed");
}

fs.writeFileSync(appPath, source);

for (const temporaryPath of [workflowPath, scriptPath]) {
  if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
}
