import { readFileSync, writeFileSync } from "node:fs";

const appPath = new URL("../src/App.jsx", import.meta.url);
let source = readFileSync(appPath, "utf8");
const replaceOnce = (label, before, after) => {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${label}: expected seam not found`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`${label}: seam is not unique`);
  source = source.replace(before, after);
};

replaceOnce(
  "Coach operational import",
  'import { buildCoachEventDashboardMetrics, buildCoachEventDashboardRows, buildCoachPageDashboardSummary, buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows, filterCoachEventDashboardRows, filterCoachPlayerDashboardRows } from "./lib/coachOperationalDashboard.js";\n',
  'import { buildCoachEventDashboardMetrics, buildCoachEventDashboardRows, buildCoachPageDashboardSummary, buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows, buildCoachProgramPulse, filterCoachEventDashboardRows, filterCoachPlayerDashboardRows } from "./lib/coachOperationalDashboard.js";\n',
);
replaceOnce(
  "Standalone pulse import",
  'import { deriveCoachProgramPulse } from "./lib/coachProgramPulse.js";\n',
  "",
);
replaceOnce(
  "Standalone pulse derivation",
  'const coachProgramPulse=useMemo(()=>deriveCoachProgramPulse({roster:coachRosterPlayers,shotLogs:safeShotLogs,weeklyGoal:persistedCoachPriorities?.weeklyMakesTarget,weekStart:weekStr}),[coachRosterPlayers,safeShotLogs,persistedCoachPriorities?.weeklyMakesTarget,weekStr]);\n',
  "",
);
replaceOnce(
  "Reuse normalized Coach player rows",
  'const coachPlayerDashboardRows=useMemo(()=>buildCoachPlayerDashboardRows({players:coachRosterPlayers,scores:safeScores,shotLogs,rsvps:safeRsvps,scLogs:safeScLogs,weekStart:weekStr}),[coachRosterPlayers,safeScores,shotLogs,safeRsvps,safeScLogs,weekStr]);\n',
  'const coachPlayerDashboardRows=useMemo(()=>buildCoachPlayerDashboardRows({players:coachRosterPlayers,scores:safeScores,shotLogs,rsvps:safeRsvps,scLogs:safeScLogs,weekStart:weekStr}),[coachRosterPlayers,safeScores,shotLogs,safeRsvps,safeScLogs,weekStr]);\nconst coachProgramPulse=useMemo(()=>buildCoachProgramPulse(coachPlayerDashboardRows,persistedCoachPriorities?.weeklyMakesTarget),[coachPlayerDashboardRows,persistedCoachPriorities?.weeklyMakesTarget]);\n',
);
writeFileSync(appPath, source);
