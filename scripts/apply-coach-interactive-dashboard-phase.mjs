import fs from "node:fs";

const appPath = "src/App.jsx";
let source = fs.readFileSync(appPath, "utf8");

const replaceExact = (before, after, label) => {
  if (after && source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`${label} anchor missing`);
  source = source.replace(before, after);
};

const replacePattern = (pattern, replacement, label) => {
  if (typeof replacement === "string" && source.includes(replacement)) return;
  if (!pattern.test(source)) throw new Error(`${label} pattern missing`);
  source = source.replace(pattern, replacement);
};

replaceExact(
  'import SemanticStatus from "./components/SemanticStatus.jsx";\nimport "./styles/PremiumWorkspace.css";',
  'import SemanticStatus from "./components/SemanticStatus.jsx";\nimport { DashboardSection } from "./components/CoachDashboardPrimitives.jsx";\nimport { CoachEventsInteractiveDashboard, CoachPageDashboardHeader, CoachPlayersInteractiveDashboard } from "./components/CoachInteractiveDashboards.jsx";\nimport "./styles/PremiumWorkspace.css";\nimport "./styles/CoachInteractiveDashboard.css";',
  "dashboard component imports",
);

replaceExact(
  '} from "./lib/coachDashboardSelectors.js";\nconst VOLT',
  '} from "./lib/coachDashboardSelectors.js";\nimport { buildCoachEventDashboardMetrics, buildCoachEventDashboardRows, buildCoachPageDashboardSummary, buildCoachPlayerDashboardMetrics, buildCoachPlayerDashboardRows, filterCoachEventDashboardRows, filterCoachPlayerDashboardRows } from "./lib/coachOperationalDashboard.js";\nconst VOLT',
  "dashboard selector imports",
);

replaceExact(
  'const[eventFilter,setEventFilter]=useState("all"),[eventSaveError,setEventSaveError]=useState("");',
  'const[eventFilter,setEventFilter]=useState("all"),[eventSaveError,setEventSaveError]=useState(""),[playerDashboardFilter,setPlayerDashboardFilter]=useState("all"),[playerDashboardQuery,setPlayerDashboardQuery]=useState(""),[eventDashboardStatus,setEventDashboardStatus]=useState("upcoming"),[eventDashboardQuery,setEventDashboardQuery]=useState(""),[coachPageMetric,setCoachPageMetric]=useState("active");',
  "dashboard interaction state",
);

replaceExact(
  'const filteredEvents=useMemo(()=>eventFilter==="all"?sortedEvents:sortedEvents.filter(ev=>String(ev.type||"").toLowerCase()===eventFilter.toLowerCase()),[sortedEvents,eventFilter]);\n',
  '',
  "legacy event filter derivation",
);

const derivedAnchor = 'const primaryQuickAction=highlightAddPlayer?"addPlayer":highlightAddDrill?"addDrill":highlightScheduleEvent?"scheduleEvent":null;';
const derivedBlock = `${derivedAnchor}\nconst coachPlayerDashboardRows=useMemo(()=>buildCoachPlayerDashboardRows({players:coachRosterPlayers,scores:safeScores,shotLogs,rsvps:safeRsvps,scLogs:safeScLogs,weekStart:weekStr}),[coachRosterPlayers,safeScores,shotLogs,safeRsvps,safeScLogs,weekStr]);\nconst coachPlayerDashboardMetrics=useMemo(()=>buildCoachPlayerDashboardMetrics(coachPlayerDashboardRows),[coachPlayerDashboardRows]);\nconst filteredCoachPlayerDashboardRows=useMemo(()=>filterCoachPlayerDashboardRows(coachPlayerDashboardRows,{filter:playerDashboardFilter,query:playerDashboardQuery}),[coachPlayerDashboardRows,playerDashboardFilter,playerDashboardQuery]);\nconst filteredCoachRosterPlayers=useMemo(()=>filteredCoachPlayerDashboardRows.map(row=>row.player),[filteredCoachPlayerDashboardRows]);\nconst coachEventDashboardRows=useMemo(()=>buildCoachEventDashboardRows({events:safeEvents,rsvps:safeRsvps,roster:coachRosterPlayers,today}),[safeEvents,safeRsvps,coachRosterPlayers,today]);\nconst coachEventDashboardMetrics=useMemo(()=>buildCoachEventDashboardMetrics(coachEventDashboardRows),[coachEventDashboardRows]);\nconst filteredCoachEventDashboardRows=useMemo(()=>filterCoachEventDashboardRows(coachEventDashboardRows,{status:eventDashboardStatus,type:eventFilter,query:eventDashboardQuery}),[coachEventDashboardRows,eventDashboardStatus,eventFilter,eventDashboardQuery]);\nconst filteredEvents=useMemo(()=>filteredCoachEventDashboardRows.map(row=>row.event),[filteredCoachEventDashboardRows]);\nconst coachPageDashboardSummary=useMemo(()=>buildCoachPageDashboardSummary({drills,programDrills,scSessions,scRsvps:safeScRsvps,scLogs:safeScLogs,leaderboardRows:canonicalCoachHomeLeaderboardRows,activityRows:safeScores,seasonArchives}),[drills,programDrills,scSessions,safeScRsvps,safeScLogs,canonicalCoachHomeLeaderboardRows,safeScores,seasonArchives]);`;
replaceExact(derivedAnchor, derivedBlock, "dashboard derived models");

const playersHeaderPattern = /<DashboardReturnButton onClick=\{\(\)=>setTab\("feed"\)\} \/><PageHeader title="PLAYERS"[\s\S]*?<div id="coach-add-player-form">/;
replacePattern(
  playersHeaderPattern,
  '<DashboardReturnButton onClick={()=>setTab("feed")} /><CoachPlayersInteractiveDashboard metrics={coachPlayerDashboardMetrics} rows={coachPlayerDashboardRows} filter={playerDashboardFilter} query={playerDashboardQuery} onFilterChange={setPlayerDashboardFilter} onQueryChange={setPlayerDashboardQuery} onAddPlayer={()=>document.getElementById("coach-add-player-form")?.scrollIntoView({behavior:"smooth",block:"start"})} onOpenArchives={()=>document.getElementById("coach-season-tools")?.scrollIntoView({behavior:"smooth",block:"start"})}/><DashboardSection eyebrow="Account activation" title="Add a player" summary="Create the roster relationship and send a secure account setup invitation." action={{label:"View roster",onClick:()=>document.getElementById("coach-roster-operations")?.scrollIntoView({behavior:"smooth",block:"start"})}} testId="coach-player-invite-dashboard-section"><div id="coach-add-player-form">',
  "players dashboard header",
);

replaceExact(
  '<CoachPlayerInviteForm coach={u} teamId={u?.teamId||""} onProvisioned={()=>{void hydratePersistedData();}}/>\n    </div>',
  '<CoachPlayerInviteForm coach={u} teamId={u?.teamId||""} onProvisioned={()=>{void hydratePersistedData();}}/>\n    </div></DashboardSection>',
  "player invite dashboard section",
);

replaceExact('<div data-testid="coach-season-archive"', '<div id="coach-season-tools" data-testid="coach-season-archive"', "season tools anchor");
replaceExact(
  '<CoachRoster players={coachRosterPlayers} scores={scores} shotLogs={shotLogs} drills={drills} nudged={nudged} setNudged={setNudged} onRemovePlayer={removeRosterPlayer} onSelectPlayer={setSelP}/>',
  '<div id="coach-roster-operations" className="coachDashboardOperationalContent">{filteredCoachPlayerDashboardRows.length===0&&<div className="coachDashboardNoResults">No players match the current dashboard filters.</div>}<CoachRoster players={filteredCoachRosterPlayers} scores={scores} shotLogs={shotLogs} drills={drills} nudged={nudged} setNudged={setNudged} onRemovePlayer={removeRosterPlayer} onSelectPlayer={setSelP}/></div>',
  "filtered coach roster",
);

const playerRouteStart = source.indexOf('{tab==="players"&&!selP');
const playerDetailStart = source.indexOf('{tab==="players"&&selP', playerRouteStart);
if (playerRouteStart < 0 || playerDetailStart < 0) throw new Error("players route boundaries missing");
const playerRoute = source.slice(playerRouteStart, playerDetailStart);
if (!playerRoute.includes('{filteredCoachPlayerDashboardRows.map(({player:p},i)=>')) {
  if (!playerRoute.includes('{ups.map((p,i)=>')) throw new Error("filtered player details list anchor missing");
  source = source.slice(0, playerRouteStart) + playerRoute.replace('{ups.map((p,i)=>', '{filteredCoachPlayerDashboardRows.map(({player:p},i)=>') + source.slice(playerDetailStart);
}

const eventsRouteAnchor = '{tab==="events"&&<div className={`page pageShell fade-up ${isDesktop?"accent-card":"coach-events-mobile-surface"}`} data-accent="events" id="coach-events-management" style={isDesktop?shellVars("events"):{...shellVars("events"),padding:0,border:0,background:"transparent",boxShadow:"none"}}>{isDesktop&&<DashboardReturnButton onClick={()=>setTab("feed")} />}';
const eventsDashboard = `${eventsRouteAnchor}<CoachEventsInteractiveDashboard metrics={coachEventDashboardMetrics} rows={coachEventDashboardRows} status={eventDashboardStatus} type={eventFilter} query={eventDashboardQuery} onStatusChange={setEventDashboardStatus} onTypeChange={setEventFilter} onQueryChange={setEventDashboardQuery} onCreateEvent={openEventCreateFlow} onOpenEvent={setExpEv}/>{filteredEvents.length===0&&safeEvents.length>0&&<div className="coachDashboardNoResults">No events match the current dashboard filters.</div>}`;
replaceExact(eventsRouteAnchor, eventsDashboard, "events dashboard composition");
replaceExact('<div className="coachEventsHeaderCard">', '<div className="coachEventsHeaderCard dashboardLegacyHeader">', "desktop events legacy header");
replaceExact('<header data-testid="coach-events-mobile-header"', '<header className="dashboardLegacyHeader" data-testid="coach-events-mobile-header"', "mobile events legacy header");
replaceExact('const grouped=[...events].sort(', 'const grouped=[...filteredEvents].sort(', "filtered mobile event groups");

const drillsPattern = /<PageHeader title="DRILLS"[\s\S]*?<SH isCoach=/;
replacePattern(
  drillsPattern,
  '<CoachPageDashboardHeader eyebrow="Development operations" title="Drills Dashboard" summary="Manage the training library, program standards, and player execution pathways." status={`${coachPageDashboardSummary.drills.total} total options`} actions={[{key:"add",label:"Add Drill",onClick:()=>setShowNewDrill(true)}]} metrics={[{key:"active",label:"At Home Library",value:coachPageDashboardSummary.drills.active,detail:"Player-facing drills"},{key:"program",label:"Program Set",value:coachPageDashboardSummary.drills.program,detail:"Coach-scored standards",tone:"info"},{key:"total",label:"Total Options",value:coachPageDashboardSummary.drills.total,detail:"All development paths",tone:"positive"},{key:"create",label:"Custom Capacity",value:`${customProgramDrillCount}/7`,detail:"Program drill slots"}]} activeMetric={coachPageMetric} onMetricSelect={(key)=>{setCoachPageMetric(key);if(key==="create")setShowNewDrill(true);else document.getElementById("coach-drills-management")?.scrollIntoView({behavior:"smooth",block:"start"});}} testId="coach-page-dashboard-drills"/><SH isCoach=',
  "drills dashboard header",
);

const leaderboardsPattern = /<DashboardReturnButton onClick=\{\(\)=>setTab\("feed"\)\} \/>\s*<PremiumLeaderboardsHub/;
replacePattern(
  leaderboardsPattern,
  '<DashboardReturnButton onClick={()=>setTab("feed")} /><CoachPageDashboardHeader eyebrow="Competitive intelligence" title="Leaderboards Dashboard" summary="Track ranking movement, participation depth, and the players setting the current standard." status={coachPageDashboardSummary.leaderboards.leader?`Leader: ${coachPageDashboardSummary.leaderboards.leader.name||coachPageDashboardSummary.leaderboards.leader.email||"Player"}`:"No ranked players"} metrics={[{key:"ranked",label:"Ranked Players",value:coachPageDashboardSummary.leaderboards.ranked,detail:"Active roster entries"},{key:"leader",label:"Current Leader",value:coachPageDashboardSummary.leaderboards.leader?.total||coachPageDashboardSummary.leaderboards.leader?.makes||0,detail:coachPageDashboardSummary.leaderboards.leader?.name||"No leader yet",tone:"positive"},{key:"archives",label:"Archived Seasons",value:coachPageDashboardSummary.archives.total,detail:"Historical comparisons",tone:"info"},{key:"scope",label:"View",value:"LIVE",detail:"Current team scope"}]} activeMetric={coachPageMetric} onMetricSelect={(key)=>setCoachPageMetric(key)} testId="coach-page-dashboard-leaderboards"/><PremiumLeaderboardsHub',
  "leaderboards dashboard header",
);

if (!source.includes('testId="coach-page-dashboard-strength"')) {
  const scPattern = /(\{tab==="sc"&&<div[^\n]*>)/;
  if (!scPattern.test(source)) throw new Error("strength dashboard route pattern missing");
  const strengthDashboard = '<CoachPageDashboardHeader eyebrow="Performance operations" title="Strength & Conditioning Dashboard" summary="Monitor session volume, player commitment, and compliance from one operational view." status={`${coachPageDashboardSummary.strength.sessions} sessions`} actions={[{key:"add",label:"Add Session",onClick:openCoachScSessionForm}]} metrics={[{key:"sessions",label:"Sessions",value:coachPageDashboardSummary.strength.sessions,detail:"Scheduled team work"},{key:"rsvps",label:"RSVPs",value:coachPageDashboardSummary.strength.rsvps,detail:"Player commitments",tone:"info"},{key:"logs",label:"Completed Logs",value:coachPageDashboardSummary.strength.logs,detail:"Recorded work",tone:"positive"},{key:"gaps",label:"Unlogged",value:Math.max(coachPageDashboardSummary.strength.rsvps-coachPageDashboardSummary.strength.logs,0),detail:"Commitments without logs",tone:"attention"}]} activeMetric={coachPageMetric} onMetricSelect={(key)=>{setCoachPageMetric(key);document.getElementById("coach-sc-session-form")?.scrollIntoView({behavior:"smooth",block:"start"});}} testId="coach-page-dashboard-strength"/>';
  source = source.replace(scPattern, `$1${strengthDashboard}`);
}

fs.writeFileSync(appPath, source);
console.log("Applied coach interactive dashboard phase.");
