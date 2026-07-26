import fs from "node:fs";

const appPath = "src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

const replaceOnce = (anchor, replacement, label) => {
  if (app.includes(replacement)) return;
  if (!app.includes(anchor)) throw new Error(`${label} anchor missing`);
  app = app.replace(anchor, replacement);
};

replaceOnce(
  '  {k:"branding",l:"Brand",accentVar:"--accent",svg:',
  '  {k:"activity",l:"Activity",accentVar:"--accent-feed",svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="M4 6l5-3 6 4 5-3"/></svg>},\n  {k:"branding",l:"Brand",accentVar:"--accent",svg:',
  "activity navigation item",
);

replaceOnce(
  '  getCoachNavItem("sc",{mobileLabel:"S&C",description:"Strength sessions and compliance"}),\n  {k:"leaderboards"',
  '  getCoachNavItem("sc",{mobileLabel:"S&C",description:"Strength sessions and compliance"}),\n  getCoachNavItem("activity",{mobileLabel:"Activity",description:"Filtered team signals and follow-up"}),\n  {k:"leaderboards"',
  "mobile activity destination",
);

replaceOnce(
  'data-accent={u.isCoach&&["feed","drills","events","sc","players"].includes(tab)?tab:"feed"}',
  'data-accent={u.isCoach&&["feed","drills","events","sc","players","activity"].includes(tab)?(tab==="activity"?"feed":tab):"feed"}',
  "activity workspace accent",
);

replaceOnce(
  'const coachTabs=["feed","drills","events","sc","players"];',
  'const coachTabs=["feed","drills","events","sc","players","activity"];',
  "activity coach tab registration",
);

const hiddenPanel = '<CoachActivityIntelligencePanel rows={filteredCoachActivityIntelligenceRows} scope={activityIntelligenceScope} query={activityIntelligenceQuery} onScopeChange={setActivityIntelligenceScope} onQueryChange={setActivityIntelligenceQuery} onOpenItem={(item)=>{if(item.type==="event")setEventDrawerId(item.source?.id||"");else openPlayerIntelligence(item.source||{});}}/><SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="ACTIVITY FEED" s="ALL SOURCES" identity/>';
replaceOnce(
  hiddenPanel,
  '<SH isCoach={typeof u!=="undefined"&&u?.isCoach} t="ACTIVITY FEED" s="ALL SOURCES" identity/>',
  "remove hidden activity panel",
);

replaceOnce(
  'setActivityIntelligenceScope("all");setTab("feed");setPlayerDrawerKey("");',
  'setActivityIntelligenceScope("all");setTab("activity");setPlayerDrawerKey("");',
  "player activity handoff",
);

const leaderboardsAnchor = '  {tab==="leaderboards"&&<div className="page pageShell fade-up"';
const activityRoute = `  {tab==="activity"&&<div className="page pageShell fade-up" data-accent="feed" style={shellVars("feed")}><DashboardReturnButton onClick={()=>setTab("feed")} /><CoachPageDashboardHeader eyebrow="Team intelligence" title="Activity Dashboard" summary="Filter shooting, drill, S&C, and schedule signals into one decision-ready team stream." status={\`${'${filteredCoachActivityIntelligenceRows.length}'} visible signals\`} metrics={[{key:"all",label:"All Signals",value:coachActivityIntelligenceRows.length,detail:"Current operational stream"},{key:"shooting",label:"Shooting",value:coachActivityIntelligenceRows.filter(row=>row.type==="shooting").length,detail:"Home-shot activity",tone:"positive"},{key:"strength",label:"S&C",value:coachActivityIntelligenceRows.filter(row=>row.type==="strength").length,detail:"Completed strength work",tone:"info"},{key:"event",label:"Events",value:coachActivityIntelligenceRows.filter(row=>row.type==="event").length,detail:"Upcoming schedule signals"}]} activeMetric={activityIntelligenceScope} onMetricSelect={(key)=>setActivityIntelligenceScope(key)} testId="coach-page-dashboard-activity"/><CoachActivityIntelligencePanel rows={filteredCoachActivityIntelligenceRows} scope={activityIntelligenceScope} query={activityIntelligenceQuery} onScopeChange={setActivityIntelligenceScope} onQueryChange={setActivityIntelligenceQuery} onOpenItem={(item)=>{if(item.type==="event")setEventDrawerId(item.source?.id||"");else openPlayerIntelligence(item.source||{});}}/></div>}\n\n`;
if (!app.includes('testId="coach-page-dashboard-activity"')) {
  if (!app.includes(leaderboardsAnchor)) throw new Error("leaderboards route anchor missing");
  app = app.replace(leaderboardsAnchor, activityRoute + leaderboardsAnchor);
}

fs.writeFileSync(appPath, app);

const contractPath = "tests/coach-dashboard-phase-2-contract.test.mjs";
let contract = fs.readFileSync(contractPath, "utf8");
if (!contract.includes("activity intelligence is a reachable coach workspace")) {
  contract += `\n\ntest("activity intelligence is a reachable coach workspace", () => {\n  assert.match(appSource, /k:\"activity\",l:\"Activity\"/);\n  assert.match(appSource, /testId=\"coach-page-dashboard-activity\"/);\n  assert.match(appSource, /tab===\"activity\"/);\n  assert.match(appSource, /setTab\\(\"activity\"\\)/);\n});\n`;
}
fs.writeFileSync(contractPath, contract);

const e2ePath = "tests/e2e/coach-dashboard-phase-2.spec.mjs";
let e2e = fs.readFileSync(e2ePath, "utf8");
e2e = e2e.replace(
  '  await expect(page.getByText("Team Lift", { exact: true }).first()).toBeVisible();\n  await expect(page.getByText("Recovery Session", { exact: true })).toHaveCount(0);',
  '  const strengthSessions = page.locator(\'[data-accent="sc"] .scSection\');\n  await expect(strengthSessions.filter({ hasText: "Team Lift" })).toBeVisible();\n  await expect(strengthSessions.filter({ hasText: "Recovery Session" })).toHaveCount(0);',
);
e2e = e2e.replace(
  '  await page.getByTestId("mobile-navigation-dock").getByRole("button", { name: "Home", exact: true }).click();\n  const intelligenceDisclosure = page.getByTestId("coach-program-intelligence");\n  await expect(intelligenceDisclosure).toBeVisible({ timeout: 20_000 });\n  await intelligenceDisclosure.locator("summary").click();\n  const activityPanel = page.getByTestId("coach-activity-intelligence-panel");',
  '  await openMoreDestination(page, "activity");\n  await expect(page.getByTestId("coach-page-dashboard-activity")).toBeVisible({ timeout: 20_000 });\n  const activityPanel = page.getByTestId("coach-activity-intelligence-panel");',
);
if (!e2e.includes('openMoreDestination(page, "activity")')) throw new Error("Activity E2E route was not updated");
fs.writeFileSync(e2ePath, e2e);

console.log("Applied dedicated Coach Activity workspace and browser coverage.");
