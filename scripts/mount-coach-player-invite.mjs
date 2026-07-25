import fs from "node:fs";

const appPath = "src/App.jsx";
let source = fs.readFileSync(appPath, "utf8");

const importNeedle = 'import NewSeasonWizard from "./components/NewSeasonWizard.jsx";';
const importReplacement = `${importNeedle}\nimport CoachPlayerInviteForm from "./components/CoachPlayerInviteForm.jsx";`;
if (!source.includes(importNeedle)) throw new Error("NewSeasonWizard import anchor not found");
if (!source.includes('CoachPlayerInviteForm from "./components/CoachPlayerInviteForm.jsx"')) source = source.replace(importNeedle, importReplacement);

const formPattern = /    <div id="coach-add-player-form" className="accent-card"[\s\S]*?\n    <\/div>\n\n(?=  \{tab==="players"&&!selP&&<div data-testid="coach-season-archive")/;
const matches = source.match(formPattern);
if (!matches) throw new Error("Coach add-player form anchor not found");
const replacement = `    <div id="coach-add-player-form">\n      <CoachPlayerInviteForm coach={u} teamId={u?.teamId||""} onProvisioned={()=>{void hydratePersistedData();}}/>\n    </div>\n\n`;
source = source.replace(formPattern, replacement);

fs.writeFileSync(appPath, source);
console.log("Mounted CoachPlayerInviteForm in App.jsx");
