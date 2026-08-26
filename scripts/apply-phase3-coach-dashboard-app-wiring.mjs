import { readFileSync, writeFileSync } from "node:fs";

const appPath = new URL("../src/App.jsx", import.meta.url);
let source = readFileSync(appPath, "utf8");

const replaceOnce = (label, before, after) => {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${label}: expected source seam was not found`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: source seam is not unique`);
  source = source.replace(before, after);
};

replaceOnce(
  "Program Pulse import",
  'import { buildCoachOperationalInsightRail, buildPlayerOperationalInsightRail } from "./lib/operationalInsightRails.js";\n',
  'import { buildCoachOperationalInsightRail, buildPlayerOperationalInsightRail } from "./lib/operationalInsightRails.js";\nimport { deriveCoachProgramPulse } from "./lib/coachProgramPulse.js";\n',
);

replaceOnce(
  "Program Pulse derivation",
  'const weekStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;\nconst activeThisWeek=',
  'const weekStr=`${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,"0")}-${String(weekStart.getDate()).padStart(2,"0")}`;\nconst coachProgramPulse=useMemo(()=>deriveCoachProgramPulse({roster:coachRosterPlayers,shotLogs:safeShotLogs,weeklyGoal:persistedCoachPriorities?.weeklyMakesTarget,weekStart:weekStr}),[coachRosterPlayers,safeShotLogs,persistedCoachPriorities?.weeklyMakesTarget,weekStr]);\nconst activeThisWeek=',
);

replaceOnce(
  "Program Pulse prop",
  '  activityItems={coachCommandActivityItems}\n  eventReadiness={coachEventDashboardMetrics.next}\n',
  '  activityItems={coachCommandActivityItems}\n  programPulse={coachProgramPulse}\n  eventReadiness={coachEventDashboardMetrics.next}\n',
);

writeFileSync(appPath, source);
