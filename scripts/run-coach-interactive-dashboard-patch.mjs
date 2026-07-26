import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = "scripts/apply-coach-interactive-dashboard-phase.mjs";
const temporaryPath = path.resolve("scripts/.apply-coach-interactive-dashboard-phase.runtime.mjs");
let patchSource = fs.readFileSync(sourcePath, "utf8");

const startMarker = "if (!source.includes('testId=\"coach-page-dashboard-strength\"')) {";
const start = patchSource.indexOf(startMarker);
const end = patchSource.indexOf("\n\nfs.writeFileSync(appPath, source);", start);
if (start < 0 || end < 0) throw new Error("S&C patch block boundaries missing");

const strengthJsx = '<CoachPageDashboardHeader eyebrow="Performance operations" title="Strength & Conditioning Dashboard" summary="Monitor session volume, player commitment, and compliance from one operational view." status={`${coachPageDashboardSummary.strength.sessions} sessions`} actions={[{key:"add",label:"Add Session",onClick:openCoachScSessionForm}]} metrics={[{key:"sessions",label:"Sessions",value:coachPageDashboardSummary.strength.sessions,detail:"Scheduled team work"},{key:"rsvps",label:"RSVPs",value:coachPageDashboardSummary.strength.rsvps,detail:"Player commitments",tone:"info"},{key:"logs",label:"Completed Logs",value:coachPageDashboardSummary.strength.logs,detail:"Recorded work",tone:"positive"},{key:"gaps",label:"Unlogged",value:Math.max(coachPageDashboardSummary.strength.rsvps-coachPageDashboardSummary.strength.logs,0),detail:"Commitments without logs",tone:"attention"}]} activeMetric={coachPageMetric} onMetricSelect={(key)=>{setCoachPageMetric(key);if(key==="sessions")openCoachScSessionForm();else document.getElementById("coach-sc-session-form")?.scrollIntoView({behavior:"smooth",block:"start"});}} testId="coach-page-dashboard-strength"/>';
const replacement = [
  "const coachScPattern = /(\\{tab===\"sc\"&&<div className=\"page pageShell fade-up\" data-accent=\"sc\" style=\\{shellVars\\(\"sc\"\\)\\}><DashboardReturnButton onClick=\\{\\(\\)=>setTab\\(\"feed\"\\)\\} \\/>)[\\s\\S]*?<SH isCoach=/;",
  "replacePattern(",
  "  coachScPattern,",
  `  ${JSON.stringify(`$1${strengthJsx}<SH isCoach=`)},`,
  '  "strength dashboard header",',
  ");",
].join("\n");

patchSource = patchSource.slice(0, start) + replacement + patchSource.slice(end);
fs.writeFileSync(temporaryPath, patchSource);

try {
  await import(`${pathToFileURL(temporaryPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(temporaryPath, { force: true });
}
